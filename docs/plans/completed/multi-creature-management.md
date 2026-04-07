# 複数クリーチャー管理 実装計画

**作成日**: 2026-04-07  
**担当**: バルベルデ（設計・アーキテクチャ）  
**ステータス**: 計画確定（シャビ承認済み: 2026-04-07）

---

## 1. 現状分析

### 現在のデータ構造

現在の `GameState`（`hooks/useGameState.ts`）はクリーチャーを1体しか保持しない設計になっている。

```typescript
// 現在の GameState（useGameState.ts）
interface GameState {
  creature: Creature | null  // 常に1体のみ
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  attackAnimation: boolean
  evolvedFrom: EvolutionStage | null
  message: string | null
}
```

### 現在の永続化

`storage.ts` は IndexedDB (`digi-raise` DB, `gameState` ストア) を使用しているが、固定キー `"currentCreature"` で1体のみ保存する構造になっている。

```typescript
const CREATURE_KEY = 'currentCreature'  // 固定キー = 1体しか持てない

// 保存: put(STORE_NAME, creature, CREATURE_KEY)
// 取得: get(STORE_NAME, CREATURE_KEY)
// 削除: delete(STORE_NAME, CREATURE_KEY)
```

### 現在の画面構成

| 画面 | クリーチャーへの依存 |
|------|---------------------|
| `title` | `hasExistingSave`（bool） でセーブの有無を確認 |
| `setup` | 新規作成フォーム |
| `main` | `creature` が必須 |
| `status` | `creature` が必須 |
| `evolution` | `creature` が必須 |
| `death` | `creature` が必須 |
| `drawing` | `creature` または `pendingCreature` が必須 |
| `battle_lobby` | `creature` が必須 |
| `battle` | `creature`、`battleRole`、`battleOpponent` が必須 |

### 変更の影響が大きい箇所

- `App.tsx`: クリーチャー状態管理の中枢。ほぼ全ての操作がここに集約。
- `storage.ts`: 保存・読み込みの固定キー構造。
- `TitleScreen.tsx`: `hasExistingSave`（bool）しか受け取っていない。

---

## 2. 目標

複数のクリーチャーを同時に所有し、育てたいクリーチャーを選んでプレイできる状態にする。

具体的に実現すること：

1. 全クリーチャーをまとめて保存・管理できる（保有数の上限なし）
2. ステータス画面からクリーチャーを切り替えられる
3. ステータス画面から新規クリーチャーを追加作成できる
4. 非アクティブのクリーチャーは時間停止（切り替えた瞬間から時間が動き出す）
5. 死亡したクリーチャーは墓石としてリストに残る（閲覧可・操作不可）
6. バトルはアクティブクリーチャーで自動参加（現状維持）
7. セーブデータ（全クリーチャー情報）をまるごとエクスポート・インポートできる

---

## 3. 設計方針

### 3-1. データ構造

`GameState` に `creatures` 配列と `activeCreatureId` を持つクリーチャーリスト＋アクティブID方式を採用する。

```typescript
interface GameState {
  creatures: Creature[]            // 全クリーチャーのリスト（墓石含む）
  activeCreatureId: string | null  // 現在操作中のクリーチャーID
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  attackAnimation: boolean
  evolvedFrom: EvolutionStage | null
  message: string | null
}

// アクティブクリーチャーはセレクターで導出
const activeCreature = state.creatures.find(c => c.id === state.activeCreatureId) ?? null
```

`Creature` 型に `isDead: boolean` フィールドを追加し、死亡したクリーチャーを墓石として保持する。

### 3-2. ストレージ

全クリーチャーの情報と `activeCreatureId` をひとまとめにしたオブジェクトを、固定キーで IndexedDB に一括保存する。

```typescript
interface SaveData {
  creatures: Creature[]
  activeCreatureId: string | null
}

const SAVE_KEY = 'saveData'

// 保存: put(STORE_NAME, saveData, SAVE_KEY)
// 読み込み: get(STORE_NAME, SAVE_KEY)
// 削除: delete(STORE_NAME, SAVE_KEY)
```

