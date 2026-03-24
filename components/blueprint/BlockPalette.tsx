'use client';

import { BlockType } from '@/lib/blueprint/types';
import { DEFAULT_BLOCK_MASTER } from '@/lib/blueprint/blockMaster';

interface BlockPaletteProps {
  selectedType: BlockType | null;
  onSelect: (type: BlockType | null) => void;
}

/**
 * ブロック選択パレット
 * クリックでブロック種別を選択し、設計図上のマスを編集する
 */
export default function BlockPalette({ selectedType, onSelect }: BlockPaletteProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-gray-700">ブロック選択</h3>
      <p className="text-xs text-gray-400">
        ブロックを選んで設計図のマスをクリックすると変更できます
      </p>

      <div className="flex flex-wrap gap-1.5">
        {/* 消しゴム（空にする） */}
        <button
          onClick={() => onSelect(selectedType === 'empty' ? null : 'empty')}
          className={`
            flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
            transition-colors border
            ${selectedType === 'empty'
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
          `}
        >
          🧹 消す
        </button>

        {DEFAULT_BLOCK_MASTER.map((block) => (
          <button
            key={block.type}
            onClick={() => onSelect(selectedType === block.type ? null : block.type)}
            className={`
              flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
              transition-colors border
              ${selectedType === block.type
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:bg-gray-50'}
            `}
            style={{
              backgroundColor: selectedType === block.type
                ? block.color + '30'
                : undefined,
            }}
          >
            <span
              className="w-4 h-4 rounded-sm inline-block border border-gray-300"
              style={{ backgroundColor: block.color }}
            />
            {block.label}
          </button>
        ))}
      </div>

      {selectedType && selectedType !== 'empty' && (
        <p className="text-xs text-blue-600">
          設計図のマスをクリックして配置してください
        </p>
      )}
      {selectedType === null && (
        <p className="text-xs text-gray-400">
          ブロックを選択していません（情報表示モード）
        </p>
      )}
    </div>
  );
}
