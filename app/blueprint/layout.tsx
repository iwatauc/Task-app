import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ブロック設計図メーカー',
  description: '建築物の画像からブロック建築ゲーム向けの設計図を自動生成',
};

export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
