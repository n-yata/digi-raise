/**
 * Lambda: $default ルート（メッセージハンドラー）
 *
 * 受け付けるアクション:
 *   create_room, join_room, ready, select_action, ping, leave_room
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../shared/dynamodb.mjs';
import { postToConnection } from '../shared/apigw.mjs';

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const ROOMS_TABLE = process.env.ROOMS_TABLE;

// ============================================================
// バリデーション
// ============================================================

/**
 * Creature データを検証する
 * @param {object} creature
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateCreature(creature) {
  if (!creature || typeof creature !== 'object') {
    return { valid: false, reason: 'creature is required' };
  }

  const { evolutionStage, hp, maxHp, atk, def, spd } = creature;

  if (
    typeof evolutionStage !== 'number' ||
    evolutionStage < 0 ||
    evolutionStage > 5
  ) {
    return { valid: false, reason: 'evolutionStage must be 0-5' };
  }

  if (typeof hp !== 'number' || typeof maxHp !== 'number' || hp < 0 || maxHp <= 0 || hp > maxHp) {
    return { valid: false, reason: 'hp must be >= 0 and not exceed maxHp' };
  }

  const statMax = 500;
  if (typeof atk !== 'number' || atk < 0 || atk > statMax) {
    return { valid: false, reason: `atk must be 0-${statMax}` };
  }
  if (typeof def !== 'number' || def < 0 || def > statMax) {
    return { valid: false, reason: `def must be 0-${statMax}` };
  }
  if (typeof spd !== 'number' || spd < 0 || spd > statMax) {
    return { valid: false, reason: `spd must be 0-${statMax}` };
  }

  return { valid: true };
}

/**
 * Creature から相手に見せるスナップショットを作成する（センシティブ情報を除外）
 * @param {object} creature
 * @returns {object}
 */
function toCreatureSnapshot(creature) {
  const {
    id,
    name,
    type,
    evolutionStage,
    level,
    hp,
    maxHp,
    atk,
    def,
    spd,
    evolutionName,
  } = creature;
  return { id, name, type, evolutionStage, level, hp, maxHp, atk, def, spd, evolutionName };
}

// ============================================================
// レート制限
// ============================================================

/**
 * メッセージカウントをアトミックにインクリメントし、レート制限を確認する
 * lastPingAt が60秒以上前なら messageCount をリセットする
 *
 * @param {string} connectionId
 * @returns {Promise<{ allowed: boolean, item?: object }>}
 */
async function checkRateLimit(connectionId) {
  const docClient = getDocumentClient();
  const nowSec = Math.floor(Date.now() / 1000);

  // まず現在のレコードを取得
  let item;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
      })
    );
    item = result.Item;
  } catch (err) {
    console.error(`[message] Failed to get connection record ${connectionId}:`, err);
    return { allowed: false };
  }

  if (!item) {
    console.warn(`[message] Connection record not found: ${connectionId}`);
    return { allowed: false };
  }

  // 60秒経過していれば messageCount をリセット
  const shouldReset = nowSec - (item.lastPingAt || 0) > 60;

  if (shouldReset) {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: CONNECTIONS_TABLE,
          Key: { connectionId },
          UpdateExpression: 'SET messageCount = :one, lastPingAt = :now',
          ExpressionAttributeValues: {
            ':one': 1,
            ':now': nowSec,
          },
        })
      );
      return { allowed: true, item: { ...item, messageCount: 1, lastPingAt: nowSec } };
    } catch (err) {
      console.error(`[message] Failed to reset messageCount for ${connectionId}:`, err);
      return { allowed: false };
    }
  }

  // アトミックにインクリメント（ConditionExpression でレート制限チェック）
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression: 'ADD messageCount :one SET lastPingAt = :now',
        ConditionExpression: 'messageCount <= :limit',
        ExpressionAttributeValues: {
          ':one': 1,
          ':now': nowSec,
          ':limit': 60,
        },
        ReturnValues: 'ALL_NEW',
      })
    );
    return { allowed: true, item: result.Attributes };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // レート制限超過: 接続を削除
      try {
        await docClient.send(
          new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId },
          })
        );
      } catch (deleteErr) {
        console.error(
          `[message] Failed to delete rate-limited connection ${connectionId}:`,
          deleteErr
        );
      }
      return { allowed: false, rateLimited: true };
    }
    console.error(`[message] Failed to increment messageCount for ${connectionId}:`, err);
    return { allowed: false };
  }
}