保存・読み込みが1回のI/Oで完結し、データの整合性が常に保証される。エクスポート/インポートも単一オブジェクトの出し入れで済む。

起動時に旧キー `"currentCreature"` が存在する場合は `SaveData` 形式に自動変換して保存し、旧キーを削除する。

### 3-3. 画面遷移

```
【現在】
title → setup → main → status（情報表示のみ）

【変更後】
title → main → status（クリーチャー一覧・切り替え・新規作成）
title → setup → main（初回 or 新規追加時）
```

ステータス画面をクリーチャー管理のハブとして機能させる。タイトル画面の「つづきから」は最後にアクティブだったクリーチャーのメイン画面へ直接遷移。

### 3-4. 時間更新

アクティブなクリーチャーのみ時間更新する。非アクティブのクリーチャーは時間停止状態となり、切り替えた瞬間からそのクリーチャーの時間が動き出す。

**切り替え時の注意**: クリーチャーを切り替える際に `lastUpdated` を現在時刻にリセットする必要がある。リセットしないと、非アクティブ中のリアル経過時間が一気に反映されてしまう。

---

## 4. 実装ステップ

段階的に実装し、各フェーズで動作確認できる構成にする。

### フェーズ1: ストレージ層の拡張（後方互換性確保）

**目標**: 全クリーチャーをまとめて保存・読み込みできるようにする。既存データを破壊しない。

変更ファイル:
- `frontend/src/utils/storage.ts`

実装内容:
1. `SaveData` 型を定義（`{ creatures: Creature[], activeCreatureId: string | null }`）
2. `saveSaveData(saveData)` — 全クリーチャー情報を固定キー `"saveData"` でまとめて保存
3. `loadSaveData()` — セーブデータ一式を読み込み（`SaveData | null`）
4. `deleteSaveData()` — セーブデータ全体を削除
5. **移行処理**: 起動時に旧キー `"currentCreature"` が存在する場合、`SaveData` 形式に変換して保存し、旧キーを削除
6. 既存の `saveCreature` / `loadCreature` / `deleteCreature` は移行後に削除

### フェーズ2: 状態管理の拡張

**目標**: `GameState` と `useGameState` を複数体対応に変更する。

変更ファイル:
- `frontend/src/types/creature.ts`（`GameState` 型は削除またはコメント整理）
- `frontend/src/hooks/useGameState.ts`

実装内容:
1. `GameState` を `creatures: Creature[]` と `activeCreatureId: string | null` を持つ構造に変更
2. `activeCreature` を `creatures` から導出するセレクターを追加
3. `startGame`、`loadGame`、`applyUpdate`、`feed`、`train`、`play`、`sleep`、`evolve`、`startOver` の各アクションをアクティブクリーチャーに対して動作するよう調整
4. クリーチャー切り替えアクション `selectCreature(id)` を追加
5. 新規クリーチャー追加アクション `addCreature(creature)` を追加
6. 起動時に `loadSaveData()` で全クリーチャーを一括読み込み
7. 状態変更のたびに `saveSaveData()` で全体をまとめて保存

### フェーズ3: ステータス画面にクリーチャー管理UIを追加

**目標**: ステータス画面でクリーチャー一覧を表示し、切り替え・新規作成ができるようにする。

変更ファイル:
- `frontend/src/components/StatusScreen.tsx`
- `frontend/src/App.tsx`

実装内容:
1. ステータス画面にクリーチャー一覧セクションを追加（名前・タイプ・ステージ・状態表示）
2. 一覧からクリーチャーを選択すると `selectCreature(id)` でアクティブを切り替え、メイン画面に遷移
3. 「新しいクリーチャーを育てる」ボタンで新規作成画面（setup）に遷移
4. 墓石状態のクリーチャーは選択不可だがリストに表示（グレーアウト、墓石アイコン等）
5. アクティブなクリーチャーにはハイライト表示

### フェーズ4: タイトル画面の調整

**目標**: タイトル画面を複数体管理に合わせて調整する。

変更ファイル:
- `frontend/src/components/TitleScreen.tsx`
- `frontend/src/App.tsx`

