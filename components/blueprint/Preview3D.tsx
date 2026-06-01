'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { BlueprintData, BlockType } from '@/lib/blueprint/types';
import { getBlockColor } from '@/lib/blueprint/blockMaster';

interface Preview3DProps {
  blockMap: BlueprintData;
}

/**
 * 簡易3Dプレビュー
 * Canvas2Dでアイソメトリック表示する
 * （three.jsなしの軽量実装）
 */
export default function Preview3D({ blockMap }: Preview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0); // 0, 1, 2, 3 → 4方向

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // アイソメトリック設定
    const blockSize = Math.max(6, Math.min(16, Math.floor(
      200 / Math.max(blockMap.width, blockMap.depth, blockMap.height)
    )));
    const isoX = blockSize * 0.866; // cos(30°)
    const isoY = blockSize * 0.5;   // sin(30°)

    const centerX = w / 2;
    const centerY = h * 0.75;

    // 回転に応じた描画順序
    const { xRange, yRange, xDir, yDir } = getDrawOrder(
      rotation, blockMap.width, blockMap.depth
    );

    // ブロックを奥から手前に描画
    for (const yi of yRange) {
      for (const xi of xRange) {
        for (let z = 0; z < blockMap.height; z++) {
          const cell = getCellRotated(blockMap, xi, yi, z, rotation);
          if (!cell || cell.blockType === 'empty') continue;

          // ローカル座標（回転後）
          const lx = rotation % 2 === 0 ? xi : yi;
          const ly = rotation % 2 === 0 ? yi : xi;

          // アイソメトリック変換
          const screenX = centerX + (lx - ly) * isoX;
          const screenY = centerY + (lx + ly) * isoY - z * blockSize;

          drawIsometricBlock(ctx, screenX, screenY, blockSize, isoX, isoY, cell.color, cell.blockType);
        }
      }
    }
  }, [blockMap, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">3Dプレビュー</h2>
        <button
          onClick={() => setRotation((r) => (r + 1) % 4)}
          className="px-2 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          title="回転"
        >
          🔄 回転
        </button>
      </div>

      <div className="border rounded-lg bg-gradient-to-b from-sky-50 to-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full"
        />
      </div>

      <div className="text-xs text-gray-400 text-center">
        クリックで回転できます（{['正面', '右', '背面', '左'][rotation]}から見ています）
      </div>
    </div>
  );
}

/** 回転に応じた描画順序を計算 */
function getDrawOrder(rotation: number, width: number, depth: number) {
  switch (rotation) {
    case 0: return {
      xRange: range(0, width), yRange: range(0, depth),
      xDir: 1, yDir: 1,
    };
    case 1: return {
      xRange: range(depth - 1, -1), yRange: range(0, width),
      xDir: -1, yDir: 1,
    };
    case 2: return {
      xRange: range(width - 1, -1), yRange: range(depth - 1, -1),
      xDir: -1, yDir: -1,
    };
    case 3: return {
      xRange: range(0, depth), yRange: range(width - 1, -1),
      xDir: 1, yDir: -1,
    };
    default: return {
      xRange: range(0, width), yRange: range(0, depth),
      xDir: 1, yDir: 1,
    };
  }
}

/** 回転に応じたセル取得 */
function getCellRotated(data: BlueprintData, xi: number, yi: number, z: number, rotation: number) {
  let x: number, y: number;
  switch (rotation) {
    case 0: x = xi; y = yi; break;
    case 1: x = yi; y = data.depth - 1 - xi; break;
    case 2: x = data.width - 1 - xi; y = data.depth - 1 - yi; break;
    case 3: x = data.width - 1 - yi; y = xi; break;
    default: x = xi; y = yi;
  }
  return data.cells[x]?.[y]?.[z];
}

/** range関数 */
function range(start: number, end: number): number[] {
  const arr: number[] = [];
  if (start <= end) {
    for (let i = start; i < end; i++) arr.push(i);
  } else {
    for (let i = start; i > end; i--) arr.push(i);
  }
  return arr;
}

/** アイソメトリックブロックを描画 */
function drawIsometricBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isoX: number,
  isoY: number,
  color: string,
  blockType: BlockType
) {
  // 上面
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + isoX, y - size + isoY);
  ctx.lineTo(x, y);
  ctx.lineTo(x - isoX, y - size + isoY);
  ctx.closePath();
  ctx.fillStyle = lightenColor(color, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 左面
  ctx.beginPath();
  ctx.moveTo(x - isoX, y - size + isoY);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + isoY * 2 - size);
  ctx.lineTo(x - isoX, y + isoY);
  ctx.closePath();
  ctx.fillStyle = darkenColor(color, 20);
  ctx.fill();
  ctx.stroke();

  // 右面
  ctx.beginPath();
  ctx.moveTo(x + isoX, y - size + isoY);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + isoY * 2 - size);
  ctx.lineTo(x + isoX, y + isoY);
  ctx.closePath();
  ctx.fillStyle = darkenColor(color, 40);
  ctx.fill();
  ctx.stroke();
}

/** 色を明るくする */
function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

/** 色を暗くする */
function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