// ============================================================
// ルームコード生成
// ============================================================

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_MAX_RETRIES = 5;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

/** roomCode の形式を検証する（6桁の大文字英数字） */
function isValidRoomCode(roomCode) {
  return typeof roomCode === 'string' && ROOM_CODE_PATTERN.test(roomCode);
}

/** 6桁のランダムなルームコードを生成する */
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

// ============================================================
// アクションハンドラー
// ============================================================

/**
 * create_room: ルームを作成する
 */
async function handleCreateRoom(connectionId, payload) {
  const { creature } = payload;

  // クリーチャーバリデーション
  const validation = validateCreature(creature);
  if (!validation.valid) {
    console.warn(`[create_room] Invalid creature from ${connectionId}: ${validation.reason}`);
    return { statusCode: 400 };
  }

  const docClient = getDocumentClient();
  const nowSec = Math.floor(Date.now() / 1000);
  let roomCode = null;

  // 重複チェック付きで最大5回試行
  for (let attempt = 0; attempt < ROOM_CODE_MAX_RETRIES; attempt++) {
    const candidate = generateRoomCode();
    try {
      await docClient.send(
        new PutCommand({
          TableName: ROOMS_TABLE,
          Item: {
            roomCode: candidate,
            hostConnectionId: connectionId,
            hostCreature: creature,
            guestConnectionId: null,
            guestCreature: null,
            status: 'waiting',
            hostReady: false,
            guestReady: false,
            hostAction: null,
            guestAction: null,
            currentTurn: 0,
            turnPhase: 'select',
            seed: null,
            winner: null,
            createdAt: nowSec,
            ttl: nowSec + 7200, // 2時間
          },
          ConditionExpression: 'attribute_not_exists(roomCode)',
        })
      );
      roomCode = candidate;
      break;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        // ルームコードが重複: リトライ
        console.warn(`[create_room] Room code ${candidate} already exists, retrying...`);
        continue;
      }
      console.error(`[create_room] Failed to create room (attempt ${attempt + 1}):`, err);
      return { statusCode: 500 };
    }
  }

  if (!roomCode) {
    console.error('[create_room] Failed to generate unique room code after max retries');
    return { statusCode: 500 };
  }

  // connections テーブルに roomCode を記録
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression: 'SET roomCode = :roomCode',
        ExpressionAttributeValues: { ':roomCode': roomCode },
      })
    );
  } catch (err) {
    console.error(`[create_room] Failed to update connection with roomCode:`, err);
    // ルームは作成済みなので続行（クリーンアップは disconnect に任せる）
  }

  await postToConnection(connectionId, { event: 'room_created', roomCode });
  console.info(`[create_room] Room ${roomCode} created by ${connectionId}`);
  return { statusCode: 200 };
}

/**
 * join_room: ルームに参加する
 */