実装内容:
1. 「つづきから」で最後にアクティブだったクリーチャーのメイン画面へ遷移
2. 「つづきから」の表示条件を `creatures.some(c => !c.isDead)`（生存中のクリーチャーが1体以上）に変更
3. 全クリーチャーが墓石状態の場合は「はじめから」のみ表示

### フェーズ5: 死亡画面・墓石対応

**目標**: 死亡時に墓石として保存し、他のクリーチャーへスムーズに遷移する。

変更ファイル:
- `frontend/src/App.tsx`（死亡ハンドラー）
- `frontend/src/components/DeathScreen.tsx`
- `frontend/src/types/creature.ts`（`Creature` 型に `isDead` フラグ追加）

実装内容:
1. `Creature` 型に `isDead: boolean` フィールドを追加
2. HP が 0 になったクリーチャーを削除せず、墓石状態に変更してストレージに保存
3. `DeathScreen` の「最初からやり直す」ボタンの挙動を変更:
   - 生存中のクリーチャーがいる場合 → ステータス画面（クリーチャー一覧）に遷移
   - 全員墓石の場合 → 新規作成画面（setup）に遷移
4. エクスポート/インポート機能を `SaveData` 全体の出し入れに変更（全クリーチャーまるごと）
5. バトルはアクティブクリーチャーで自動参加（変更なし）

---

## 5. 影響範囲

| ファイル | 変更内容 | 影響度 |
|---------|---------|--------|
| `frontend/src/utils/storage.ts` | 一括保存方式への変更・移行処理 | 高 |
| `frontend/src/hooks/useGameState.ts` | `creatures[]` + `activeCreatureId` 構造へ変更 | 高 |
| `frontend/src/App.tsx` | 全ハンドラーの調整、複数体対応ロジック追加 | 高 |
| `frontend/src/components/StatusScreen.tsx` | クリーチャー一覧・切り替え・新規作成UI追加 | 高 |
| `frontend/src/components/TitleScreen.tsx` | 「つづきから」のロジック調整 | 低 |
| `frontend/src/components/DeathScreen.tsx` | 墓石対応・遷移先の変更 | 中 |
| `frontend/src/types/creature.ts` | `GameState` 型整理、`Creature` に `isDead` 追加 | 低 |

変更不要なファイル（クリーチャー1体を受け取るだけなので影響なし）:
- `MainGame.tsx`、`CreatureSetup.tsx`、`EvolutionScreen.tsx`、`CreatureDrawingScreen.tsx`
- `BattleLobbyScreen.tsx`、`BattleScreen.tsx`
- `utils/gameLogic.ts`、`utils/evolution.ts`、`utils/battleLogic.ts`

---

## 6. リスク・考慮事項

### リスク1: 既存セーブデータの移行

**内容**: `"currentCreature"` キーで保存された既存データが読み込めなくなる可能性がある。  
**緩和策**: フェーズ1で移行処理を実装する。起動時に旧キーを検出したら `SaveData` 形式（`{ creatures: [旧クリーチャー], activeCreatureId: 旧クリーチャーのID }`）に自動変換して保存し、旧キーを削除する。移行処理は冪等に設計し、何度実行しても問題ない形にする。

### リスク2: App.tsx の複雑度増加

**内容**: 現在でも `App.tsx` は400行を超えており、複数体管理の追加でさらに膨らむ可能性がある。  
**緩和策**: フェーズ2で `useGameState` にロジックを集約し、`App.tsx` は画面切り替えと各アクションの呼び出しに専念させる。必要なら将来的にカスタムフックを分割する。

### リスク3: IndexedDB の容量とセーブデータサイズ

**内容**: クリーチャーに `customSprites`（SVG文字列）が含まれる。全クリーチャーをまとめて1つのオブジェクトとして保存するため、体数増加でセーブデータが大きくなる。また、毎回全体を書き込むため書き込みコストも体数に比例する。  
**緩和策**: PWA の IndexedDB 容量（通常 50MB〜数百MB）であれば、現実的な体数では問題ない見込み。上限なしの方針だが、極端に多くなった場合はパフォーマンスを監視する。
