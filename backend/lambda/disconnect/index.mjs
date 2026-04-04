/**
 * Lambda: $disconnect ルート
 *
 * 処理フロー:
 * 1. connections テーブルから接続レコードを取得
 * 2. roomCode が設定されていた場合のルームクリーンアップ
 *    - battling 中なら相手を winner として記録し、相手に通知
 * 3. connections テーブルからレコードを削除
 */

import { GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../shared/dynamodb.mjs';
import { postToConnection } from '../shared/apigw.mjs';

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const ROOMS_TABLE = process.env.ROOMS_TABLE;

/**
 * バトル中のルームを切断プレイヤー抜きで終了させる
 *
 * @param {string} connectionId - 切断した接続ID
 * @param {object} room - ルームレコード
 */
async function handleBattlingRoomDisconnect(connectionId, room) {
  const docClient = getDocumentClient();
  const isHost = room.hostConnectionId === connectionId;
  const winnerRole = isHost ? 'guest' : 'host';
  const opponentConnectionId = isHost
    ? room.guestConnectionId
    : room.hostConnectionId;

  // ルームを finished 状態に更新し、winner を記録
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode: room.roomCode },
        UpdateExpression: 'SET #status = :finished, winner = :winner',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':finished': 'finished',
          ':winner': winnerRole,
        },
      })
    );
  } catch (err) {
    console.error(
      `[disconnect] Failed to update room ${room.roomCode} to finished:`,
      err
    );
  }

  // 相手プレイヤーへ通知（失敗してもクリーンアップは続行）
  if (opponentConnectionId) {
    try {
      await postToConnection(opponentConnectionId, {
        event: 'opponent_disconnected',
      });
    } catch (err) {
      console.error(
        `[disconnect] Failed to notify opponent ${opponentConnectionId}:`,
        err
      );
    }
  }
}

export const handler = async (event) => {
  const connectionId = event.requestContext?.connectionId;
  const docClient = getDocumentClient();

  // --- 1. connections テーブルから接続レコードを取得 ---
  let connectionRecord = null;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
      })
    );
    connectionRecord = result.Item || null;
  } catch (err) {
    console.error(
      `[disconnect] Failed to get connection record ${connectionId}:`,
      err
    );
  }

  // --- 2. roomCode が設定されていた場合のルームクリーンアップ ---
  if (connectionRecord?.roomCode) {
    try {
      const roomResult = await docClient.send(
        new GetCommand({
          TableName: ROOMS_TABLE,
          Key: { roomCode: connectionRecord.roomCode },
        })
      );
      const room = roomResult.Item;

      if (room && room.status === 'battling') {
        await handleBattlingRoomDisconnect(connectionId, room);
      }
    } catch (err) {
      console.error(
        `[disconnect] Failed to handle room cleanup for ${connectionRecord.roomCode}:`,
        err
      );
    }
  }

  // --- 3. connections テーブルからレコードを削除 ---
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
      })
    );
  } catch (err) {
    console.error(
      `[disconnect] Failed to delete connection record ${connectionId}:`,
      err
    );
  }

  console.info(`[disconnect] Connection removed: ${connectionId}`);
  return { statusCode: 200 };
};