async function handleJoinRoom(connectionId, payload) {
  const { roomCode, creature } = payload;

  if (!isValidRoomCode(roomCode)) {
    await postToConnection(connectionId, {
      event: 'error',
      code: 'INVALID_PAYLOAD',
      message: 'roomCode must be 6 uppercase alphanumeric characters',
    });
    return { statusCode: 400 };
  }

  // クリーチャーバリデーション
  const validation = validateCreature(creature);
  if (!validation.valid) {
    console.warn(`[join_room] Invalid creature from ${connectionId}: ${validation.reason}`);
    return { statusCode: 400 };
  }

  const docClient = getDocumentClient();

  // ルームを取得
  let room;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
      })
    );
    room = result.Item;
  } catch (err) {
    console.error(`[join_room] Failed to get room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  if (!room) {
    await postToConnection(connectionId, {
      event: 'error',
      code: 'ROOM_NOT_FOUND',
      message: 'ルームが見つかりません',
    });
    return { statusCode: 404 };
  }

  if (room.status !== 'waiting') {
    await postToConnection(connectionId, {
      event: 'error',
      code: 'ROOM_NOT_AVAILABLE',
      message: 'このルームは現在参加できません',
    });
    return { statusCode: 409 };
  }

  // ルームを ready 状態に更新（guest 情報を登録）
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
        UpdateExpression:
          'SET guestConnectionId = :guestId, guestCreature = :guestCreature, #status = :ready',
        ConditionExpression: '#status = :waiting',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':guestId': connectionId,
          ':guestCreature': creature,
          ':ready': 'ready',
          ':waiting': 'waiting',
        },
      })
    );
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // 別のプレイヤーが先に参加した
      await postToConnection(connectionId, {
        event: 'error',
        code: 'ROOM_NOT_AVAILABLE',
        message: 'このルームは現在参加できません',
      });
      return { statusCode: 409 };
    }
    console.error(`[join_room] Failed to update room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  // connections テーブルに roomCode を記録
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression: 'SET roomCode = :roomCode',
        ExpressionAttributeValues: { ':roomCode': roomCode },
      })
    );
  } catch (err) {
    console.error(`[join_room] Failed to update guest connection with roomCode:`, err);
  }

  const hostConnectionId = room.hostConnectionId;
  const hostCreatureSnapshot = toCreatureSnapshot(room.hostCreature);
  const guestCreatureSnapshot = toCreatureSnapshot(creature);

  // ホストへ通知
  try {
    await postToConnection(hostConnectionId, {
      event: 'opponent_joined',
      opponentCreature: guestCreatureSnapshot,
    });
  } catch (err) {
    console.error(`[join_room] Failed to notify host ${hostConnectionId}:`, err);
  }

  // ゲストへ通知
  await postToConnection(connectionId, {
    event: 'room_joined',
    roomCode,
    hostCreature: hostCreatureSnapshot,
  });

  console.info(`[join_room] ${connectionId} joined room ${roomCode}`);
  return { statusCode: 200 };
}

/**
 * ready: バトル開始準備完了を通知する
 */
async function handleReady(connectionId, payload) {
  const { roomCode } = payload;

  if (!isValidRoomCode(roomCode)) {
    return { statusCode: 400 };
  }

  const docClient = getDocumentClient();

  // ルームを取得
  let room;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
      })
    );
    room = result.Item;
  } catch (err) {
    console.error(`[ready] Failed to get room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  if (!room) {
    return { statusCode: 404 };
  }

  const isHost = room.hostConnectionId === connectionId;
  const isGuest = room.guestConnectionId === connectionId;

  if (!isHost && !isGuest) {
    console.warn(`[ready] Unknown connection ${connectionId} for room ${roomCode}`);
    return { statusCode: 403 };
  }

  const readyField = isHost ? 'hostReady' : 'guestReady';

  // ready フラグを更新
  let updatedRoom;
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
        UpdateExpression: `SET ${readyField} = :true`,
        ExpressionAttributeValues: { ':true': true },
        ReturnValues: 'ALL_NEW',
      })
    );
    updatedRoom = result.Attributes;
  } catch (err) {
    console.error(`[ready] Failed to update ready flag for room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  // 両者が ready になったら battle_start を送信
  if (updatedRoom.hostReady && updatedRoom.guestReady) {
    const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: ROOMS_TABLE,
          Key: { roomCode },
          UpdateExpression: 'SET #status = :battling, seed = :seed',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':battling': 'battling',
            ':seed': seed,
          },
        })
      );
    } catch (err) {
      console.error(`[ready] Failed to update room to battling:`, err);
      return { statusCode: 500 };
    }

    const hostId = room.hostConnectionId;
    const guestId = room.guestConnectionId;

    await Promise.allSettled([
      postToConnection(hostId, { event: 'battle_start', seed, yourRole: 'host' }),
      postToConnection(guestId, { event: 'battle_start', seed, yourRole: 'guest' }),
    ]);

    console.info(`[ready] Battle started in room ${roomCode} with seed ${seed}`);
  }

  return { statusCode: 200 };
}

/**
 * select_action: バトルアクションを選択する
 */
