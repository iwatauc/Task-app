// ========================================
// 設計図ビュー生成
// 3DデータからTop/Front/Sideビューを生成
// ========================================

import { BlueprintData, GridView, GridCell, ViewType } from './types';

/**
 * 上面図を生成
 * X-Y平面を上から見た図（指定したZ層）
 * Z軸: 小学生向け → 「何段目」
 */
export function generateTopView(data: BlueprintData, zLayer: number = -1): GridView {
  const z = zLayer >= 0 ? zLayer : data.height - 1; // デフォルトは最上段
  const cells: GridCell[][] = [];

  for (let x = 0; x < data.width; x++) {
    cells[x] = [];
    for (let y = 0; y < data.depth; y++) {
      const cell = data.cells[x]?.[y]?.[z];
      cells[x][y] = cell
        ? {
            blockType: cell.blockType,
            color: cell.color,
            confidence: cell.confidence,
            source: cell.source,
          }
        : { blockType: 'empty', color: '#FFFFFF', confidence: 0, source: 'auto' };
    }
  }

  return {
    label: `上から見た図（${z + 1}段目）`,
    width: data.width,
    height: data.depth,
    cells,
  };
}

/**
 * 正面図を生成
 * X-Z平面を正面から見た図（Y=0の面）
 */
export function generateFrontView(data: BlueprintData, yLayer: number = 0): GridView {
  const cells: GridCell[][] = [];

  for (let x = 0; x < data.width; x++) {
    cells[x] = [];
    for (let z = 0; z < data.height; z++) {
      const cell = data.cells[x]?.[yLayer]?.[z];
      // 正面図はZ軸を上下反転して表示（z=0が一番下、画面では一番下に表示）
      cells[x][data.height - 1 - z] = cell
        ? {
            blockType: cell.blockType,
            color: cell.color,
            confidence: cell.confidence,
            source: cell.source,
          }
        : { blockType: 'empty', color: '#FFFFFF', confidence: 0, source: 'auto' };
    }
  }

  return {
    label: '正面から見た図',
    width: data.width,
    height: data.height,
    cells,
  };
}

/**
 * 側面図を生成
 * Y-Z平面を横から見た図（X=0の面）
 */
export function generateSideView(data: BlueprintData, xLayer: number = 0): GridView {
  const cells: GridCell[][] = [];

  for (let y = 0; y < data.depth; y++) {
    cells[y] = [];
    for (let z = 0; z < data.height; z++) {
      const cell = data.cells[xLayer]?.[y]?.[z];
      cells[y][data.height - 1 - z] = cell
        ? {
            blockType: cell.blockType,
            color: cell.color,
            confidence: cell.confidence,
            source: cell.source,
          }
        : { blockType: 'empty', color: '#FFFFFF', confidence: 0, source: 'auto' };
    }
  }

  return {
    label: '横から見た図',
    width: data.depth,
    height: data.height,
    cells,
  };
}

/**
 * ビュータイプに応じたビューを生成
 */
export function generateView(
  data: BlueprintData,
  viewType: ViewType,
  layer?: number
): GridView {
  switch (viewType) {
    case 'top':
      return generateTopView(data, layer);
    case 'front':
      return generateFrontView(data, layer);
    case 'side':
      return generateSideView(data, layer);
  }
}
