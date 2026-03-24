// ========================================
// 画像解析API
// POST: 画像データを受け取り、設計図データを返す
// ========================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    // 画像解析はクライアントサイドのCanvas APIで行うため、
    // このAPIはサーバーサイドで追加処理が必要になった場合に使う
    // MVPではクライアントサイドで完結するが、将来拡張用に残す

    return NextResponse.json({
      success: true,
      message: 'サーバーサイド解析は将来実装予定です。現在はクライアントサイドで処理しています。',
      settings,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: '解析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
