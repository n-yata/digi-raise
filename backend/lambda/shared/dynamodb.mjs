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
    client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
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
