// ========================================
// 建築手順生成
// 3Dデータから建築手順を自動生成
// ========================================

import { BlueprintData, BuildStep, BlockType } from './types';
import { getBlockLabel, DEFAULT_BLOCK_MASTER } from './blockMaster';

/**
 * 建築手順を生成する
 *
 * 基本方針:
 * 1. 下の段（Z=0）から上（Z=max）へ
 * 2. 各段ではブロックの優先度順に配置
 *    （床→壁→柱→模様→発光→ガラス→装飾）
 */
export function generateBuildSteps(data: BlueprintData): BuildStep[] {
  const steps: BuildStep[] = [];
  let stepNum = 1;

  // 各レイヤー（Z=0から）
  for (let z = 0; z < data.height; z++) {
    // この段のブロックを種別ごとに集計
    const blockCounts = new Map<BlockType, number>();

    for (let x = 0; x < data.width; x++) {
      for (let y = 0; y < data.depth; y++) {
        const cell = data.cells[x]?.[y]?.[z];
        if (cell && cell.blockType !== 'empty') {
          blockCounts.set(
            cell.blockType,
            (blockCounts.get(cell.blockType) || 0) + 1
          );
        }
      }
    }

    if (blockCounts.size === 0) continue;

    // 優先度順にソート
    const sorted = [...blockCounts.entries()].sort((a, b) => {
      const prioA = DEFAULT_BLOCK_MASTER.find((m) => m.type === a[0])?.priority ?? 99;
      const prioB = DEFAULT_BLOCK_MASTER.find((m) => m.type === b[0])?.priority ?? 99;
      return prioA - prioB;
    });

    // 各ブロック種別をステップに
    for (const [blockType, count] of sorted) {
      const label = getBlockLabel(blockType);
      const layerLabel = `${z + 1}段目`;

      let description: string;
      if (z === 0) {
        description = `${layerLabel}: ${label}を${count}個配置して土台を作る`;
      } else if (z === data.height - 1) {
        description = `${layerLabel}（最上段）: ${label}を${count}個配置して屋根を仕上げる`;
      } else {
        description = `${layerLabel}: ${label}を${count}個配置する`;
      }

      steps.push({
        step: stepNum++,
        description,
        layer: z,
        blockType,
        count,
      });
    }
  }

  return steps;
}

/**
 * ブロック数の集計
 */
export function countBlocks(data: BlueprintData): Record<string, number> {
  const counts: Record<string, number> = {};

  for (let x = 0; x < data.width; x++) {
    for (let y = 0; y < data.depth; y++) {
      for (let z = 0; z < data.height; z++) {
        const cell = data.cells[x]?.[y]?.[z];
        if (cell && cell.blockType !== 'empty') {
          counts[cell.blockType] = (counts[cell.blockType] || 0) + 1;
        }
      }
    }
  }

  return counts;
}
