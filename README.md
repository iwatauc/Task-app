# 家庭予定管理DB

Google Apps Script、Googleスプレッドシート、Googleカレンダー、Google Tasks、OpenAI API、iPhoneショートカットで作る、家庭予定管理自動化MVPです。

このMVPの入力は **Appleメモ監視ではなく、専用iPhoneショートカット「家庭メモ送信」からApps Script WebアプリへPOST** する方式です。Googleスプレッドシートを中心DBにして、最初は `dry_run=true` のままCalendar/Tasksへの登録予定だけを確認します。

## できること

1. iPhoneでショートカット「家庭メモ送信」を押す
2. 雑に日本語で話す
3. Apps Script Webアプリが `RawInbox` に保存する
4. `processInbox()` がOpenAI APIで予定・タスク・買い物・準備・確認待ちへ分類する
5. `Items` に重複を避けて保存する
6. `generatePrepTasks()` が訪問看護、荷物受取、プール、園行事の準備タスクを作る
7. `syncToCalendar()` / `syncToTasks()` が `dry_run=true` なら登録予定を `Items.notes` に追記する
8. `generateDailyPlan()` が当日の予定表を `DailyPlans` に保存する

## ファイル

- `Code.gs`: Google Apps Scriptに貼り付ける本体コード
- `README.md`: セットアップ、iPhoneショートカット、テスト、運用手順

## スプレッドシート構成

`setup()` が以下のシートを自動作成します。

| シート | 役割 |
| --- | --- |
| `RawInbox` | iPhoneショートカットやテストから来た生メモを保存 |
| `Items` | AI分類後の予定、タスク、買い物、準備、確認待ち |
| `Rules` | キーワード別の分類・準備ルール |
| `Templates` | プール、訪問看護、動物病院、荷物受取、園行事の準備テンプレート |
| `Settings` | タイムゾーン、Calendar/Tasks設定、閾値、dry_runなど |
| `DailyPlans` | 生成した日次計画 |
| `Logs` | エラー、警告、処理ログ |

## 事前準備

### 1. Googleスプレッドシートを作る

1. Google Driveで新しいスプレッドシートを作成
2. 名前を `家庭予定管理DB` にする
3. メニューの **拡張機能 → Apps Script** を開く
4. `Code.gs` の中身をこのリポジトリの `Code.gs` 全文で置き換える
5. 保存する

### 2. Script Propertiesを設定する

Apps Scriptエディタで **プロジェクトの設定 → スクリプト プロパティ** を開き、必要な値を登録します。

| プロパティ | 必須 | 説明 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 推奨 | OpenAI APIキー。未設定でも `testWithSampleData()` はローカルMVP分類で動きます |
| `WEBHOOK_TOKEN` | 推奨 | iPhoneショートカットからPOSTする共有シークレット |
| `SPREADSHEET_ID` | 任意 | スタンドアロンApps Scriptで使う場合のみ設定。スプレッドシート紐づけなら不要 |

> セキュリティ上、OpenAI APIキーやWebhookトークンはコードに直書きしないでください。

### 3. Google Tasks高度なサービスを有効化する

実際にGoogle Tasksへ同期する場合に必要です。`dry_run=true` の間は必須ではありません。

1. Apps Scriptエディタ左側の **サービス** を開く
2. **サービスを追加** をクリック
3. **Tasks API** を選ぶ
4. 識別子が `Tasks` になっていることを確認
5. 追加する
6. 初回実行時の権限承認でTasksへのアクセスを許可する

必要に応じてGoogle Cloud側でも **Google Tasks API** を有効化してください。

## 初期セットアップ手順

1. Apps Scriptエディタで関数 `setup` を選ぶ
2. **実行** を押す
3. 初回の権限承認を完了する
4. スプレッドシートに以下のシートができたことを確認する
   - `RawInbox`
   - `Items`
   - `Rules`
   - `Templates`
   - `Settings`
   - `DailyPlans`
   - `Logs`
5. `Settings` の `dry_run` が `true` であることを確認する

## Webアプリとしてデプロイする

1. Apps Scriptエディタ右上の **デプロイ → 新しいデプロイ** を開く
2. 種類で **ウェブアプリ** を選ぶ
3. 次の設定にする
   - 実行ユーザー: 自分
   - アクセスできるユーザー: 自分、またはリンクを知っている全員（運用方針に合わせる）
4. デプロイする
5. 表示された **ウェブアプリURL** をコピーする
6. iPhoneショートカットのPOST先URLに使う

