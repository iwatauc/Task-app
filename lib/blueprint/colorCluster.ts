// ========================================
// 色クラスタリング
// 画像のピクセルを近い色ごとにグループ化
// ========================================

import { RGB } from './types';

/** クラスタ結果 */
export interface ColorCluster {
  centroid: RGB;       // 代表色
  hex: string;         // HEX表記
  count: number;       // ピクセル数
  percentage: number;  // 割合
}

/** 2色間の距離（ユークリッド距離） */
export function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

/** RGBをHEXに変換 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** HEXをRGBに変換 */
export function hexToRgb(hex: string): RGB {
  const match = hex.replace('#', '').match(/.{2}/g);
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
  };
}

/**
 * 簡易k-meansクラスタリング
 * 画像のピクセルデータからk個の色グループに分類する
 */
export function kMeansCluster(
  pixels: RGB[],
  k: number = 8,
  maxIterations: number = 20
): ColorCluster[] {
  if (pixels.length === 0) return [];

  // 初期セントロイドをランダムに選択
  const centroids: RGB[] = [];
  const step = Math.max(1, Math.floor(pixels.length / k));
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[Math.min(i * step, pixels.length - 1)] });
  }

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // 各ピクセルを最も近いセントロイドに割り当て
    const newAssignments = pixels.map((pixel) => {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = colorDistance(pixel, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      return closest;
    });

    // 収束チェック
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    if (!changed) break;

    // セントロイドを更新
    for (let c = 0; c < k; c++) {
      const members = pixels.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      centroids[c] = {
        r: Math.round(members.reduce((s, m) => s + m.r, 0) / members.length),
        g: Math.round(members.reduce((s, m) => s + m.g, 0) / members.length),
        b: Math.round(members.reduce((s, m) => s + m.b, 0) / members.length),
      };
    }
  }

  // クラスタごとの結果を集計
  const clusters: ColorCluster[] = centroids.map((centroid, c) => {
    const count = assignments.filter((a) => a === c).length;
    return {
      centroid,
      hex: rgbToHex(centroid),
      count,
      percentage: pixels.length > 0 ? count / pixels.length : 0,
    };
  });

  // ピクセル数順にソート
  return clusters
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * 画像データからピクセル配列を取得
 * サンプリングして処理を軽くする
 */
export function extractPixels(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  sampleRate: number = 4  // 4ピクセルに1回サンプリング
): RGB[] {
  const pixels: RGB[] = [];
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      const a = imageData[i + 3];
      // 透明ピクセルはスキップ
      if (a < 128) continue;
      pixels.push({
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2],
      });
    }
  }
  return pixels;
}

/**
 * グリッドセルの平均色を計算
 */
export function getAverageColor(
  imageData: Uint8ClampedArray,
  imgWidth: number,
  startX: number,
  startY: number,
  cellWidth: number,
  cellHeight: number
): RGB {
  let r = 0, g = 0, b = 0, count = 0;

  for (let y = startY; y < startY + cellHeight; y++) {
    for (let x = startX; x < startX + cellWidth; x++) {
      const i = (y * imgWidth + x) * 4;
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
      count++;
    }
  }

  if (count === 0) return { r: 0, g: 0, b: 0 };
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}
