# 建築画像→ブロック設計図化Webアプリ MVP仕様書（v0.1）

## 1. MVP仕様書

### 1-1. プロダクト目的
- 建築物のスクリーンショット/写真を1枚アップロードすると、**ブロック建築ゲーム向けの簡易設計図**を自動生成する。
- 初心者でも使えるように、
  - 自動推定を強める
  - ただし手修正しやすいUIを同時に提供する。
- MVPでは精度100%よりも、**「最初の設計図を短時間で作れること」**を優先する。

### 1-2. 対象・前提
- 初期対象ゲーム: ぽこあポケモン系のブロック建築ゲーム（ボクセル建築）
- 将来拡張: ゲーム別ブロックマスタに差し替え可能な設計
- 入力は単一画像（PNG/JPG）

### 1-3. MVPで実装する機能（必須）
1) 画像アップロード
- PNG/JPGを1枚
- ドラッグ&ドロップ + ファイル選択
- 画像プレビュー表示

2) 簡易画像解析（MVPアルゴリズム）
- 建築物らしい領域の抽出（背景除去の簡易版）
- 主要な直線/面を推定して建築輪郭を作る
- 画像をグリッドに近似（例: 24x24）
- 色クラスタリングでブロック候補を推定
- 候補ごとに confidence（0〜1）を付与

3) 設計図生成
- top（上面）/ front（正面）/ side（側面）
- 簡易3Dプレビュー（ボクセル風表示）
- ブロック必要数（blockCounts）
- Zレイヤー別配置データ
- buildSteps（建築手順の自動下書き）

4) 手修正エディタ
- マスクリックで blockType を変更
- source を auto/manual で管理
- レイヤー切替（Z=1,2,3...）
- 色表示/ブロック表示の切替

5) 出力
- PNG（図面の静止画像）
- JSON（設計データ）
- 将来の共有URL対応を見据え、保存インターフェースを分離

### 1-4. 非機能要件（MVP）
- 初回操作3分以内で「設計図が出る」体験
- 主要操作は日本語ラベル
- ローカルで `npm run dev` で起動
- 画像解析モジュールは将来OpenCV/MLへ差し替えやすく分離

### 1-5. MVP対象外（明示）
- 複数画像からの厳密3D復元
- 完全自動の高精度材質推定
- ゲーム内エクスポート専用フォーマット
- 認証/共有URLの本実装（設計だけ用意）

---

## 2. 画面構成

### 2-1. 画面レイアウト（1ページ）
- 左カラム: 画像アップロード
- 中央: 解析結果プレビュー + ビュー切替
- 右カラム: 設計図情報（レイヤー/ブロック一覧/集計）
- 右下（または下部）: 編集パネル

### 2-2. 主要UI要素
1) 左: UploadPanel
- ドロップゾーン
- 「画像を選択」ボタン
- 入力オプション
  - ゲームタイトル（任意）
  - 想定サイズ感（S/M/L）
  - 使用ブロック固定候補（任意）

2) 中央: AnalysisPreview
- タブ: `Top / Front / Side / 3D`
- 推定マス表示（confidenceの色濃淡）
- 「自動推定」表示と「手修正済み」表示を色/バッジで区別

3) 右: BlueprintPanel
- レイヤータブ: `Z=1, Z=2 ...`
- blockCounts（ブロック種別と必要数）
- estimatedBlocks（候補リスト）
- buildSteps（手順リスト）

4) 右下/下部: EditorPanel
- 選択中セル座標（X,Y,Z）
- blockType変更ドロップダウン
- confidence表示
- source切替（auto/manual）
- メモ入力（notes）

### 2-3. UXルール（初心者向け）
- X/Y/Z説明を常時表示（例: X=よこ, Y=おく, Z=たかさ）
- まず「自動生成」ボタンを1つ大きく配置
- 編集は「1マスずつ直す」導線を明確化
- エラーは具体文言（画像が大きすぎます、形式が違います等）

---

## 3. データ構造

### 3-1. コア型（将来3D拡張前提）