## iPhoneショートカット「家庭メモ送信」設定手順

ショートカット名: `家庭メモ送信`

1. **テキストを音声入力**
   - プロンプト例: `家庭メモを話してください`
   - 結果を `音声入力テキスト` として扱う
2. **現在の日付を取得**
3. **辞書を作成**
   - `raw_text`: 音声入力テキスト
   - `source`: `iphone_shortcut`
   - `timestamp`: 現在の日付
   - `token`: Script Propertiesの `WEBHOOK_TOKEN` と同じ値
4. **URLの内容を取得**
   - URL: Apps ScriptのWebアプリURL
   - 方法: `POST`
   - リクエスト本文: `JSON`
   - 本文: 上で作った辞書
5. **通知を表示**
   - 成功時: `家庭メモを送信しました`

送信されるJSON例:

```json
{
  "raw_text": "今日9時から11時ヘルパー。ゴミ袋購入。",
  "source": "iphone_shortcut",
  "timestamp": "2026-06-01T08:00:00+09:00",
  "token": "任意の共有シークレット"
}
```

## OpenAI分類仕様

`callOpenAIForClassification(rawText, timestamp)` は、`Settings.openai_model` のモデル名を読みます。未設定時のデフォルトは `gpt-4.1-mini` です。

AIには厳密なJSONだけを返すように指示しています。期待する形式は次の通りです。

```json
{
  "items": [
    {
      "type": "event | task | shopping | prep | review",
      "title": "string",
      "date": "YYYY-MM-DD or null",
      "start_time": "HH:mm or null",
      "end_time": "HH:mm or null",
      "target": "パパ | ママ | 娘 | モカ | 家 | 家族 | 不明",
      "category": "string",
      "location": "string or null",
      "status": "todo | confirmed | review | done",
      "confidence": 0.0,
      "calendar_action": "create | none | review",
      "task_action": "create | none | review",
      "notes": "string"
    }
  ],
  "warnings": ["string"],
  "assumptions": ["string"]
}
```

JSON.parseに失敗した場合は `Logs` に記録し、`review` アイテムとして保存します。

## 重複判定

`Items.dedupe_key` は次で作ります。

```text
type + title + date + start_time + target
```

同じ `dedupe_key` が既にある場合、新規行は作らず、既存行の `notes` に重複メモを追記します。

## Calendar同期

`syncToCalendar()` は以下を満たすものだけ同期します。

- `type=event`
- `calendar_action=create`
- `confidence >= Settings.auto_register_threshold`
- `calendar_event_id` が空

`Settings.dry_run=true` の場合はGoogleカレンダーへ実登録せず、`Items.notes` に `DRY_RUN: calendar create予定` と追記します。

実登録する場合は、イベント説明欄に以下を入れます。

- 元メモ
- 準備
- 注意事項
- ヘルパー、訪問看護、荷物受取の外出禁止・前後余白

## Google Tasks同期

`syncToTasks()` は以下を満たすものだけ同期します。

- `type=task/shopping/prep`
- `task_action=create`
- `confidence >= Settings.auto_register_threshold`
- `task_id` が空

リストの振り分けは次の通りです。

| 条件 | Tasksリスト |
| --- | --- |
| 買い物 | `買い物` |
| 娘・園関連 | `園・子供` |
| モカ関連 | `モカ` |
| 家の改善 | `家の改善` |
| その他 | `今日やる` |

該当リストがなければ自動作成します。

## 準備タスク自動生成

`generatePrepTasks()` はイベントから次のような準備タスクを作ります。

### プール開き

例: `2026-06-09 プール開き`

- `2026-06-07 プール用品チェック`
- `2026-06-08 20:00 プールバッグ準備`
- `2026-06-09 07:30 プール用品を持つ`

### 訪問看護

例: `2026-06-01 14:00-14:30 訪問看護さん`

- `2026-06-01 13:45 訪問看護前メモ準備`
- `2026-06-01 14:30 訪問看護後の内容メモ`

### 荷物受取

例: `2026-06-01 16:00-18:00 荷物受取`

- `2026-06-01 15:45 荷物受取のため在宅確認`

## DailyPlan生成

`generateDailyPlan(date)` は、指定日のイベント、未完了タスク、買い物、準備、確認待ちを読み、`DailyPlans` に以下を保存します。

1. 今日の固定予定
2. 今日やること
3. 買い物
4. 持ち物・準備
5. 外出禁止時間
6. 今日やらなくていいもの
7. 注意点
8. 最初にやる3つ
9. 時間割