async function handleSelectAction(connectionId, payload) {
  const { roomCode, battleAction } = payload;

  const validActions = ['attack', 'guard', 'special'];
  if (!isValidRoomCode(roomCode) || !validActions.includes(battleAction)) {
    return { statusCode: 400 };
  }

  const docClient = getDocumentClient();

  // ルームを取得
  let room;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
      })
    );
    room = result.Item;
  } catch (err) {
    console.error(`[select_action] Failed to get room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  if (!room || room.status !== 'battling') {
    return { statusCode: 404 };
  }

  const isHost = room.hostConnectionId === connectionId;
  const isGuest = room.guestConnectionId === connectionId;

  if (!isHost && !isGuest) {
    return { statusCode: 403 };
  }

  const actionField = isHost ? 'hostAction' : 'guestAction';

  // アクションを記録
  let updatedRoom;
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
        UpdateExpression: `SET ${actionField} = :action`,
        ExpressionAttributeValues: { ':action': battleAction },
        ReturnValues: 'ALL_NEW',
      })
    );
    updatedRoom = result.Attributes;
  } catch (err) {
    console.error(`[select_action] Failed to update action for room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  // 両者のアクションが揃ったら actions_locked を送信
  if (updatedRoom.hostAction && updatedRoom.guestAction) {
    const newSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    // ターンを進め、アクションをリセット
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: ROOMS_TABLE,
          Key: { roomCode },
          UpdateExpression:
            'SET turnPhase = :select, currentTurn = currentTurn + :one, hostAction = :null, guestAction = :null, seed = :seed',
          ExpressionAttributeValues: {
            ':select': 'select',
            ':one': 1,
            ':null': null,
            ':seed': newSeed,
          },
        })
      );
    } catch (err) {
      console.error(`[select_action] Failed to advance turn for room ${roomCode}:`, err);
      return { statusCode: 500 };
    }

    const hostId = room.hostConnectionId;
    const guestId = room.guestConnectionId;

    await Promise.allSettled([
      postToConnection(hostId, {
        event: 'actions_locked',
        hostAction: updatedRoom.hostAction,
        guestAction: updatedRoom.guestAction,
        seed: newSeed,
      }),
      postToConnection(guestId, {
        event: 'actions_locked',
        hostAction: updatedRoom.hostAction,
        guestAction: updatedRoom.guestAction,
        seed: newSeed,
      }),
    ]);

    console.info(
      `[select_action] Turn resolved in room ${roomCode}: host=${updatedRoom.hostAction}, guest=${updatedRoom.guestAction}`
    );
  }

  return { statusCode: 200 };
}

/**
 * ping: 接続を維持し、messageCount をリセットする
 */
async function handlePing(connectionId) {
  const docClient = getDocumentClient();
  const nowSec = Math.floor(Date.now() / 1000);

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
        // messageCount はリセットしない（pingによるレート制限バイパス防止）
        UpdateExpression: 'SET lastPingAt = :now',
        ExpressionAttributeValues: {
          ':now': nowSec,
        },
      })
    );
  } catch (err) {
    console.error(`[ping] Failed to update lastPingAt for ${connectionId}:`, err);
    return { statusCode: 500 };
  }

  await postToConnection(connectionId, { event: 'pong' });
  return { statusCode: 200 };
}

/**
 * leave_room: ルームから退出する
 */
