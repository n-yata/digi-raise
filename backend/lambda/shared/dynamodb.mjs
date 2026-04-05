import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let client = null;
let docClient = null;

/**
 * DynamoDB クライアントのシングルトンを返す
 * @returns {DynamoDBClient}
 */
export function getDynamoDBClient() {
  if (!client) {
    const isLocal = process.env.AWS_SAM_LOCAL === 'true';
    // DYNAMODB_ENDPOINT 優先、次に SAM local 実行を自動検知して DynamoDB Local を使用
    // sam local invoke --docker-network backend_default で同一ネットワークに接続する
    const endpoint =
      process.env.DYNAMODB_ENDPOINT ||
      (isLocal ? 'http://digi-raise-dynamodb-local:8000' : undefined);

    client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      ...(endpoint && { endpoint }),
      // SAM local では docker-compose セットアップコンテナと同じ認証情報を使用
      ...(isLocal && {
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      }),
    });
  }
  return client;
}

/**
 * DynamoDB Document クライアントのシングルトンを返す
 * マーシャリング/アンマーシャリングを自動で処理する
 * @returns {DynamoDBDocumentClient}
 */
export function getDocumentClient() {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getDynamoDBClient(), {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });
  }
  return docClient;
}
