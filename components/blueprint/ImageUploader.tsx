'use client';

import { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageLoad: (imageData: ImageData, file: File) => void;
  isAnalyzing: boolean;
}

/**
 * 画像アップロードコンポーネント
 * ドラッグ&ドロップまたはクリックで画像を選択
 */
export default function ImageUploader({ onImageLoad, isAnalyzing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('PNG または JPG ファイルを選択してください');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setPreview(src);

        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          // 画像を最大512pxにリサイズ（処理速度のため）
          const maxSize = 512;
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            const scale = maxSize / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          onImageLoad(imageData, file);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">画像アップロード</h2>

      {/* ドロップゾーン */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="アップロード画像"
              className="max-h-48 mx-auto rounded-lg shadow-sm"
            />
            <p className="text-sm text-gray-500">クリックまたはドラッグで画像を変更</p>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <div className="text-4xl">📷</div>
            <p className="text-gray-600 font-medium">
              建築物の画像をドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-400">
              または クリックしてファイルを選択
            </p>
            <p className="text-xs text-gray-400">PNG / JPG 対応</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 画像処理用の非表示Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {isAnalyzing && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">解析中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
