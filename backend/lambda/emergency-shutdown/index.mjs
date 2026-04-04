/**
 * Lambda: emergency-shutdown
 *
 * DynamoDB DigiRaiseConfig テーブルに maintenance_mode = true を書き込む。
 * CloudWatch Alarm から SNS 経由でトリガーされることを想定している。
 *
 * SNS メール通知は CloudWatch Alarm の設定側で対応する。
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../shared/dynamodb.mjs';

const CONFIG_TABLE = process.env.CONFIG_TABLE;

export const handler = async (event) => {
  console.info('[emergency-shutdown] Triggered. Enabling maintenance mode.');
  console.info('[emergency-shutdown] Event:', JSON.stringify(event, null, 2));

  if (!CONFIG_TABLE) {
    console.error('[emergency-shutdown] CONFIG_TABLE environment variable is not set');
    return { statusCode: 500, body: 'CONFIG_TABLE is not configured' };
  }

  const docClient = getDocumentClient();
  const nowSec = Math.floor(Date.now() / 1000);

  try {
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          configKey: 'maintenance_mode',
          value: true,
          updatedAt: nowSec,
          reason: 'Emergency shutdown triggered by CloudWatch Alarm',
        },
      })
    );
  } catch (err) {
    console.error('[emergency-shutdown] Failed to set maintenance_mode:', err);
    return { statusCode: 500, body: 'Failed to enable maintenance mode' };
  }

  console.info('[emergency-shutdown] Maintenance mode enabled successfully.');
  return { statusCode: 200, body: 'Maintenance mode enabled' };
};