async function handleLeaveRoom(connectionId, payload) {
  const { roomCode } = payload;

  if (!isValidRoomCode(roomCode)) {
    return { statusCode: 400 };
  }

  const docClient = getDocumentClient();

  // ルームを取得
  let room;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ROOMS_TABLE,
        Key: { roomCode },
      })
    );
    room = result.Item;
  } catch (err) {
    console.error(`[leave_room] Failed to get room ${roomCode}:`, err);
    return { statusCode: 500 };
  }

  if (room) {
    if (room.status === 'battling') {
      // battling 中なら相手を winner として記録し、通知
      const isHost = room.hostConnectionId === connectionId;
      const winnerRole = isHost ? 'guest' : 'host';
      const opponentConnectionId = isHost
        ? room.guestConnectionId
        : room.hostConnectionId;

      try {
        await docClient.send(
          new UpdateCommand({
            TableName: ROOMS_TABLE,
            Key: { roomCode },
            UpdateExpression: 'SET #status = :finished, winner = :winner',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':finished': 'finished',
              ':winner': winnerRole,
            },
          })
        );
      } catch (err) {
        console.error(`[leave_room] Failed to finish room ${roomCode}:`, err);
      }

      if (opponentConnectionId) {
        try {
          await postToConnection(opponentConnectionId, {
            event: 'opponent_disconnected',
          });
        } catch (err) {
          console.error(
            `[leave_room] Failed to notify opponent ${opponentConnectionId}:`,
            err
          );
        }
      }
    } else {
      // waiting / ready 状態のルームはそのまま waiting に戻す or 削除
      const isHost = room.hostConnectionId === connectionId;
      if (isHost) {
        // ホストが退出 → ルームを削除（guestがいれば通知）
        try {
          await docClient.send(
            new DeleteCommand({
              TableName: ROOMS_TABLE,
              Key: { roomCode },
            })
          );
        } catch (err) {
          console.error(`[leave_room] Failed to delete room ${roomCode}:`, err);
        }

        if (room.guestConnectionId) {
          try {
            await postToConnection(room.guestConnectionId, {
              event: 'room_closed',
              message: 'ホストがルームを閉じました',
            });
          } catch (err) {
            console.error(
              `[leave_room] Failed to notify guest about room closure:`,
              err
            );
          }
        }
      } else {
        // ゲストが退出 → ルームを waiting 状態に戻す
        try {
          await docClient.send(
            new UpdateCommand({
              TableName: ROOMS_TABLE,
              Key: { roomCode },
              UpdateExpression:
                'SET guestConnectionId = :null, guestCreature = :null, guestReady = :false, #status = :waiting',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':null': null,
                ':false': false,
                ':waiting': 'waiting',
              },
            })
          );
        } catch (err) {
          console.error(`[leave_room] Failed to reset room ${roomCode} to waiting:`, err);
        }

        if (room.hostConnectionId) {
          try {
            await postToConnection(room.hostConnectionId, {
              event: 'opponent_disconnected',
            });
          } catch (err) {
            console.error(
              `[leave_room] Failed to notify host about guest leaving:`,
              err
            );
          }
        }
      }
    }
  }

  // connections テーブルの roomCode をクリア
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression: 'REMOVE roomCode',
      })
    );
  } catch (err) {
    console.error(
      `[leave_room] Failed to clear roomCode for connection ${connectionId}:`,
      err
    );
  }

  console.info(`[leave_room] ${connectionId} left room ${roomCode}`);
  return { statusCode: 200 };
}

// ============================================================
// メインハンドラー
// ============================================================

export const handler = async (event) => {
  const connectionId = event.requestContext?.connectionId;

  // --- レート制限チェック ---
  const rateCheck = await checkRateLimit(connectionId);
  if (!rateCheck.allowed) {
    if (rateCheck.rateLimited) {
      console.warn(`[message] Rate limit exceeded for ${connectionId}`);
      return { statusCode: 429 };
    }
    return { statusCode: 500 };
  }

  // --- ペイロードのパース ---
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    console.warn(`[message] Invalid JSON from ${connectionId}: ${event.body}`);
    return { statusCode: 400 };
  }

  const { action } = body;

  console.info(`[message] action=${action} from ${connectionId}`);

  // --- アクションディスパッチ ---
  switch (action) {
    case 'create_room':
      return handleCreateRoom(connectionId, body);

    case 'join_room':
      return handleJoinRoom(connectionId, body);

    case 'ready':
      return handleReady(connectionId, body);

    case 'select_action':
      return handleSelectAction(connectionId, body);

    case 'ping':
      return handlePing(connectionId);

    case 'leave_room':
      return handleLeaveRoom(connectionId, body);

    default:
      console.warn(`[message] Unknown action "${action}" from ${connectionId}`);
      try {
        await postToConnection(connectionId, {
          event: 'error',
          code: 'UNKNOWN_ACTION',
          message: `Unknown action: ${action}`,
        });
      } catch (err) {
        console.error(`[message] Failed to send error response:`, err);
      }
      return { statusCode: 400 };
  }
};
