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

---

## 条件付き props で機能拡張前のコードが新機能を潰す

### 現象

オンラインバトルで相手の手書きクリーチャー画像が表示されなかった。バックエンドのデータ、フロントエンドの受信処理、型定義を全て確認しても問題が見つからず、長時間の調査になった。

### 原因

`BattleCreatureDisplay.tsx` に以下のコードがあった:

```typescript
// QR バトル時代の名残：相手の画像データがなかったため undefined に固定していた
customSvg={isOpponent ? undefined : customSvg}
```

オンラインバトルで相手の `customSvg` を props に渡しても、コンポーネント内部で `isOpponent` の場合は **強制的に `undefined` に上書き** されていた。

### 教訓

1. **三項演算子で props を潰すパターンは危険**。機能拡張時に見落としやすい。条件付きで props を無効化する場合はコメントで理由を明記する
2. **バグ調査はデータの流れの最下流（表示コンポーネント）から逆順に辿る** のが効率的。今回はバックエンド→WebSocket→状態管理→... と上流から調査したため遠回りになった
3. **`grep` で props 名を検索して、全ての受け渡し箇所を確認する** のが最速。`customSvg` で検索すればすぐに `isOpponent ? undefined : customSvg` が見つかった

---

## PWA の Service Worker キャッシュが更新を妨げる

### 現象

コードを修正してデプロイしたのに、ブラウザに反映されない。`Ctrl+Shift+R`（ハードリロード）しても古いバンドルが表示される。

### 原因

PWA の Service Worker がキャッシュしたバンドルを返し続ける。通常のハードリロードでは Service Worker のキャッシュは消えない。

### 対処

1. DevTools (F12) → **Application** → **Service Workers** → **「Unregister」** をクリック
2. **Application** → **Storage** → **「Clear site data」** をクリック
3. ページをリロード

開発中は Application → Service Workers → **「Update on reload」** にチェックを入れておくと毎回最新のバンドルが使われる。
