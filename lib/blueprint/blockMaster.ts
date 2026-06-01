// ========================================
// ブロックマスタ定義
// 将来的にゲーム別マスタに差し替え可能
// ========================================

import { BlockType, RGB } from './types';

/** ブロックの定義情報 */
export interface BlockDefinition {
  type: BlockType;
  label: string;        // 日本語名
  labelEn: string;      // 英語名
  color: string;        // 代表色（HEX）
  colorRange: RGB[];    // 判定に使う色の範囲（類似色リスト）
  icon: string;         // 絵文字アイコン
  priority: number;     // 建築順序の優先度（小さい=先に置く）
  description: string;  // 説明
}

/** デフォルトのブロックマスタ（ぽこあポケモン想定） */
export const DEFAULT_BLOCK_MASTER: BlockDefinition[] = [
  {
    type: 'floor',
    label: '床ブロック',
    labelEn: 'Floor',
    color: '#8B7355',
    colorRange: [
      { r: 139, g: 115, b: 85 },
      { r: 160, g: 130, b: 90 },
      { r: 120, g: 100, b: 70 },
    ],
    icon: '🟫',
    priority: 1,
    description: '地面や床に使う基本ブロック',
  },
  {
    type: 'wall',
    label: '壁ブロック',
    labelEn: 'Wall',
    color: '#A0A0A0',
    colorRange: [
      { r: 160, g: 160, b: 160 },
      { r: 180, g: 180, b: 180 },
      { r: 140, g: 140, b: 140 },
      { r: 200, g: 200, b: 200 },
    ],
    icon: '⬜',
    priority: 2,
    description: '壁面に使う基本ブロック',
  },
  {
    type: 'pillar',
    label: '柱ブロック',
    labelEn: 'Pillar',
    color: '#6B4226',
    colorRange: [
      { r: 107, g: 66, b: 38 },
      { r: 90, g: 55, b: 30 },
      { r: 130, g: 80, b: 50 },
    ],
    icon: '🟤',
    priority: 3,
    description: '柱や支柱に使うブロック',
  },
  {
    type: 'light',
    label: '発光ブロック',
    labelEn: 'Light',
    color: '#FFD700',
    colorRange: [
      { r: 255, g: 215, b: 0 },
      { r: 255, g: 255, b: 100 },
      { r: 255, g: 200, b: 50 },
      { r: 255, g: 240, b: 150 },
    ],
    icon: '🟡',
    priority: 5,
    description: '光る装飾ブロック',
  },
  {
    type: 'pattern',
    label: '模様ブロック',
    labelEn: 'Pattern',
    color: '#E07050',
    colorRange: [
      { r: 224, g: 112, b: 80 },
      { r: 200, g: 100, b: 70 },
      { r: 180, g: 80, b: 60 },
    ],
    icon: '🟧',
    priority: 4,
    description: '模様やデザインのあるブロック',
  },
  {
    type: 'glass',
    label: 'ガラスブロック',
    labelEn: 'Glass',
    color: '#87CEEB',
    colorRange: [
      { r: 135, g: 206, b: 235 },
      { r: 150, g: 220, b: 255 },
      { r: 100, g: 180, b: 220 },
      { r: 170, g: 230, b: 255 },
    ],
    icon: '🔷',
    priority: 6,
    description: '透明・半透明のブロック',
  },
  {
    type: 'decoration',
    label: '装飾ブロック',
    labelEn: 'Decoration',
    color: '#FF69B4',
    colorRange: [
      { r: 255, g: 105, b: 180 },
      { r: 255, g: 80, b: 150 },
      { r: 200, g: 50, b: 120 },
      { r: 255, g: 150, b: 200 },
    ],
    icon: '🩷',
    priority: 7,
    description: '装飾用の特殊ブロック',
  },
];

/** ブロック種別からマスタ情報を取得 */
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return DEFAULT_BLOCK_MASTER.find((b) => b.type === type);
}

/** ブロック種別から色を取得 */
export function getBlockColor(type: BlockType): string {
  return getBlockDefinition(type)?.color ?? '#CCCCCC';
}

/** ブロック種別からラベルを取得 */
export function getBlockLabel(type: BlockType): string {
  return getBlockDefinition(type)?.label ?? '不明';
}

/** ブロック種別からアイコンを取得 */
export function getBlockIcon(type: BlockType): string {
  return getBlockDefinition(type)?.icon ?? '⬛';
}

/** 全ブロック種別リスト（empty除く） */
export function getAllBlockTypes(): BlockType[] {
  return DEFAULT_BLOCK_MASTER.map((b) => b.type);
}