```ts
export type BlockType =
  | 'glow'
  | 'wall'
  | 'pillar'
  | 'floor'
  | 'pattern'
  | 'glass'
  | 'decor'
  | 'unknown';

export type CellSource = 'auto' | 'manual';

export interface Cell {
  x: number;
  y: number;
  z: number;
  blockType: BlockType;
  confidence: number; // 0.0 - 1.0
  source: CellSource;
  notes?: string;
}

export interface BlockMap {
  width: number;  // X
  depth: number;  // Y
  height: number; // Z
  cells: Cell[][][]; // [x][y][z]
}

export interface EstimatedBlock {
  blockType: BlockType;
  confidence: number;
  reason?: string; // 例: 明度が高く輪郭が少ない → glow候補
}

export interface BlueprintView {
  width: number;
  height: number;
  grid: Array<Array<{ blockType: BlockType; confidence: number }>>;
}

export interface Blueprint {
  topView: BlueprintView;
  frontView: BlueprintView;
  sideView: BlueprintView;
}

export interface BuildStep {
  step: number;
  title: string;
  description: string;
  targetCells: Array<{ x: number; y: number; z: number }>;
}

export interface BlueprintDocument {
  version: '0.1';
  gameTitle?: string;
  sourceImageMeta: {
    width: number;
    height: number;
    filename: string;
  };
  blockMap: BlockMap;
  estimatedBlocks: EstimatedBlock[];
  blueprint: Blueprint;
  blockCounts: Record<BlockType, number>;
  buildSteps: BuildStep[];
  createdAt: string;
  updatedAt: string;
}
```

### 3-2. buildSteps生成のMVPルール
- Zの低い層から順に処理（床→壁→上部）
- 同一 blockType + 隣接セルを1グループ化
- グループごとに「人間が作業しやすい短文」を作る
  - 例: Step1: 床を配置
  - 例: Step2: 左側の柱を配置

### 3-3. 推定と手修正の共存
- 自動推定時: source=`auto`, confidenceを設定
- 手修正時: source=`manual`, confidenceは維持または1.0扱い
- UIでmanualセルを強調表示

---

## 4. ディレクトリ構成（提案）

```txt
Task-app/
  app/
    page.tsx                       # メイン画面
    api/
      analyze/route.ts             # 画像解析API（MVPロジック）
      export/png/route.ts          # PNG出力
      export/json/route.ts         # JSON出力
  components/
    mvp/
      UploadPanel.tsx              # 左: アップロード
      AnalysisPreview.tsx          # 中央: top/front/side/3D
      BlueprintPanel.tsx           # 右: レイヤー/一覧/手順
      EditorPanel.tsx              # 下部: 手修正
      LayerTabs.tsx                # Zレイヤータブ
      AxisLegend.tsx               # X/Y/Z説明
  lib/
    blueprint/
      types.ts                     # データ型定義
      block-master.ts              # 固定ブロックマスタ
      converters.ts                # blockMap -> top/front/side
      counts.ts                    # blockCounts集計
      build-steps.ts               # buildSteps生成
    analysis/
      pipeline.ts                  # 解析パイプライン入口
      image-preprocess.ts          # リサイズ/ノイズ低減
      region-detect.ts             # 建築領域推定
      grid-estimate.ts             # グリッド近似
      block-estimate.ts            # blockType推定
  docs/
    voxel-blueprint-mvp-spec-ja.md # この仕様書
```

### 構成方針
- `lib/analysis` と `lib/blueprint` を分離し、将来ML差し替えを容易にする
- API層は薄く、ロジックを `lib/*` に集約する
- コンポーネントは `mvp/` 配下にまとめ、既存機能と衝突させない

---

## 5. 実装ステップ一覧（MVP優先順）

### Step 1: 型と固定マスタを作る
- `lib/blueprint/types.ts`
- `lib/blueprint/block-master.ts`
- まずデータ契約を固定し、以降の実装ブレを防ぐ

### Step 2: 画像アップロードUIを作る
- `UploadPanel` 実装
- 画像選択、プレビュー、入力オプション

### Step 3: 解析API（仮実装）
- `POST /api/analyze`
- 画像を受け取り、
  - リサイズ
  - 色クラスタリング
  - 粗いグリッド化
  - blockMap生成
- 最初は単純アルゴリズムでOK（改善前提）

### Step 4: 設計図変換ロジック
- blockMapから top/front/side を生成
- blockCounts と estimatedBlocks を出力

### Step 5: 画面中央/右パネル表示
- `AnalysisPreview` と `BlueprintPanel`
- タブ切替、集計表示、手順表示

### Step 6: 手修正エディタ
- セル選択
- blockType変更
- source=manual反映
- レイヤー切替

### Step 7: 出力機能
- JSONダウンロード
- PNG出力（まずは top/front/side の合成画像で十分）

### Step 8: 最低限の品質確認
- 5〜10枚の画像で試験
- 「自動生成→手修正→出力」導線の動作確認
- 失敗時のメッセージを改善

### Step 9: 次フェーズ準備（設計のみ）
- 共有URL保存インターフェースを抽象化
- Supabase接続レイヤーを追加しやすい設計メモを残す
