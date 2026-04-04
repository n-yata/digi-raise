import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from './dynamodb.mjs';

let apigwClient = null;

/**
 * API Gateway Management API クライアントのシングルトンを返す
 * @returns {ApiGatewayManagementApiClient}
 */
export function getApiGwClient() {
  if (!apigwClient) {
    const endpoint = process.env.APIGW_ENDPOINT;
    if (!endpoint) {
      throw new Error('APIGW_ENDPOINT environment variable is not set');
    }
    apigwClient = new ApiGatewayManagementApiClient({ endpoint });
  }
  return apigwClient;
}

/**
 * 指定の接続IDにメッセージを送信する
 * GoneException（接続済みの場合）は connections テーブルから削除して続行
 *
 * @param {string} connectionId - 送信先の WebSocket 接続ID
 * @param {object} data - 送信するJSONペイロード
 * @returns {Promise<void>}
 */
export async function postToConnection(connectionId, data) {
  const client = getApiGwClient();
  const payload = JSON.stringify(data);

  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(payload),
      })
    );
  } catch (err) {
    if (err.name === 'GoneException' || err.$metadata?.httpStatusCode === 410) {
      // 接続が切断済み: connections テーブルから削除してエラーを握りつぶす
      console.warn(
        `[apigw] Connection ${connectionId} is gone. Removing from connections table.`
      );
      const connectionsTable = process.env.CONNECTIONS_TABLE;
      if (connectionsTable) {
        try {
          const docClient = getDocumentClient();
          await docClient.send(
            new DeleteCommand({
              TableName: connectionsTable,
              Key: { connectionId },
            })
          );
        } catch (deleteErr) {
          console.error(
            `[apigw] Failed to delete stale connection ${connectionId}:`,
            deleteErr
          );
        }
      }
    } else {
      // その他のエラーは呼び出し元に再スロー
      throw err;
    }
  }
}
