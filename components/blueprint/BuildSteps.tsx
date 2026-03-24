'use client';

import { BuildStep, BlockType } from '@/lib/blueprint/types';
import { getBlockIcon, getBlockColor } from '@/lib/blueprint/blockMaster';

interface BuildStepsProps {
  steps: BuildStep[];
}

/**
 * 建築手順コンポーネント
 * ステップごとに建築順序を表示
 */
export default function BuildSteps({ steps }: BuildStepsProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-gray-700">建築手順</h3>
        <p className="text-xs text-gray-400">まだ解析されていません</p>
      </div>
    );
  }

  // レイヤーごとにグループ化
  const layerGroups = new Map<number, BuildStep[]>();
  for (const step of steps) {
    const group = layerGroups.get(step.layer) ?? [];
    group.push(step);
    layerGroups.set(step.layer, group);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-gray-700">
        建築手順（{steps.length}ステップ）
      </h3>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {steps.map((step) => (
          <div
            key={step.step}
            className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
          >
            {/* ステップ番号 */}
            <span className="shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full
                           flex items-center justify-center text-xs font-bold">
              {step.step}
            </span>

            {/* 説明 */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-700">{step.description}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="w-3 h-3 rounded-sm border border-gray-300"
                  style={{ backgroundColor: getBlockColor(step.blockType) }}
                />
                <span className="text-xs text-gray-400">
                  {getBlockIcon(step.blockType)} ×{step.count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
