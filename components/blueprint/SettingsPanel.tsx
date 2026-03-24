'use client';

import { AnalysisSettings } from '@/lib/blueprint/types';

interface SettingsPanelProps {
  settings: AnalysisSettings;
  onChange: (settings: AnalysisSettings) => void;
}

/**
 * 設定パネル
 * グリッドサイズや奥行きなどを調整
 */
export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">設定</h2>

      <div className="space-y-3 text-sm">
        {/* グリッドサイズ */}
        <div>
          <label className="block text-gray-600 mb-1">
            グリッドサイズ（細かさ）
          </label>
          <input
            type="range"
            min="8"
            max="32"
            step="2"
            value={settings.gridSize}
            onChange={(e) =>
              onChange({ ...settings, gridSize: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>粗い (8)</span>
            <span className="font-medium text-gray-600">{settings.gridSize}</span>
            <span>細かい (32)</span>
          </div>
        </div>

        {/* 奥行き推定 */}
        <div>
          <label className="block text-gray-600 mb-1">
            奥行き（ブロック数）
          </label>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={settings.depthEstimate}
            onChange={(e) =>
              onChange({ ...settings, depthEstimate: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>薄い (1)</span>
            <span className="font-medium text-gray-600">{settings.depthEstimate}</span>
            <span>厚い (16)</span>
          </div>
        </div>

        {/* 建築サイズ */}
        <div>
          <label className="block text-gray-600 mb-1">建築サイズ</label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onChange({ ...settings, buildingSize: size })}
                className={`
                  flex-1 py-1.5 px-2 rounded-lg text-xs font-medium
                  transition-colors
                  ${settings.buildingSize === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </button>
            ))}
          </div>
        </div>

        {/* ゲームタイトル */}
        <div>
          <label className="block text-gray-600 mb-1">ゲーム（任意）</label>
          <input
            type="text"
            placeholder="ぽこあポケモン"
            value={settings.gameTitle ?? ''}
            onChange={(e) =>
              onChange({ ...settings, gameTitle: e.target.value || undefined })
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
