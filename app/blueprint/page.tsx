'use client';

import { useState, useCallback, useRef } from 'react';
import ImageUploader from '@/components/blueprint/ImageUploader';
import SettingsPanel from '@/components/blueprint/SettingsPanel';
import BlueprintView from '@/components/blueprint/BlueprintView';
import Preview3D from '@/components/blueprint/Preview3D';
import BlockPalette from '@/components/blueprint/BlockPalette';
import BlockCounter from '@/components/blueprint/BlockCounter';
import BuildSteps from '@/components/blueprint/BuildSteps';
import { AnalysisResult, AnalysisSettings, BlockType, ViewType } from '@/lib/blueprint/types';
import { analyzeImage, DEFAULT_SETTINGS } from '@/lib/blueprint/analyzer';
import { getBlockColor } from '@/lib/blueprint/blockMaster';
import { downloadJSON, drawBlueprintToCanvas, downloadCanvasAsPNG } from '@/lib/blueprint/exportUtils';
import { generateView, generateTopView, generateFrontView, generateSideView } from '@/lib/blueprint/viewGenerator';
import { countBlocks, generateBuildSteps } from '@/lib/blueprint/stepGenerator';

/**
 * ブロック設計図メーカー メインページ
 */
export default function BlueprintPage() {
  const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
  const [imageDataCache, setImageDataCache] = useState<{
    data: ImageData;
    width: number;
    height: number;
  } | null>(null);

  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  // 画像アップロード時の処理
  const handleImageLoad = useCallback(
    (imageData: ImageData, file: File) => {
      setIsAnalyzing(true);
      setImageDataCache({
        data: imageData,
        width: imageData.width,
        height: imageData.height,
      });

      // 少し遅延させてUIを更新してから解析開始
      setTimeout(() => {
        try {
          const analysisResult = analyzeImage(
            imageData.data,
            imageData.width,
            imageData.height,
            settings
          );
          setResult(analysisResult);
        } catch (error) {
          console.error('解析エラー:', error);
          alert('画像の解析中にエラーが発生しました。別の画像を試してください。');
        } finally {
          setIsAnalyzing(false);
        }
      }, 100);
    },
    [settings]
  );

  // 設定変更時に再解析
  const handleSettingsChange = useCallback(
    (newSettings: AnalysisSettings) => {
      setSettings(newSettings);
      if (imageDataCache) {
        setIsAnalyzing(true);
        setTimeout(() => {
          try {
            const analysisResult = analyzeImage(
              imageDataCache.data.data,
              imageDataCache.width,
              imageDataCache.height,
              newSettings
            );
            setResult(analysisResult);
          } catch (error) {
            console.error('再解析エラー:', error);
          } finally {
            setIsAnalyzing(false);
          }
        }, 50);
      }
    },
    [imageDataCache]
  );

  // セルクリック時の編集処理
  const handleCellClick = useCallback(
    (col: number, row: number, viewType: ViewType, layer: number) => {
      if (!result || !selectedBlockType) return;

      const newResult = { ...result };
      const blockMap = { ...newResult.blockMap };
      // cellsをディープコピー
      const cells = blockMap.cells.map((xArr) =>
        xArr.map((yArr) => yArr.map((cell) => ({ ...cell })))
      );

      // ビュータイプに応じて実際の3D座標を特定
      let x: number, y: number, z: number;
      if (viewType === 'front') {
        x = col;
        y = layer;
        z = blockMap.height - 1 - row;
      } else if (viewType === 'top') {
        x = col;
        y = row;
        z = layer;
      } else {
        // side
        y = col;
        x = layer;
        z = blockMap.height - 1 - row;
      }

      // 範囲チェック
      if (x < 0 || x >= blockMap.width || y < 0 || y >= blockMap.depth || z < 0 || z >= blockMap.height) {
        return;
      }

      // セルを更新
      cells[x][y][z] = {
        blockType: selectedBlockType,
        confidence: 1,
        source: 'manual',
        color: selectedBlockType === 'empty' ? '#FFFFFF' : getBlockColor(selectedBlockType),
      };

      blockMap.cells = cells;
      newResult.blockMap = blockMap;

      // ブロック数と手順を再計算
      newResult.blockCounts = countBlocks(blockMap);
      newResult.buildSteps = generateBuildSteps(blockMap);

      // ビューを再生成
      newResult.blueprint = {
        topView: generateTopView(blockMap),
        frontView: generateFrontView(blockMap),
        sideView: generateSideView(blockMap),
      };

      setResult(newResult);
    },
    [result, selectedBlockType]
  );

  // PNGエクスポート
  const handleExportPNG = useCallback(() => {
    if (!result || !exportCanvasRef.current) return;
    drawBlueprintToCanvas(exportCanvasRef.current, result);
    downloadCanvasAsPNG(exportCanvasRef.current, 'blueprint.png');
  }, [result]);

  // JSONエクスポート
  const handleExportJSON = useCallback(() => {
    if (!result) return;
    downloadJSON(result, 'blueprint.json');
  }, [result]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            ブロック設計図メーカー
          </h1>
          {result && (
            <div className="flex gap-2">
              <button
                onClick={handleExportPNG}
                className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg
                           hover:bg-green-600 transition-colors"
              >
                PNG保存
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg
                           hover:bg-blue-600 transition-colors"
              >
                JSON保存
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 軸の説明（初心者向け） */}
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          <span className="font-bold">軸の見方:</span>{' '}
          <span className="inline-block mx-1 px-2 py-0.5 bg-red-100 rounded text-red-700 font-medium">X = 横</span>
          <span className="inline-block mx-1 px-2 py-0.5 bg-green-100 rounded text-green-700 font-medium">Y = 奥</span>
          <span className="inline-block mx-1 px-2 py-0.5 bg-blue-100 rounded text-blue-700 font-medium">Z = 高さ</span>
          （ブロックを積む方向がZ、横に並べるのがX、奥に置くのがY）
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== 左カラム: アップロード + 設定 ===== */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <ImageUploader onImageLoad={handleImageLoad} isAnalyzing={isAnalyzing} />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <SettingsPanel settings={settings} onChange={handleSettingsChange} />
            </div>
          </div>

          {/* ===== 中央カラム: プレビュー + 設計図 ===== */}
          <div className="lg:col-span-6 space-y-6">
            {result ? (
              <>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <Preview3D blockMap={result.blockMap} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <BlueprintView
                    blockMap={result.blockMap}
                    onCellClick={handleCellClick}
                    selectedBlockType={selectedBlockType ?? undefined}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-16 text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  建築物の画像をアップロードしよう
                </h2>
                <p className="text-gray-500">
                  左のエリアから画像をアップロードすると、<br />
                  自動で設計図に変換されます
                </p>
                <div className="mt-6 text-sm text-gray-400 space-y-1">
                  <p>対応形式: PNG / JPG</p>
                  <p>ブロック建築ゲームの建物画像がおすすめ</p>
                </div>
              </div>
            )}
          </div>

          {/* ===== 右カラム: ブロック一覧 + 手順 ===== */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <BlockCounter blockCounts={result.blockCounts} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <BuildSteps steps={result.buildSteps} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== 下部: 編集パネル ===== */}
        {result && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <BlockPalette
              selectedType={selectedBlockType}
              onSelect={setSelectedBlockType}
            />
          </div>
        )}
      </main>

      {/* エクスポート用の非表示Canvas */}
      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  );
}
