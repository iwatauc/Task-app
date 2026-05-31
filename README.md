# AI下絵工房

AI画像を完成品としてではなく、イラスト制作の下絵・構図参考・ポーズ参考・線画参考・色ラフ参考として作成、保存、赤ペイント修正できる Next.js App Router MVP です。

## 主な機能

- Supabase Auth のメールリンクログイン
- 日本語フォームから下絵向け OpenAI 画像生成プロンプトをサーバー側で整形
- 生成画像・アップロード画像を Supabase Storage と Postgres に保存
- ライブラリ検索、source_type とお気に入り絞り込み
- 画像詳細、プロンプト、タグ、バージョン履歴、修正指示履歴
- Canvas ベースの赤ペイント修正 UI（pointer events 対応）
- 元画像サイズに合わせた overlay / mask PNG 生成
- OpenAI 画像編集 API 呼び出し、修正版保存、edit_requests 履歴保存
- プロンプトプリセット、作品管理、プロジェクト紐付け

## 技術構成

- Next.js App Router / TypeScript / Tailwind CSS v4
- Supabase Auth / Postgres / Storage
- OpenAI Images API（サーバー Route Handler からのみ呼び出し）
- Canvas API（fabric.js / Konva なしで依存を抑えた MVP）

> TODO: npm registry の制限がある環境でもビルドできるよう、OpenAI 連携は `lib/services/openaiImageService.ts` に REST 実装として隔離しています。公式 Node SDK へ移行する場合もこの service 層だけを差し替えれば済む構成です。

## セットアップ

1. 依存関係をインストールします。

```bash
npm install
```

2. `.env.example` を `.env.local` にコピーして値を設定します。

```bash
cp .env.example .env.local
```

必要な環境変数:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

3. Supabase SQL Editor で `supabase/schema.sql` を実行します。

4. Supabase Auth の Email provider を有効化し、Site URL / Redirect URL に以下を追加します。

- `http://localhost:3000`
- `http://localhost:3000/auth/callback`
- Vercel デプロイ後の本番 URL と `/auth/callback`

5. 開発サーバーを起動します。

```bash
npm run dev
```

## 動作確認手順

1. `/login` でメールリンクログインします。
2. `/generate` で目的、キャラ説明、ポーズ、構図、出力タイプを入力して生成します。
3. 生成後 `/images/[id]` に遷移し、画像・日本語メモ・整形後プロンプトを確認します。
4. `/generate` のアップロードフォームから手元の画像を保存します。
5. `/library` で一覧、検索、source_type、お気に入り絞り込みを確認します。
6. 詳細ページで「この画像を修正する」を押して `/images/[id]/edit` に移動します。
7. 赤ブラシで修正範囲を塗り、修正指示を入力して「この範囲を修正」を押します。
8. 修正版が保存され、親画像のバージョン履歴と edit_requests に記録されることを確認します。
9. `/presets` でプリセットを作成し、生成画面の詳細設定で選択します。
10. `/projects` で作品を作成し、画像詳細からプロジェクトに紐付けます。

## 最短起動手順

```bash
cp .env.example .env.local
# .env.local を編集
# Supabase SQL Editor で supabase/schema.sql を実行
npm install
npm run dev
```

## TODO / 注意点

- OpenAI 公式 Node SDK は npm registry 制限によりこの環境では追加できなかったため、service 層に REST 実装で隔離しています。
- アップロード画像の width / height はブラウザ編集時の naturalWidth / naturalHeight を使ってマスク生成します。DB への寸法保存は今後 `sharp` 等で補強できます。
- Storage bucket は public URL 前提の MVP です。秘匿性を高める場合は signed URL 化してください。
- タグ検索は MVP では簡易検索です。高度なタグ UI は今後追加可能です。
