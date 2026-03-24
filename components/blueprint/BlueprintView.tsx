'use client';

import { useState, useRef, useCallback } from 'react';
import { GridView, GridCell, ViewType, BlockType, BlueprintData } from '@/lib/blueprint/types';
import { getBlockIcon, getBlockLabel } from '@/lib/blueprint/blockMaster';
import { generateView } from '@/lib/blueprint/viewGenerator';

interface BlueprintViewProps {
  blockMap: BlueprintData;
  onCellClick?: (x: number, y: number, viewType: ViewType, layer: number) => void;
  selectedBlockType?: BlockType;
}

/**
 * 設計図ビューコンポーネント
 * 上面図・正面図・側面図を切り替えて表示
 * グリッドをクリックしてブロック種別を変更可能
 */
export default function BlueprintView({
  blockMap,
  onCellClick,
  selectedBlockType,
}: BlueprintViewProps) {
  const [viewType, setViewType] = useState<ViewType>('front');
  const [layer, setLayer] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // ビューを生成
  const view = generateView(blockMap, viewType, viewType === 'top' ? layer : undefined);

  // レイヤー数
  const maxLayer = viewType === 'top'
    ? blockMap.height
    : viewType === 'front'
      ? blockMap.depth
      : blockMap.width;

  // セルサイズの計算（レスポンシブ）
  const cellSize = Math.max(16, Math.min(32, Math.floor(400 / Math.max(view.width, view.height))));

  const handleCellClick = (x: number, y: number) => {
    if (onCellClick) {
      onCellClick(x, y, viewType, layer);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ビュー切替タブ */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold mr-2">設計図</h2>
        {(
          [
            { type: 'top' as ViewType, label: '上面図', icon: '⬆️' },
            { type: 'front' as ViewType, label: '正面図', icon: '🔲' },
            { type: 'side' as ViewType, label: '側面図', icon: '▶️' },
          ] as const
        ).map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => { setViewType(type); setLayer(0); }}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${viewType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* レイヤー切替 */}
      {maxLayer > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">
            {viewType === 'top' ? '段:' : viewType === 'front' ? '奥行き:' : '横位置:'}
          </span>
          {Array.from({ length: maxLayer }, (_, i) => (
            <button
              key={i}
              onClick={() => setLayer(i)}
              className={`
                w-8 h-8 rounded text-xs font-medium transition-colors
                ${layer === i
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ビューラベル */}
      <p className="text-sm text-gray-500">{view.label}</p>

      {/* 軸ラベル説明 */}
      <div className="text-xs text-gray-400 flex gap-4">
        {viewType === 'top' && <><span>← X（横）→</span><span>↑ Y（奥）↓</span></>}
        {viewType === 'front' && <><span>← X（横）→</span><span>↑ Z（高さ）↓</span></>}
        {viewType === 'side' && <><span>← Y（奥）→</span><span>↑ Z（高さ）↓</span></>}
      </div>

      {/* グリッド表示 */}
      <div className="overflow-auto border rounded-lg bg-white p-2">
        <div
          className="inline-grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${view.width}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: view.height }, (_, row) =>
            Array.from({ length: view.width }, (_, col) => {
              const cell = view.cells[col]?.[row];
              const isEmpty = !cell || cell.blockType === 'empty';
              const isHovered = hoveredCell?.x === col && hoveredCell?.y === row;
              const isLowConfidence = cell && cell.confidence < 0.4;
              const isManual = cell?.source === 'manual';

              return (
                <div
                  key={`${col}-${row}`}
                  className={`
                    border border-gray-200 cursor-pointer transition-all
                    flex items-center justify-center text-xs
                    ${isHovered ? 'ring-2 ring-blue-500 z-10' : ''}
                    ${isManual ? 'ring-1 ring-green-400' : ''}
                    ${selectedBlockType ? 'hover:opacity-80' : ''}
                  `}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: isEmpty ? '#F9FAFB' : cell.color,
                    opacity: isEmpty ? 0.3 : (isLowConfidence ? 0.6 : 1),
                  }}
                  onMouseEnter={() => setHoveredCell({ x: col, y: row })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => handleCellClick(col, row)}
                  title={
                    cell
                      ? `${getBlockLabel(cell.blockType)} (確信度: ${Math.round(cell.confidence * 100)}%)`
                      : '空'
                  }
                >
                  {isLowConfidence && !isEmpty && (
                    <span className="opacity-60">?</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ホバー情報 */}
      {hoveredCell && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5">
          位置: ({hoveredCell.x + 1}, {hoveredCell.y + 1})
          {(() => {
            const cell = view.cells[hoveredCell.x]?.[hoveredCell.y];
            if (!cell || cell.blockType === 'empty') return ' — 空';
            return ` — ${getBlockIcon(cell.blockType)} ${getBlockLabel(cell.blockType)} (確信度: ${Math.round(cell.confidence * 100)}%) ${cell.source === 'manual' ? '(手動修正済)' : ''}`;
          })()}
        </div>
      )}
    </div>
  );
}
