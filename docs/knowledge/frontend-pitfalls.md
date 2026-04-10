# フロントエンド 落とし穴ナレッジ

フロントエンド開発で遭遇したバグパターンと教訓。

---

## JavaScript の falsy 判定で seed=0 が false になる

### 現象

バトル開始遷移の条件で seed が 0 の場合に遷移できなかった。

```typescript
// NG: seed が 0 だと falsy で遷移しない
if (opponent && role && seed && code) { ... }

// OK: null チェックで判定
if (opponent && role && seed !== null && code) { ... }
```

### 教訓

数値が 0 を取り得る変数を truthy/falsy で判定してはいけない。`!== null` または `!== undefined` で判定する。

---

## WebSocket コールバック内で state が古くなる問題

### 現象

WebSocket の `onmessage` コールバック内で React の state を参照すると、クロージャに閉じ込められた古い値が使われる。

### 対処

コールバック関数を `useRef` で保持し、常に最新の関数を参照する。

```typescript
const optionsRef = useRef(options)
useEffect(() => {
  optionsRef.current = options
}, [options])

// WebSocket メッセージハンドラ内で
optionsRef.current.onRoomCreated(roomCode)  // 常に最新のコールバックを呼ぶ
```

---

## guest 側の roomCode が未設定で ready を送れない

### 現象

オンラインバトルで guest が参加後に「バトル開始中...」から進まなかった。

### 原因

`handleJoinRoom` で WebSocket 接続後に `joinRoom` を送信したが、`roomCodeRef.current` をセットしていなかった。`ready` 送信の useEffect が `roomCodeRef.current` を参照するため、空文字列で `sendReady` が呼ばれなかった。

### 教訓

ref を使って非同期処理間でデータを共有する場合、**全ての入口で ref を更新する**こと。host の `onRoomCreated` ではセットしていたが、guest の `handleJoinRoom` ではセットを忘れていた。

---

## イベント到着順序に依存するロジックは危険

### 現象

`battle_start` イベント受信時に `tryTransitionToBattle()` を呼んでいたが、`opponent_joined` がまだ到着していない場合にデータが揃わず遷移できなかった。

### 対処

データが揃う可能性のある **全てのイベントハンドラ** で `tryTransitionToBattle()` を呼ぶようにする。どちらが先に到着しても、最後に揃った時点で遷移が発火する。

```typescript
onOpponentJoined: () => {
  pendingOpponentRef.current = opponentCreature
  tryTransitionToBattle()  // ← ここでも呼ぶ
},
onBattleStart: () => {
  pendingBattleRoleRef.current = role
  tryTransitionToBattle()  // ← ここでも呼ぶ
},
```
