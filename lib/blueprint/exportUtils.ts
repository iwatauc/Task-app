// ========================================
// エクスポート機能
// 設計図のPNG/JSON出力
// ========================================

import { AnalysisResult, BlueprintData } from './types';

/**
 * JSONエクスポート
 * ブループリントデータをJSON文字列として出力
 */
export function exportToJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * JSONファイルとしてダウンロード（ブラウザ用）
 */
export function downloadJSON(result: AnalysisResult, filename: string = 'blueprint.json') {
  const json = exportToJSON(result);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * PNGとしてCanvasの内容をダウンロード（ブラウザ用）
 */
export function downloadCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'blueprint.png'
) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * 設計図をCanvasに描画する
 * 上面図・正面図・側面図を並べて1枚の画像にする
 */
export function drawBlueprintToCanvas(
  canvas: HTMLCanvasElement,
  result: AnalysisResult,
  cellSize: number = 20
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { topView, frontView, sideView } = result.blueprint;
  const padding = 40;
  const labelHeight = 30;

  // キャンバスサイズ計算
  const topW = topView.width * cellSize;
  const topH = topView.height * cellSize;
  const frontW = frontView.width * cellSize;
  const frontH = frontView.height * cellSize;
  const sideW = sideView.width * cellSize;
  const sideH = sideView.height * cellSize;

  const totalWidth = topW + frontW + sideW + padding * 4;
  const totalHeight = Math.max(topH, frontH, sideH) + padding * 2 + labelHeight;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // 背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let offsetX = padding;

  // 上面図
  ctx.fillStyle = '#333333';
  ctx.font = '14px sans-serif';
  ctx.fillText(topView.label, offsetX, padding - 8);
  drawGridToCanvas(ctx, topView.cells, topView.width, topView.height, offsetX, padding + labelHeight, cellSize);
  offsetX += topW + padding;

  // 正面図
  ctx.fillText(frontView.label, offsetX, padding - 8);
  drawGridToCanvas(ctx, frontView.cells, frontView.width, frontView.height, offsetX, padding + labelHeight, cellSize);
  offsetX += frontW + padding;

  // 側面図
  ctx.fillText(sideView.label, offsetX, padding - 8);
  drawGridToCanvas(ctx, sideView.cells, sideView.width, sideView.height, offsetX, padding + labelHeight, cellSize);
}

/**
 * グリッドをCanvasに描画
 */
function drawGridToCanvas(
  ctx: CanvasRenderingContext2D,
  cells: { blockType: string; color: string }[][],
  width: number,
  height: number,
  startX: number,
  startY: number,
  cellSize: number
): void {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cell = cells[x]?.[y];
      if (!cell || cell.blockType === 'empty') {
        ctx.fillStyle = '#F5F5F5';
      } else {
        ctx.fillStyle = cell.color;
      }
      ctx.fillRect(startX + x * cellSize, startY + y * cellSize, cellSize, cellSize);
      // 枠線
      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(startX + x * cellSize, startY + y * cellSize, cellSize, cellSize);
    }
  }
}
