// ========================================
// 画像解析メインロジック
// 各モジュールを統合して解析を実行
// ========================================

import { AnalysisResult, AnalysisSettings, BlueprintData, EstimatedBlock, BlockType } from './types';
import { extractPixels, kMeansCluster, rgbToHex } from './colorCluster';
import { imageToGrid, gridToBlueprintData } from './gridConverter';
import { matchBlockType } from './blockMatcher';
import { generateTopView, generateFrontView, generateSideView } from './viewGenerator';
import { generateBuildSteps, countBlocks } from './stepGenerator';

/** デフォルトの解析設定 */
export const DEFAULT_SETTINGS: AnalysisSettings = {
  gridSize: 16,
  depthEstimate: 4,
  buildingSize: 'medium',
};

/**
 * 画像を解析してブループリントデータを生成する
 *
 * 処理の流れ:
 * 1. 画像データからピクセルを抽出
 * 2. 色クラスタリングで主要色を特定
 * 3. グリッドに分割して各セルの平均色を取得
 * 4. 色からブロック種別を推定
 * 5. 3Dデータを生成（奥行きは推定）
 * 6. 各ビュー・手順・ブロック数を生成
 */
export function analyzeImage(
  imageData: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  settings: AnalysisSettings = DEFAULT_SETTINGS
): AnalysisResult {
  // サイズに応じたグリッドサイズ
  const gridSize = settings.gridSize;
  const aspectRatio = imgWidth / imgHeight;
  const gridWidth = Math.round(gridSize * Math.max(1, aspectRatio));
  const gridHeight = Math.round(gridSize / Math.min(1, aspectRatio));
  const depthEstimate = settings.depthEstimate;

  // Step 1: 色クラスタリング（主要色の特定）
  const pixels = extractPixels(imageData, imgWidth, imgHeight, 4);
  const clusters = kMeansCluster(pixels, 8);

  // Step 2: グリッド変換
  const colorGrid = imageToGrid(imageData, imgWidth, imgHeight, gridWidth, gridHeight);

  // Step 3: 3Dブループリントデータ生成
  const blockMap = gridToBlueprintData(colorGrid, gridWidth, gridHeight, depthEstimate);

  // Step 4: 推定ブロック一覧
  const estimatedBlocks = buildEstimatedBlocks(blockMap, clusters);

  // Step 5: 各ビュー生成
  const topView = generateTopView(blockMap);
  const frontView = generateFrontView(blockMap);
  const sideView = generateSideView(blockMap);

  // Step 6: ブロック数集計
  const blockCounts = countBlocks(blockMap);

  // Step 7: 建築手順生成
  const buildSteps = generateBuildSteps(blockMap);

  return {
    blockMap,
    estimatedBlocks,
    blueprint: { topView, frontView, sideView },
    blockCounts,
    buildSteps,
  };
}

/**
 * 推定ブロック一覧を生成
 */
function buildEstimatedBlocks(
  data: BlueprintData,
  clusters: { hex: string; count: number; percentage: number }[]
): EstimatedBlock[] {
  const blockMap = new Map<BlockType, { count: number; totalConf: number; colors: Set<string> }>();

  for (let x = 0; x < data.width; x++) {
    for (let y = 0; y < data.depth; y++) {
      for (let z = 0; z < data.height; z++) {
        const cell = data.cells[x]?.[y]?.[z];
        if (!cell || cell.blockType === 'empty') continue;

        const existing = blockMap.get(cell.blockType);
        if (existing) {
          existing.count++;
          existing.totalConf += cell.confidence;
          existing.colors.add(cell.color);
        } else {
          blockMap.set(cell.blockType, {
            count: 1,
            totalConf: cell.confidence,
            colors: new Set([cell.color]),
          });
        }
      }
    }
  }

  return [...blockMap.entries()].map(([blockType, info]) => ({
    blockType,
    color: [...info.colors][0] ?? '#CCCCCC',
    count: info.count,
    confidence: info.totalConf / info.count,
  }));
}