`date` を省略すると、実行時の日付を `Asia/Tokyo` で使います。

## テスト手順

### 最短テスト

1. Apps Scriptで `setup()` を実行
2. `Settings.dry_run` が `true` であることを確認
3. `testWithSampleData()` を実行
4. `RawInbox` にサンプルメモが入ることを確認
5. `Items` に予定・タスク・買い物・準備が入ることを確認
6. `Items.notes` に `DRY_RUN: calendar create予定` / `DRY_RUN: task create予定` が追記されることを確認
7. `DailyPlans` に今日の予定表が入ることを確認
8. `Logs` にエラーがないことを確認

### サンプル入力

```text
今日、9時から11時ヘルパー。
14時から14時半訪問看護。
16時から18時に受取必要な荷物が届く。
モカの狂犬病とワクチン確認。
ゴミ袋購入。
冬用の服を2軍、上に置く。
6月以降カレンダー印刷。
知育プリント印刷。
6月3日子育て広場。
6月4日身体測定。
6月5日避難訓練と歯科検診。
6月9日火曜プール開き。巻き巻きタオルと帽子確認。
卓上かダイニング側の時計固定。
リビング側時計固定。
```

期待するCalendar候補:

- 今日 09:00-11:00 ヘルパーさん
- 今日 14:00-14:30 訪問看護さん
- 今日 16:00-18:00 荷物受取
- 2026-06-03 終日 子育て広場
- 2026-06-04 終日 身体測定
- 2026-06-05 終日 避難訓練／歯科検診
- 2026-06-09 終日 プール開き

期待するTasks候補:

- モカの動物病院に電話して狂犬病とワクチンの予定確認
- ゴミ袋購入
- 冬用の服を2軍へ移動し、上に置く
- 6月以降カレンダー印刷
- 知育プリント印刷
- 荷物受取のため15:45に在宅確認
- プール用品チェック
- 巻き巻きタオル確認
- 帽子確認
- 時計固定用品確認
- リビング側時計固定場所を決める
- ダイニング側時計固定場所を決める

## dry_run解除手順

十分に確認してから実登録に切り替えます。

1. `Items` の分類結果、日付、時間、confidenceを確認
2. `Settings.auto_register_threshold` が `0.85` 以上であることを確認
3. Google Tasks高度なサービス `Tasks` を有効化
4. Calendar権限、Tasks権限を承認
5. `Settings.dry_run` を `false` に変更
6. `syncToCalendar()` を実行
7. `syncToTasks()` を実行
8. `Items.calendar_event_id` と `Items.task_id` が入ったことを確認

## 運用のおすすめ

- WebアプリPOST後すぐ完全自動同期せず、まず `processInbox()` を時間主導トリガーで5〜15分おきに実行する
- `confidence < 0.85` は `review` にして、人が確認してから登録する
- ヘルパー、訪問看護、荷物受取の時間帯には外出タスクを入れない
- 朝に `generateDailyPlan()` を実行する時間主導トリガーを作る

## トラブルシューティング

### iPhoneショートカットから送れない

- WebアプリURLが最新デプロイのURLか確認
- `WEBHOOK_TOKEN` とショートカットの `token` が一致しているか確認
- POST本文がJSONになっているか確認
- `RawInbox` に行が増えているか確認
- `Logs` の `doPost` 警告を確認

### OpenAI分類されない

- Script Propertiesの `OPENAI_API_KEY` を確認
- `Settings.openai_model` を確認
- `Logs` の `callOpenAIForClassification` を確認
- JSON.parse失敗時は `review` アイテムとして `Items` に保存されます

### Calendarに登録されない

- `Settings.dry_run` が `false` か確認
- `confidence >= auto_register_threshold` か確認
- `calendar_action=create` か確認
- `calendar_event_id` が既に入っていないか確認
- `default_calendar_id` が正しいか確認

### Tasksに登録されない

- `Settings.dry_run` が `false` か確認
- Google Tasks高度なサービス `Tasks` が追加済みか確認
- Google Cloud側のTasks APIが有効か確認
- `task_action=create` か確認
- `task_id` が既に入っていないか確認

### 重複しているように見える

- `Items.dedupe_key` を確認
- 同じ `type + title + date + start_time + target` は新規作成されず、既存行の `notes` に追記されます
- タイトル表記が微妙に違う場合は別件として扱われるため、必要ならタイトルを統一してください
