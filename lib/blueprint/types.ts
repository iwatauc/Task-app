// ========================================
// ブロック設計図メーカー - 型定義
// ========================================

/** ブロック種別 */
export type BlockType =
  | 'light'       // 発光ブロック
  | 'wall'        // 壁ブロック
  | 'pillar'      // 柱ブロック
  | 'floor'       // 床ブロック
  | 'pattern'     // 模様ブロック
  | 'glass'       // ガラス系
  | 'decoration'  // 装飾系
  | 'empty';      // 空（ブロックなし）

/** 1つのセル（ブロック1個分） */
export interface Cell {
  blockType: BlockType;
  confidence: number;       // 0〜1: 推定の確信度
  source: 'auto' | 'manual'; // auto=自動推定, manual=手動修正
  color: string;            // 元画像のHEX色
  notes?: string;           // メモ
}

/** 設計図の3Dデータ */
export interface BlueprintData {
  width: number;   // X軸（横）
  depth: number;   // Y軸（奥行き）
  height: number;  // Z軸（縦・高さ）
  cells: Cell[][][]; // cells[x][y][z]
}

/** 2Dグリッドビュー（設計図の1面） */
export interface GridView {
  label: string;
  width: number;
  height: number;
  cells: GridCell[][];  // cells[col][row]
}

/** 2Dグリッドの1セル */
export interface GridCell {
  blockType: BlockType;
  color: string;
  confidence: number;
  source: 'auto' | 'manual';
}

/** 推定ブロック候補 */
export interface EstimatedBlock {
  blockType: BlockType;
  color: string;
  count: number;
  confidence: number;
}

/** 建築手順の1ステップ */
export interface BuildStep {
  step: number;
  description: string;
  layer: number;        // Z座標（何段目か）
  blockType: BlockType;
  count: number;
}

/** 解析結果 */
export interface AnalysisResult {
  blockMap: BlueprintData;
  estimatedBlocks: EstimatedBlock[];
  blueprint: {
    topView: GridView;
    frontView: GridView;
    sideView: GridView;
  };
  blockCounts: Record<string, number>;
  buildSteps: BuildStep[];
}

/** 解析設定 */
export interface AnalysisSettings {
  gridSize: number;       // グリッドの分割数（1辺）
  depthEstimate: number;  // 推定奥行き（ブロック数）
  gameTitle?: string;     // ゲームタイトル
  buildingSize?: 'small' | 'medium' | 'large';
}

/** ビューの種類 */
export type ViewType = 'top' | 'front' | 'side';

/** RGB色 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}
