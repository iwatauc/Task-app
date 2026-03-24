// ========================================
// グリッド変換
// 画像をブロック単位のグリッドに変換
// ========================================

import { RGB, Cell, BlueprintData } from './types';
import { getAverageColor, rgbToHex } from './colorCluster';
import { matchBlockType } from './blockMatcher';

/**
 * 画像データをグリッドに変換する
 * 画像を gridWidth × gridHeight のマス目に分割し、
 * 各マスの平均色からブロック種別を推定する
 */
export function imageToGrid(
  imageData: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  gridWidth: number,
  gridHeight: number
): { color: RGB; hex: string }[][] {
  const cellW = imgWidth / gridWidth;
  const cellH = imgHeight / gridHeight;
  const grid: { color: RGB; hex: string }[][] = [];

  for (let gx = 0; gx < gridWidth; gx++) {
    grid[gx] = [];
    for (let gy = 0; gy < gridHeight; gy++) {
      const startX = Math.floor(gx * cellW);
      const startY = Math.floor(gy * cellH);
      const w = Math.floor(cellW);
      const h = Math.floor(cellH);
      const color = getAverageColor(imageData, imgWidth, startX, startY, w, h);
      grid[gx][gy] = { color, hex: rgbToHex(color) };
    }
  }

  return grid;
}

/**
 * 2Dグリッドから3Dブループリントデータを生成
 * MVPでは正面画像から奥行きを簡易推定する
 *
 * 考え方:
 * - 正面画像のX方向 → BlueprintのX軸（横）
 * - 正面画像のY方向 → BlueprintのZ軸（高さ）※上下反転
 * - 奥行き（Y軸）は推定値で均一に設定
 */
export function gridToBlueprintData(
  colorGrid: { color: RGB; hex: string }[][],
  gridWidth: number,
  gridHeight: number,
  depthEstimate: number
): BlueprintData {
  const cells: Cell[][][] = [];

  for (let x = 0; x < gridWidth; x++) {
    cells[x] = [];
    for (let y = 0; y < depthEstimate; y++) {
      cells[x][y] = [];
      for (let z = 0; z < gridHeight; z++) {
        // Z軸は上から下に対応（画像のY=0が一番上 → Z=gridHeight-1）
        const imgY = gridHeight - 1 - z;
        const colorInfo = colorGrid[x][imgY];
        const { blockType, confidence } = matchBlockType(colorInfo.color);

        // 奥行き方向: 端のセルは空にする（簡易的な形状推定）
        const isEdgeDepth = y === 0 || y === depthEstimate - 1;
        const isSurface = y === 0; // 正面は表示

        cells[x][y][z] = {
          blockType: blockType === 'empty' ? 'empty' :
            (depthEstimate <= 1 || isSurface || isInterior(x, z, gridWidth, gridHeight))
              ? blockType : blockType,
          confidence: isSurface ? confidence : confidence * 0.7,
          source: 'auto',
          color: colorInfo.hex,
        };
      }
    }
  }

  return {
    width: gridWidth,
    depth: depthEstimate,
    height: gridHeight,
    cells,
  };
}

/**
 * 内部ブロックかどうかの簡易判定
 * 外周でなければ内部とみなす
 */
function isInterior(x: number, z: number, width: number, height: number): boolean {
  return x > 0 && x < width - 1 && z > 0 && z < height - 1;
}

/**
 * 背景色の判定（明るすぎる or 暗すぎるピクセルは背景とみなす）
 */
export function isBackgroundColor(color: RGB): boolean {
  const brightness = (color.r + color.g + color.b) / 3;
  // とても明るい色（白背景）またはとても暗い色（黒背景）
  if (brightness > 240 || brightness < 15) return true;
  // 彩度がとても低く明るい色
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  if (max - min < 10 && brightness > 200) return true;
  return false;
}
