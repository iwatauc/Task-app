// ========================================
// ブロック種別推定
// 色情報からブロックの種類を推定する
// ========================================

import { RGB, BlockType } from './types';
import { DEFAULT_BLOCK_MASTER, BlockDefinition } from './blockMaster';
import { colorDistance } from './colorCluster';

/** 推定結果 */
export interface MatchResult {
  blockType: BlockType;
  confidence: number;
  candidates: { blockType: BlockType; distance: number; confidence: number }[];
}

/**
 * RGB色からブロック種別を推定する
 * 各ブロックマスタの色範囲と比較し、最も近いものを返す
 */
export function matchBlockType(color: RGB): MatchResult {
  // 背景色チェック
  const brightness = (color.r + color.g + color.b) / 3;
  if (brightness > 240 || brightness < 15) {
    return {
      blockType: 'empty',
      confidence: 0.9,
      candidates: [],
    };
  }

  const candidates: { blockType: BlockType; distance: number; confidence: number }[] = [];

  for (const block of DEFAULT_BLOCK_MASTER) {
    const minDistance = getMinDistanceToBlock(color, block);
    // 距離を確信度に変換（距離0=確信度1, 距離255=確信度0）
    const confidence = Math.max(0, 1 - minDistance / 200);
    candidates.push({
      blockType: block.type,
      distance: minDistance,
      confidence,
    });
  }

  // 距離が小さい順にソート
  candidates.sort((a, b) => a.distance - b.distance);

  const best = candidates[0];
  return {
    blockType: best.confidence > 0.2 ? best.blockType : 'wall', // 確信度が低い場合はwallにフォールバック
    confidence: best.confidence,
    candidates: candidates.slice(0, 3), // 上位3候補
  };
}

/**
 * 色とブロック定義の最小距離を計算
 */
function getMinDistanceToBlock(color: RGB, block: BlockDefinition): number {
  let minDist = Infinity;
  for (const refColor of block.colorRange) {
    const dist = colorDistance(color, refColor);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/**
 * 複数の候補から最適なブロックを推薦
 * ユーザーが選択肢として見られるようにリスト化
 */
export function getBlockCandidates(
  color: RGB,
  topN: number = 3
): { blockType: BlockType; label: string; confidence: number }[] {
  const result = matchBlockType(color);
  return result.candidates.slice(0, topN).map((c) => {
    const block = DEFAULT_BLOCK_MASTER.find((b) => b.type === c.blockType);
    return {
      blockType: c.blockType,
      label: block?.label ?? '不明',
      confidence: c.confidence,
    };
  });
}
