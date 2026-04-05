/**
 * Generate HMAC token for local $connect testing.
 * Writes token and ts directly into events/connect.json.
 *
 * Usage:
 *   node events/gen-token.mjs
 *   node events/gen-token.mjs my-custom-secret
 */

import { createHmac } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const secretKey = process.argv[2] || 'local-dev-secret-key';
const ts = Math.floor(Date.now() / 1000).toString();
const token = createHmac('sha256', secretKey)
  .update(`ws-auth:${ts}`)
  .digest('hex');

const connectJsonPath = join(__dirname, 'connect.json');
const connectJson = JSON.parse(readFileSync(connectJsonPath, 'utf8'));
connectJson.queryStringParameters.token = token;
connectJson.queryStringParameters.ts = ts;
writeFileSync(connectJsonPath, JSON.stringify(connectJson, null, 2) + '\n', 'utf8');

console.log('Updated events/connect.json:');
console.log(`  ts:    ${ts}`);
console.log(`  token: ${token}`);
console.log('');
console.log('Run: sam local invoke ConnectFunction -e events/connect.json');
