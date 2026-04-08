# WebRTC P2P対戦 実装計画

## 概要

現在のWebSocket API（AWS Lambda + API Gateway）ベースの対戦システムを、**WebRTC DataChannel によるP2P通信**に置き換える。シグナリング（接続確立）は**QRコード交換**で行い、バックエンドサーバーを完全不要にする。

### 方針
- STUNサーバー: Google/Cloudflare の無料公開STUNを利用
- TURNサーバー: 初期フェーズでは導入しない（Symmetric NAT環境では接続不可）
- シグナリング: QRコード表示 + カメラ読み取りで SDP を交換
- バトルロジック: 既存のシードベース決定論的RNG をそのまま活用（変更不要）

### 前提
- 既存のバトルロジック（`battleLogic.ts`）はフロントエンド完結しており、サーバーはシード発行と同期のみ担当
- P2P化により、シード生成はホスト側が担当し DataChannel で共有する

---

## アーキテクチャ比較

### 現行（WebSocket API）
```
端末A → AWS API Gateway (WebSocket) → Lambda → DynamoDB
                                         ↓
端末B ← AWS API Gateway (WebSocket) ← Lambda
```

### 新方式（WebRTC P2P）
```
端末A ──── QRコードでSDP交換 ──── 端末B
  │                                  │
  └──── WebRTC DataChannel (P2P) ────┘
         ※ STUN で NAT 越え
```

---

## 接続確立フロー（QRコードシグナリング）

```
┌─────────────┐                           ┌─────────────┐
│   ホスト(A)  │                           │  ゲスト(B)   │
├─────────────┤                           ├─────────────┤
│ 1. RTCPeerConnection 作成              │              │
│ 2. DataChannel 作成                    │              │
│ 3. createOffer() → localDescription    │              │
│ 4. ICE候補収集完了を待つ                │              │
│ 5. SDP(offer) を QRコード表示 ───────→ │ 6. QR読み取り │
│                                        │ 7. RTCPeerConnection 作成│
│                                        │ 8. setRemoteDescription(offer)│
│                                        │ 9. createAnswer() → localDescription│
│                                        │10. ICE候補収集完了を待つ │
│11. QR読み取り ←─────────────────────── │11. SDP(answer) を QRコード表示│
│12. setRemoteDescription(answer)        │              │
│                                        │              │
│  ══════ P2P DataChannel 確立 ══════    │              │
└─────────────┘                           └─────────────┘
```

### SDP データの圧縮
- SDP 文字列はそのままだと数KB → QRコードに収まらない可能性がある
- **SDP圧縮**: 不要なメディア行を除去し、DataChannel に必要な最小限のSDPに削減
- **さらに圧縮**: pako (zlib) で圧縮 → Base64エンコード → QRコード化
- 目標: 1,000文字以下（QR Version 20程度で読み取り可能）

---

## フェーズ分割

### フェーズ1: WebRTC基盤 + QRシグナリング（MVP）
**目標**: QRコード交換でP2P接続を確立し、テキストメッセージを送受信できる

#### 1-1. WebRTC接続管理フック作成
- **新規ファイル**: `frontend/src/hooks/useWebRTC.ts`
- RTCPeerConnection の生成・管理
- DataChannel の生成・イベントハンドリング
- ICE候補の収集と接続状態の監視
- STUNサーバー設定（`stun:stun.l.google.com:19302` 等）
- 接続断検知とクリーンアップ

#### 1-2. SDP圧縮ユーティリティ
- **新規ファイル**: `frontend/src/utils/sdpCodec.ts`
- SDP → 圧縮 → Base64エンコード（QRコード用）
- Base64デコード → 解凍 → SDP 復元
- ライブラリ: `pako`（zlib圧縮、軽量）

#### 1-3. QRコード表示・読み取りコンポーネント
- **新規ファイル**: `frontend/src/components/QRSignaling.tsx`
- QRコード生成: `qrcode.react` ライブラリ
- QRコード読み取り: `html5-qrcode` ライブラリ（カメラアクセス）
- 表示/読み取りの状態遷移UI

#### 1-4. 必要なライブラリ追加
```json
{
  "pako": "^2.1.0",
  "qrcode.react": "^4.1.0",
  "html5-qrcode": "^2.3.8"
}
```
※ `@types/pako` も追加

### フェーズ2: P2Pバトルプロトコル
**目標**: DataChannel上でバトルメッセージを送受信し、対戦を成立させる

#### 2-1. P2Pメッセージプロトコル定義
- **新規ファイル**: `frontend/src/types/p2pBattle.ts`
- 既存の `ServerEvent` / クライアントメッセージを P2P用に再定義
- ホスト/ゲストの役割分担を定義

```typescript
// P2Pメッセージ型（案）
type P2PMessage =
  | { type: 'creature_info'; creature: CreatureSnapshot }
  | { type: 'ready' }
  | { type: 'battle_start'; seed: number }        // ホスト→ゲスト
  | { type: 'action_selected'; action: BattleAction }
  | { type: 'actions_locked'; hostAction: BattleAction; guestAction: BattleAction; seed: number }  // ホスト→ゲスト
  | { type: 'battle_end'; winner: 'host' | 'guest' | 'draw' }
  | { type: 'ping' }
  | { type: 'pong' }
```

#### 2-2. P2Pバトル状態管理フック
- **新規ファイル**: `frontend/src/hooks/useBattleP2P.ts`
- 既存 `useBattleWebSocket.ts` と同じインターフェースを提供
- ホスト側の責務:
  - シード生成（`crypto.getRandomValues`）
  - 両者のアクション受信後に `actions_locked` を発行
  - ターンカウント管理
- ゲスト側の責務:
  - ホストからのメッセージに応答
  - アクション選択を送信

