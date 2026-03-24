'use client';

import { BlockType } from '@/lib/blueprint/types';
import { getBlockLabel, getBlockIcon, getBlockColor } from '@/lib/blueprint/blockMaster';

interface BlockCounterProps {
  blockCounts: Record<string, number>;
}

/**
 * ブロック数一覧
 * 各ブロック種別の必要数を表示
 */
export default function BlockCounter({ blockCounts }: BlockCounterProps) {
  const entries = Object.entries(blockCounts)
    .filter(([type]) => type !== 'empty')
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-gray-700">
        必要ブロック数
      </h3>

      {entries.length === 0 ? (
        <p className="text-xs text-gray-400">まだ解析されていません</p>
      ) : (
        <>
          <div className="space-y-1">
            {entries.map(([type, count]) => (
              <div
                key={type}
                className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5"
              >
                <span
                  className="w-4 h-4 rounded-sm border border-gray-300 shrink-0"
                  style={{ backgroundColor: getBlockColor(type as BlockType) }}
                />
                <span className="flex-1 text-gray-700">
                  {getBlockIcon(type as BlockType)} {getBlockLabel(type as BlockType)}
                </span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {count}
                </span>
                <span className="text-xs text-gray-400">個</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm font-bold border-t pt-2 mt-1">
            <span className="flex-1 text-gray-600">合計</span>
            <span className="text-gray-900 tabular-nums">{total}</span>
            <span className="text-xs text-gray-400 font-normal">個</span>
          </div>
        </>
      )}
    </div>
  );
}
