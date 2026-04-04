/**
 * Lambda: $connect ルート
 *
 * 処理フロー:
 * 1. メンテナンスモード確認
 * 2. HMAC-SHA256 トークン検証（±60秒）
 * 3. connections テーブルへ新規レコード作成
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../shared/dynamodb.mjs';

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const CONFIG_TABLE = process.env.CONFIG_TABLE;
const SECRET_KEY = process.env.SECRET_KEY;

/** メンテナンスモードかどうかを確認する */
async function isMaintenanceMode() {
  const docClient = getDocumentClient();
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: CONFIG_TABLE,
        Key: { configKey: 'maintenance_mode' },
      })
    );
    return result.Item?.value === true;
  } catch (err) {
    console.error('[connect] Failed to check maintenance mode:', err);
    // フェイルオープン: 設定取得失敗時はメンテナンス扱いにしない
    return false;
  }
}

/**
 * HMAC-SHA256 トークンを検証する
 * token = HMAC-SHA256(timestamp + SECRET_KEY)
 *
 * @param {string} token - クエリパラメータの token
 * @param {string} ts - クエリパラメータの ts（Unix秒文字列）
 * @returns {boolean}
 */
function verifyToken(token, ts) {
  if (!token || !ts) return false;

  const tsNum = parseInt(ts, 10);
  if (isNaN(tsNum)) return false;

  // タイムスタンプが ±60秒以内かチェック
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 60) {
    console.warn(`[connect] Token timestamp expired: ts=${ts}, now=${nowSec}`);
    return false;
  }

  // HMAC 検証（タイミング攻撃対策で timingSafeEqual を使用）
  // メッセージ形式はフロントエンドの wsToken.ts に合わせる: "ws-auth:{ts}"
  const expected = createHmac('sha256', SECRET_KEY)
    .update(`ws-auth:${ts}`)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const tokenBuf = Buffer.from(token, 'hex');
    if (expectedBuf.length !== tokenBuf.length) return false;
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}

export const handler = async (event) => {
  const connectionId = event.requestContext?.connectionId;

  // --- 1. メンテナンスモード確認 ---
  const maintenance = await isMaintenanceMode();
  if (maintenance) {
    console.info('[connect] Rejected due to maintenance mode');
    return { statusCode: 503 };
  }

  // --- 2. トークン検証 ---
  const queryParams = event.queryStringParameters || {};
  const { token, ts } = queryParams;

  if (!verifyToken(token, ts)) {
    console.warn(`[connect] Token verification failed for connection ${connectionId}`);
    return { statusCode: 401 };
  }

  // --- 3. connections テーブルへ登録 ---
  const nowSec = Math.floor(Date.now() / 1000);
  const ttl = nowSec + 3600; // 1時間

  try {
    const docClient = getDocumentClient();
    await docClient.send(
      new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: {
          connectionId,
          connectedAt: nowSec,
          lastPingAt: nowSec,
          messageCount: 0,
          ttl,
        },
      })
    );
  } catch (err) {
    console.error(`[connect] Failed to register connection ${connectionId}:`, err);
    return { statusCode: 500 };
  }

  console.info(`[connect] Connection registered: ${connectionId}`);
  return { statusCode: 200 };
};