#### 2-3. バトルロビー画面の改修
- **変更ファイル**: `frontend/src/components/BattleLobbyScreen.tsx`
- 新タブ「P2P対戦」を追加（既存の「部屋を作る」「部屋に入る」と並列）
- P2P対戦タブ内:
  - 「ホストとして対戦を作成」ボタン → QRコード表示フロー
  - 「QRコードを読み取って参加」ボタン → カメラ起動フロー
- 接続確立後、既存の `BattleScreen.tsx` に遷移

#### 2-4. BattleScreen の接続方式抽象化
- **変更ファイル**: `frontend/src/components/BattleScreen.tsx`
- WebSocket / P2P の両方に対応できるよう、通信層を抽象化
- バトルロジック（`resolveTurn` 等）は変更不要

### フェーズ3: UX改善・安定化
**目標**: 実用的なP2P対戦体験に仕上げる

#### 3-1. 接続状態のUI表示
- 接続確立中のプログレス表示
- ICE接続状態（checking → connected → disconnected）の可視化
- 接続失敗時のエラーメッセージとリトライ導線

#### 3-2. 切断ハンドリング
- DataChannel / PeerConnection の切断検知
- バトル中の切断 → 相手の勝利として処理（既存仕様と同じ）
- 切断後のクリーンアップ

#### 3-3. Keep-alive
- DataChannel 上で ping/pong（30秒間隔、既存と同じ）
- 応答タイムアウト検知（10秒）

#### 3-4. SDP交換のUX最適化
- QRコード読み取り成功時のバイブレーション/サウンドフィードバック
- 「クリップボードにコピー」の代替手段（QRが読み取れない場合のフォールバック）

### フェーズ4: 既存WebSocket方式との共存判断
**目標**: WebSocket方式を残すか完全移行するか決定

#### 4-1. 判断ポイント
- P2P接続成功率の実測（様々なネットワーク環境でテスト）
- UX比較（QR交換 vs ルームコード入力）
- バックエンド運用コストとの比較

#### 4-2. 選択肢
- **A. P2P完全移行**: WebSocket関連コードを削除、バックエンド廃止
- **B. 併用**: P2Pをデフォルトにし、WebSocketをフォールバックとして残す
- **C. P2P断念**: 接続成功率が低ければWebSocketに戻す

---

## ファイル変更一覧

### 新規作成
| ファイル | 内容 | フェーズ |
|---------|------|---------|
| `frontend/src/hooks/useWebRTC.ts` | WebRTC接続管理 | 1 |
| `frontend/src/utils/sdpCodec.ts` | SDP圧縮/復元 | 1 |
| `frontend/src/components/QRSignaling.tsx` | QR表示・読み取りUI | 1 |
| `frontend/src/types/p2pBattle.ts` | P2Pメッセージ型定義 | 2 |
| `frontend/src/hooks/useBattleP2P.ts` | P2Pバトル状態管理 | 2 |

### 変更
| ファイル | 内容 | フェーズ |
|---------|------|---------|
| `frontend/package.json` | ライブラリ追加 | 1 |
| `frontend/src/components/BattleLobbyScreen.tsx` | P2P対戦タブ追加 | 2 |
| `frontend/src/components/BattleScreen.tsx` | 通信層抽象化 | 2 |

### 変更なし（そのまま活用）
| ファイル | 理由 |
|---------|------|
| `frontend/src/utils/battleLogic.ts` | シードベースRNGはP2Pでもそのまま使える |
| `frontend/src/utils/cpuBattle.ts` | CPU対戦は影響なし |
| `frontend/src/types/battle.ts` | 既存型は維持、P2P用は別ファイル |
| `frontend/src/hooks/useBattleState.ts` | バトル状態管理は通信方式に依存しない |

---

## 技術的リスクと対策

### リスク1: SDP がQRコードに収まらない
- **影響**: QRコードが大きすぎてカメラで読み取れない
- **対策**: SDP Munging で不要行を除去 + pako圧縮。それでも大きい場合は複数QRに分割、またはクリップボードコピー方式をフォールバックとして用意
- **検証**: フェーズ1で実際のSDPサイズを測定して判断

### リスク2: Symmetric NAT で接続不可
- **影響**: 一部のモバイルキャリア利用者が対戦できない
- **対策**: 初期フェーズでは「接続できない場合があります」と表示。将来的にTURN導入を検討（Cloudflare Calls 月1GB無料枠）
- **実測目標**: フェーズ3で実機テストし接続成功率を把握

### リスク3: バトル中の不正行為
- **影響**: ホスト側がシードを操作して有利な結果を出せる
- **許容**: カジュアル対戦ゲームとして、厳密な不正防止は優先度低。友人同士の対戦が主なユースケース
- **将来対策**: コミットメントスキーム（アクション選択のハッシュを先に交換）で改ざん検知可能

### リスク4: カメラ権限の取得失敗
- **影響**: QR読み取りができない
- **対策**: クリップボードコピー＆ペースト方式を常に代替手段として提供

---

## 実装順序の推奨

```
フェーズ1（基盤）→ フェーズ2（対戦実装）→ フェーズ3（UX改善）→ フェーズ4（判断）
   約2-3日          約2-3日              約1-2日            テスト後
```

フェーズ1完了時点で「P2PでテキストをやりとりできるPoCデモ」が動くため、早期にQRコード交換の実現可能性とUXを検証できる。

---

## 備考

- WebRTC の `RTCPeerConnection` および `RTCDataChannel` はモダンブラウザ（Chrome, Safari, Firefox）で広くサポート済み
- PWA（Service Worker）との干渉はない（DataChannel は Service Worker を経由しない）
- STUNサーバーは複数指定してフォールバック可能（Google, Cloudflare, Mozilla等）
