# 超初心者向け：AI下絵工房を動かす手順

この手順は「できるだけ迷わず、1つずつ進める」ためのガイドです。

## まず知っておくこと

AI下絵工房は、次の3つをつなげて動きます。

1. **このアプリ**: 画面を表示します。
2. **Supabase**: ログイン、画像履歴、プロジェクト、プリセットを保存します。
3. **OpenAI API**: 画像生成と赤ペイント修正を実行します。

環境変数が未設定でも、画面だけは確認できます。保存や画像生成まで使うには Supabase と OpenAI の設定が必要です。

---

## コースA：まず画面だけ見る（一番かんたん）

PCでこのリポジトリを開ける場合は、まずこれだけでOKです。

```bash
npm install
npm run dev
```

表示された `http://localhost:3000` をブラウザで開きます。

この状態では、トップページ、生成画面、ログイン画面などの見た目を確認できます。ただし、Supabase と OpenAI をまだ設定していないので、ログイン、保存、画像生成、画像編集は動きません。

---

## コースB：スマホだけで本番URLを作る

スマホだけで使えるURLを作るなら、Vercelにデプロイするのが一番簡単です。

### Step 1: 必要なアカウントを用意する

次の3つにログインできる状態にします。

- GitHub
- Supabase
- Vercel
- OpenAI Platform

### Step 2: Supabaseでプロジェクトを作る

1. Supabaseを開きます。
2. **New project** を押します。
3. Project name に `ai-shitae-kobo` などを入れます。
4. Database password を設定します。
5. **Create new project** を押します。

### Step 3: SupabaseにSQLを入れる

1. Supabaseのプロジェクト画面を開きます。
2. 左メニューの **SQL Editor** を開きます。
3. **New query** を押します。
4. リポジトリ内の `supabase/schema.sql` の中身を全部コピーします。
5. SQL Editorに貼り付けます。
6. **Run** を押します。

これで、画像履歴、作品、プリセット、赤ペイント修正履歴を保存する場所ができます。

### Step 4: Supabaseの値をメモする

Supabaseの **Project Settings > API** で、次の2つをメモします。

```env
NEXT_PUBLIC_SUPABASE_URL=Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon public key
```

### Step 5: OpenAI API keyをメモする

OpenAI PlatformでAPI keyを作り、次の形でメモします。

```env
OPENAI_API_KEY=sk-...
```

### Step 6: Vercelにリポジトリを読み込ませる

1. Vercelを開きます。
2. **Add New... > Project** を押します。
3. GitHubのこのリポジトリを選びます。
4. Frameworkが **Next.js** になっていることを確認します。

### Step 7: Vercelに環境変数を入れる

Vercelの **Environment Variables** に、次の5つを1つずつ入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=SupabaseのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseのanon public key
NEXT_PUBLIC_SITE_URL=あとでVercelのURLにする
OPENAI_API_KEY=OpenAIのAPI key
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

最初のデプロイ前に `NEXT_PUBLIC_SITE_URL` がまだ分からない場合は、デプロイ後にVercelのURLへ直して、もう一度DeployしてOKです。

### Step 8: Deployする

1. Vercelの **Deploy** を押します。
2. 完了するまで待ちます。
3. `https://xxxxx.vercel.app` のようなURLを開きます。

### Step 9: Supabase Authの戻り先を設定する

ログインメールからアプリに戻れるようにします。

1. Supabaseを開きます。
2. **Authentication > URL Configuration** を開きます。
3. **Site URL** にVercelのURLを入れます。
4. **Redirect URLs** に次を入れます。

```txt
https://あなたのVercel URL/auth/callback
```

### Step 10: アプリでログインして使う

1. VercelのURLを開きます。
2. `/login` に行きます。
3. メールアドレスを入力します。
4. 届いたメールリンクを開きます。
5. `/generate` で画像を生成します。
6. `/library` で保存された画像を確認します。
7. 画像詳細から赤ペイント修正に進みます。

---

## コースC：PCで本当に生成まで動かす

PCでローカル実行しながら本当に生成まで動かす場合は、`.env.local` を作ります。

```bash
cp .env.example .env.local
```

`.env.local` を開いて、次の値を入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=SupabaseのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseのanon public key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=OpenAIのAPI key
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

その後、起動します。

```bash
npm run dev
```

Supabase AuthのRedirect URLsには、ローカル用に次も追加します。

```txt
http://localhost:3000/auth/callback
```

---

## うまくいかない時の見方

### 画面に「Supabase 環境変数が未設定」と出る

Supabaseの環境変数が入っていません。

確認するもの:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 画面に「OpenAI API key が未設定」と出る

OpenAIの環境変数が入っていません。

確認するもの:

- `OPENAI_API_KEY`

### ログインメールから戻れない

Supabase AuthのRedirect URLが足りない可能性があります。

Vercelなら:

```txt
https://あなたのVercel URL/auth/callback
```

ローカルなら:

```txt
http://localhost:3000/auth/callback
```

### 画像生成に失敗する

次を確認してください。

- OpenAI API keyが正しいか
- OpenAI APIの課金設定が有効か
- Vercelに `OPENAI_API_KEY` を入れたあと再デプロイしたか
- Supabase Storage bucketがSQLで作成済みか

---

## 最短チェックリスト

- [ ] Supabase Projectを作った
- [ ] `supabase/schema.sql` をSupabase SQL Editorで実行した
- [ ] SupabaseのProject URLを控えた
- [ ] Supabaseのanon public keyを控えた
- [ ] OpenAI API keyを作った
- [ ] VercelにリポジトリをImportした
- [ ] Vercelに環境変数を5つ入れた
- [ ] VercelでDeployした
- [ ] Supabase Authに `/auth/callback` を入れた
- [ ] `/login` でログインできた
- [ ] `/generate` で生成できた
