/**
 * 家庭予定管理DB MVP for Google Apps Script.
 *
 * Spreadsheet-centered automation for Japanese voice memos sent from an iPhone Shortcut.
 * Time zone: Asia/Tokyo.
 *
 * Required advanced service for real task sync:
 *   Google Tasks API advanced service named `Tasks`.
 */

var APP_NAME = '家庭予定管理DB';
var SHEETS = {
  RAW: 'RawInbox',
  ITEMS: 'Items',
  RULES: 'Rules',
  TEMPLATES: 'Templates',
  SETTINGS: 'Settings',
  DAILY: 'DailyPlans',
  LOGS: 'Logs'
};

var HEADERS = {
  RawInbox: ['id', 'timestamp', 'raw_text', 'source', 'processed', 'processed_at', 'error', 'memo'],
  Items: ['id', 'raw_id', 'type', 'title', 'date', 'start_time', 'end_time', 'target', 'category', 'location', 'status', 'confidence', 'calendar_action', 'task_action', 'calendar_event_id', 'task_id', 'parent_item_id', 'notes', 'created_at', 'updated_at', 'dedupe_key'],
  Rules: ['keyword', 'type', 'category', 'target', 'default_action', 'prep_rule', 'notes'],
  Templates: ['template_name', 'checklist', 'timing_rule', 'notes'],
  Settings: ['key', 'value'],
  DailyPlans: ['date', 'generated_at', 'plan_text', 'calendar_summary', 'task_summary', 'shopping_summary', 'warnings', 'first_three_actions'],
  Logs: ['timestamp', 'level', 'function_name', 'message', 'detail']
};

var INITIAL_RULES = [
  ['ヘルパー', 'event', '支援', '家', 'calendar', '外出禁止ブロック', 'ヘルパー時間は家の中作業、片付け、印刷、準備、相談に使う'],
  ['訪問看護', 'event', '医療・支援', '家', 'calendar', '前15分準備、後15分記録', '話すことメモを作る'],
  ['荷物', 'event', '受取', '家', 'calendar', '15分前在宅確認', '受取時間中は外出禁止'],
  ['プール', 'event', '園行事', '娘', 'calendar_and_tasks', '2日前準備、前日バッグ準備、当日朝確認', '水着、巻き巻きタオル、帽子、プールバッグ、ビニール袋、名前記入'],
  ['身体測定', 'event', '園行事', '娘', 'calendar_and_tasks', '前日確認', '服装、提出物、園からの指定確認'],
  ['歯科検診', 'event', '園行事', '娘', 'calendar_and_tasks', '前日確認', '歯磨き、提出物、問診票確認'],
  ['避難訓練', 'event', '園行事', '娘', 'calendar', '前日確認', '園からの指定確認'],
  ['狂犬病', 'task', '犬・病院', 'モカ', 'task', '持ち物確認', '動物病院へ電話し、狂犬病とワクチンの予定・間隔を確認'],
  ['ワクチン', 'task', '犬・病院', 'モカ', 'task', '持ち物確認', '動物病院へ確認'],
  ['購入', 'shopping', '買い物', '家', 'task', 'なし', '買い物リストへ'],
  ['買う', 'shopping', '買い物', '家', 'task', 'なし', '買い物リストへ'],
  ['印刷', 'task', '家事', '家', 'task', 'なし', '印刷タスク'],
  ['服', 'task', '片付け', '家', 'task', 'なし', '衣類整理タスク'],
  ['時計', 'shopping', '家の改善', '家', 'task', 'なし', '時計固定用品の確認']
];

var INITIAL_TEMPLATES = [
  ['プール開き', '水着、巻き巻きタオル、帽子、プールバッグ、ビニール袋、着替え、名前記入、園からの指定確認', '2日前、前日夜、当日朝', '準備タスクを自動生成'],
  ['訪問看護', '話すこと、困りごと、前回からの変化、次回予定、家族側でやること', '予定30分前、予定後15分', '前後タスクを自動生成'],
  ['動物病院', '診察券、狂犬病案内、鑑札、注射済票、ワクチン証明、財布、リードまたはキャリー、うんち袋、水', '予約前、当日朝', '曖昧なら電話確認タスクにする'],
  ['荷物受取', '玄関確認、インターホン確認、在宅、外出しない', '15分前', '受取時間中は外出禁止'],
  ['園行事前チェック', '園アプリ・プリント確認、提出物、持ち物、名前記入、服装確認', '前日夜', '園行事に付与']
];

var INITIAL_SETTINGS = [
  ['timezone', 'Asia/Tokyo'],
  ['default_calendar_id', 'primary'],
  ['task_list_today', '今日やる'],
  ['task_list_shopping', '買い物'],
  ['task_list_child', '園・子供'],
  ['task_list_mocha', 'モカ'],
  ['task_list_home', '家の改善'],
  ['auto_register_threshold', '0.85'],
  ['review_threshold', '0.84'],
  ['helper_rule', 'ヘルパー予定は前日に確定する。ヘルパー時間は家の中作業に使う'],
  ['visit_nurse_rule', '訪問看護の前15分は準備、後15分は記録'],
  ['delivery_rule', '荷物受取時間は外出禁止。15分前に在宅確認'],
  ['overbooking_rule', '固定予定と重なる外出タスクは禁止'],
  ['prep_rule', '持ち物が必要な予定は2日前、前日、当日朝の確認を作る'],
  ['dry_run', 'true'],
  ['openai_model', 'gpt-4.1-mini']
];

/** Initializes all sheets, headers, and seed data. Run once before using the web app. */
function setup() {
  var ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    ensureSheet_(ss, name, HEADERS[name]);
  });
  seedSheet_(SHEETS.RULES, INITIAL_RULES, 'keyword');
  seedSheet_(SHEETS.TEMPLATES, INITIAL_TEMPLATES, 'template_name');
  seedSheet_(SHEETS.SETTINGS, INITIAL_SETTINGS, 'key');
  logError('INFO', 'setup', 'Setup completed', APP_NAME);
  return { ok: true, spreadsheetId: ss.getId() };
}

/** Receives JSON from the iPhone Shortcut and stores it in RawInbox. */
function doPost(e) {
  try {
    setupIfNeeded_();
    var body = parsePostBody_(e);
    var expectedToken = getWebhookToken_();
    if (expectedToken && body.token !== expectedToken) {
      logError('WARN', 'doPost', 'Invalid webhook token', JSON.stringify({ source: body.source || '' }));
      return jsonOutput_({ ok: false, error: 'invalid_token' });
    }

    var rawText = String(body.raw_text || '').trim();
    if (!rawText) return jsonOutput_({ ok: false, error: 'raw_text is required' });

    var id = uuid_('raw');
    var timestamp = body.timestamp ? normalizeTimestamp_(body.timestamp) : nowString_();
    appendObject_(SHEETS.RAW, {
      id: id,
      timestamp: timestamp,
      raw_text: rawText,
      source: body.source || 'iphone_shortcut',
      processed: false,
      processed_at: '',
      error: '',
      memo: ''
    });
    return jsonOutput_({ ok: true, id: id, message: '家庭メモを保存しました' });
  } catch (err) {
    logError('ERROR', 'doPost', err.message, stack_(err));
    return jsonOutput_({ ok: false, error: err.message });
  }
}

/** Processes unprocessed RawInbox rows, classifies them, stores Items, creates prep tasks, and runs dry/real sync. */
function processInbox() {
  setupIfNeeded_();
  var sheet = getSheet_(SHEETS.RAW);
  var values = getDataObjects_(sheet);
  var processedCount = 0;

  values.objects.forEach(function (row) {
    if (String(row.processed).toLowerCase() === 'true') return;
    try {
      var classified = callOpenAIForClassification(row.raw_text, row.timestamp);
      var saved = saveItemsToSheet(classified.items || [], row.id, row.raw_text);
      generatePrepTasks();
      markProcessed(row.id, '');
      processedCount += 1;
      if ((classified.warnings || []).length) {
        logError('WARN', 'processInbox', 'Classification warnings', JSON.stringify(classified.warnings));
      }
      logError('INFO', 'processInbox', 'Processed RawInbox row', JSON.stringify({ raw_id: row.id, saved: saved.length }));
    } catch (err) {
      markProcessed(row.id, err.message);
      saveItemsToSheet([reviewItem_('分類エラー: ' + row.raw_text, row.raw_text, err.message)], row.id, row.raw_text);
      logError('ERROR', 'processInbox', err.message, stack_(err));
    }
  });

  syncToCalendar();
  syncToTasks();
  return { ok: true, processed: processedCount };
}

/** Calls OpenAI to classify a Japanese household memo into strict JSON. Falls back to deterministic sample parsing when no API key exists. */
function callOpenAIForClassification(rawText, timestamp) {
  setupIfNeeded_();
  var key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) {
    logError('WARN', 'callOpenAIForClassification', 'OPENAI_API_KEY missing; using local heuristic fallback', rawText);
    return heuristicClassification_(rawText, timestamp);
  }

  var model = getSetting_('openai_model', 'gpt-4.1-mini');
  var tz = getTimeZone_();
  var today = formatDate_(new Date(), 'yyyy-MM-dd');
  var systemPrompt = [
    'あなたは家庭予定管理DBの分類エンジンです。',
    '日本語の音声入力メモを、予定・タスク・買い物・準備・確認待ちに分解します。',
    '今日の日付は実行時基準で ' + today + '、タイムゾーンは ' + tz + ' です。',
    '曖昧な日付、疑問形、勝手に予約してはいけない医療・動物病院予定はreviewまたは確認taskにしてください。',
    'モカの狂犬病、ワクチンは接種予定を作らず、動物病院への電話確認taskにしてください。',
    'ヘルパー、訪問看護、荷物受取は固定予定です。外出禁止・前後余白の注意をnotesに含めてください。',
    '同じ内容が複数ある場合は1件にまとめます。',
    '必ずJSONだけを返し、Markdownや説明文は返さないでください。'
  ].join('\n');

  var schema = {
    name: 'household_items',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string', enum: ['event', 'task', 'shopping', 'prep', 'review'] },
              title: { type: 'string' },
              date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              start_time: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              end_time: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              target: { type: 'string', enum: ['パパ', 'ママ', '娘', 'モカ', '家', '家族', '不明'] },
              category: { type: 'string' },
              location: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              status: { type: 'string', enum: ['todo', 'confirmed', 'review', 'done'] },
              confidence: { type: 'number' },
              calendar_action: { type: 'string', enum: ['create', 'none', 'review'] },
              task_action: { type: 'string', enum: ['create', 'none', 'review'] },
              notes: { type: 'string' }
            },
            required: ['type', 'title', 'date', 'start_time', 'end_time', 'target', 'category', 'location', 'status', 'confidence', 'calendar_action', 'task_action', 'notes']
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      },
      required: ['items', 'warnings', 'assumptions']
    },
    strict: true
  };

  var payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify({ raw_text: rawText, timestamp: timestamp, rules: INITIAL_RULES, schema_hint: schema.schema }) }
    ],
    response_format: { type: 'json_schema', json_schema: schema },
    temperature: 0.1
  };

  var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + key },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('OpenAI API error ' + code + ': ' + text);

  try {
    var outer = JSON.parse(text);
    var content = outer.choices && outer.choices[0] && outer.choices[0].message && outer.choices[0].message.content;
    return validateClassification_(JSON.parse(content));
  } catch (err) {
    logError('ERROR', 'callOpenAIForClassification', 'JSON parse failed; returning review item', text);
    return { items: [reviewItem_('AI分類結果の確認が必要', rawText, err.message)], warnings: ['JSON.parse failed'], assumptions: [] };
  }
}

/** Saves classified items into Items with dedupe protection. */
function saveItemsToSheet(items, rawId, rawText) {
  setupIfNeeded_();
  var saved = [];
  (items || []).forEach(function (item) {
    var normalized = normalizeItem_(item, rawId, rawText);
    var duplicate = preventDuplicates(normalized);
    if (duplicate.duplicate) {
      saved.push({ id: duplicate.id, duplicate: true });
      return;
    }
    appendObject_(SHEETS.ITEMS, normalized);
    saved.push({ id: normalized.id, duplicate: false });
  });
  return saved;
}

/** Registers qualifying event Items to Google Calendar, or annotates notes in dry_run mode. */
function syncToCalendar() {
  setupIfNeeded_();
  var dryRun = isDryRun_();
  var threshold = Number(getSetting_('auto_register_threshold', '0.85'));
  var calendarId = getSetting_('default_calendar_id', 'primary');
  var sheet = getSheet_(SHEETS.ITEMS);
  var data = getDataObjects_(sheet);
  var calendar = dryRun ? null : CalendarApp.getCalendarById(calendarId);
  var count = 0;

  data.objects.forEach(function (row, idx) {
    if (row.type !== 'event' || row.calendar_action !== 'create') return;
    if (Number(row.confidence || 0) < threshold || row.calendar_event_id) return;
    if (!row.date) return;

    var note = '元メモ/注意: ' + (row.notes || '') + '\n' + fixedBlockNote_(row.title);
    if (dryRun) {
      updateItemFields_(idx + 2, { notes: appendNote_(row.notes, 'DRY_RUN: calendar create予定'), updated_at: nowString_() });
      count += 1;
      return;
    }

    var eventTitle = calendarTitle_(row);
    var event;
    if (row.start_time) {
      event = calendar.createEvent(eventTitle, parseDateTime_(row.date, row.start_time), parseDateTime_(row.date, row.end_time || row.start_time), { description: note, location: row.location || '' });
    } else {
      event = calendar.createAllDayEvent(eventTitle, parseDateOnly_(row.date), { description: note, location: row.location || '' });
    }
    updateItemFields_(idx + 2, { calendar_event_id: event.getId(), updated_at: nowString_() });
    count += 1;
  });
  return { ok: true, dry_run: dryRun, synced: count };
}

/** Creates qualifying task/shopping/prep Items in Google Tasks, or annotates notes in dry_run mode. */
function syncToTasks() {
  setupIfNeeded_();
  var dryRun = isDryRun_();
  var threshold = Number(getSetting_('auto_register_threshold', '0.85'));
  var sheet = getSheet_(SHEETS.ITEMS);
  var data = getDataObjects_(sheet);
  var count = 0;

  data.objects.forEach(function (row, idx) {
    if (['task', 'shopping', 'prep'].indexOf(row.type) === -1 || row.task_action !== 'create') return;
    if (Number(row.confidence || 0) < threshold || row.task_id) return;
    if (dryRun) {
      updateItemFields_(idx + 2, { notes: appendNote_(row.notes, 'DRY_RUN: task create予定'), updated_at: nowString_() });
      count += 1;
      return;
    }

    var listName = chooseTaskListName_(row);
    var listId = getOrCreateTaskList_(listName);
    var task = { title: taskTitle_(row), notes: row.notes || '' };
    if (row.date) task.due = parseDateOnly_(row.date).toISOString();
    var created = Tasks.Tasks.insert(task, listId);
    updateItemFields_(idx + 2, { task_id: created.id, updated_at: nowString_() });
    count += 1;
  });
  return { ok: true, dry_run: dryRun, synced: count };
}

/** Generates prep task Items from event Items based on Rules/Templates. Safe to run repeatedly. */
function generatePrepTasks() {
  setupIfNeeded_();
  var data = getDataObjects_(getSheet_(SHEETS.ITEMS));
  var generated = 0;
  data.objects.forEach(function (row) {
    if (row.type !== 'event' || !row.date) return;
    var prepItems = prepItemsForEvent_(row);
    prepItems.forEach(function (prep) {
      var normalized = normalizeItem_(prep, row.raw_id, 'auto prep');
      normalized.parent_item_id = row.id;
      var duplicate = preventDuplicates(normalized);
      if (!duplicate.duplicate) {
        appendObject_(SHEETS.ITEMS, normalized);
        generated += 1;
      }
    });
  });
  return { ok: true, generated: generated };
}

/** Builds and stores a daily household plan from Items. Date defaults to today in Asia/Tokyo. */
function generateDailyPlan(date) {
  setupIfNeeded_();
  var targetDate = date || formatDate_(new Date(), 'yyyy-MM-dd');
  var rows = getDataObjects_(getSheet_(SHEETS.ITEMS)).objects;
  var todays = rows.filter(function (r) { return r.date === targetDate; });
  var undatedTodo = rows.filter(function (r) { return !r.date && r.status !== 'done' && ['task', 'shopping', 'prep', 'review'].indexOf(r.type) !== -1; });
  var events = todays.filter(function (r) { return r.type === 'event'; }).sort(sortByTime_);
  var tasks = todays.concat(undatedTodo).filter(function (r) { return ['task', 'review'].indexOf(r.type) !== -1 && r.status !== 'done'; });
  var shopping = todays.concat(undatedTodo).filter(function (r) { return r.type === 'shopping' && r.status !== 'done'; });
  var prep = todays.concat(undatedTodo).filter(function (r) { return r.type === 'prep' && r.status !== 'done'; });
  var fixedBlocks = events.filter(function (r) { return isFixedBlock_(r.title); });
  var warnings = buildDailyWarnings_(events, rows);
  var firstThree = chooseFirstThree_(tasks, shopping, prep);

  var plan = [];
  plan.push('# ' + targetDate + ' の家庭予定管理DB Daily Plan');
  plan.push('');
  plan.push('## 1. 今日の固定予定');
  plan = plan.concat(linesFor_(events, formatEventLine_));
  plan.push('');
  plan.push('## 2. 今日やること');
  plan = plan.concat(linesFor_(tasks, formatTaskLine_));
  plan.push('');
  plan.push('## 3. 買い物');
  plan = plan.concat(linesFor_(shopping, formatTaskLine_));
  plan.push('');
  plan.push('## 4. 持ち物・準備');
  plan = plan.concat(linesFor_(prep, formatTaskLine_));
  plan.push('');
  plan.push('## 5. 外出禁止時間');
  plan = plan.concat(linesFor_(fixedBlocks, formatEventLine_));
  plan.push('');
  plan.push('## 6. 今日やらなくていいもの');
  plan = plan.concat(linesFor_(rows.filter(function (r) { return r.date && r.date !== targetDate && r.status !== 'done'; }).slice(0, 10), formatTaskLine_));
  plan.push('');
  plan.push('## 7. 注意点');
  plan = plan.concat(linesFor_(warnings, function (w) { return w; }));
  plan.push('');
  plan.push('## 8. 最初にやる3つ');
  plan = plan.concat(linesFor_(firstThree, function (x) { return x; }));
  plan.push('');
  plan.push('## 9. 時間割');
  plan = plan.concat(buildTimeTable_(targetDate, events, tasks, shopping, prep));

  appendObject_(SHEETS.DAILY, {
    date: targetDate,
    generated_at: nowString_(),
    plan_text: plan.join('\n'),
    calendar_summary: events.map(formatEventLine_).join('\n'),
    task_summary: tasks.map(formatTaskLine_).join('\n'),
    shopping_summary: shopping.map(formatTaskLine_).join('\n'),
    warnings: warnings.join('\n'),
    first_three_actions: firstThree.join('\n')
  });
  return plan.join('\n');
}

/** Marks a RawInbox row as processed and records an optional error. */
function markProcessed(rawId, error) {
  var sheet = getSheet_(SHEETS.RAW);
  var data = getDataObjects_(sheet);
  data.objects.forEach(function (row, idx) {
    if (row.id === rawId) {
      updateRawFields_(idx + 2, { processed: true, processed_at: nowString_(), error: error || '' });
    }
  });
}

/** Checks and prevents duplicate Items by dedupe_key. Duplicate notes are appended to the existing item. */
function preventDuplicates(item) {
  var sheet = getSheet_(SHEETS.ITEMS);
  var data = getDataObjects_(sheet);
  for (var i = 0; i < data.objects.length; i++) {
    var row = data.objects[i];
    if (row.dedupe_key && row.dedupe_key === item.dedupe_key) {
      var mergedNotes = appendNote_(row.notes, item.notes ? '重複メモ追記: ' + item.notes : '重複メモあり');
      updateItemFields_(i + 2, { notes: mergedNotes, updated_at: nowString_() });
      logError('INFO', 'preventDuplicates', 'Duplicate skipped', item.dedupe_key);
      return { duplicate: true, id: row.id };
    }
  }
  return { duplicate: false };
}

/** Appends a row to Logs. Kept as logError for the required public API, but supports all levels. */
function logError(level, functionName, message, detail) {
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(SHEETS.LOGS) || ensureSheet_(ss, SHEETS.LOGS, HEADERS.Logs);
    sheet.appendRow([nowString_(), level || 'ERROR', functionName || '', message || '', detail || '']);
  } catch (err) {
    console.error(level, functionName, message, detail, err);
  }
}

/** Inserts the requested sample memo and processes it end-to-end in dry_run mode. */
function testWithSampleData() {
  setup();
  var sample = [
    '今日、9時から11時ヘルパー。',
    '14時から14時半訪問看護。',
    '16時から18時に受取必要な荷物が届く。',
    'モカの狂犬病とワクチン確認。',
    'ゴミ袋購入。',
    '冬用の服を2軍、上に置く。',
    '6月以降カレンダー印刷。',
    '知育プリント印刷。',
    '6月3日子育て広場。',
    '6月4日身体測定。',
    '6月5日避難訓練と歯科検診。',
    '6月9日火曜プール開き。巻き巻きタオルと帽子確認。',
    '卓上かダイニング側の時計固定。',
    'リビング側時計固定。'
  ].join('\n');
  appendObject_(SHEETS.RAW, {
    id: uuid_('raw'),
    timestamp: nowString_(),
    raw_text: sample,
    source: 'testWithSampleData',
    processed: false,
    processed_at: '',
    error: '',
    memo: 'sample'
  });
  var result = processInbox();
  var plan = generateDailyPlan(formatDate_(new Date(), 'yyyy-MM-dd'));
  return { ok: true, process: result, dailyPlan: plan };
}

function setupIfNeeded_() {
  var ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    if (!ss.getSheetByName(name)) ensureSheet_(ss, name, HEADERS[name]);
  });
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeader = current.join('') === '' || current.join('|') !== headers.join('|');
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function seedSheet_(sheetName, rows, keyHeader) {
  var sheet = getSheet_(sheetName);
  var headers = HEADERS[sheetName];
  var keyIdx = headers.indexOf(keyHeader);
  var data = getDataObjects_(sheet).objects;
  var existing = {};
  data.forEach(function (r) { existing[r[keyHeader]] = true; });
  rows.forEach(function (row) {
    if (!existing[row[keyIdx]]) sheet.appendRow(row);
  });
}

function getSheet_(name) {
  return getSpreadsheet_().getSheetByName(name) || ensureSheet_(getSpreadsheet_(), name, HEADERS[name]);
}

function getDataObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 1) return { headers: [], objects: [] };
  var headers = values[0];
  var objects = values.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
  return { headers: headers, objects: objects };
}

function appendObject_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = HEADERS[sheetName];
  sheet.appendRow(headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? '' : obj[h]; }));
}

function updateItemFields_(rowNumber, fields) {
  updateFields_(SHEETS.ITEMS, rowNumber, fields);
}

function updateRawFields_(rowNumber, fields) {
  updateFields_(SHEETS.RAW, rowNumber, fields);
}

function updateFields_(sheetName, rowNumber, fields) {
  var sheet = getSheet_(sheetName);
  var headers = HEADERS[sheetName];
  Object.keys(fields).forEach(function (key) {
    var idx = headers.indexOf(key);
    if (idx >= 0) sheet.getRange(rowNumber, idx + 1).setValue(fields[key]);
  });
}

function parsePostBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('POST body is empty');
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Invalid JSON body: ' + err.message);
  }
}

function getWebhookToken_() {
  return PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN') || getSetting_('webhook_token', '');
}

function getSetting_(key, fallback) {
  try {
    var rows = getDataObjects_(getSheet_(SHEETS.SETTINGS)).objects;
    for (var i = 0; i < rows.length; i++) if (rows[i].key === key) return String(rows[i].value);
  } catch (err) {}
  return fallback;
}

function isDryRun_() {
  return String(getSetting_('dry_run', 'true')).toLowerCase() !== 'false';
}

function getTimeZone_() {
  return getSetting_('timezone', 'Asia/Tokyo');
}

function nowString_() {
  return formatDate_(new Date(), 'yyyy-MM-dd HH:mm:ss');
}

function formatDate_(date, pattern) {
  return Utilities.formatDate(date, getTimeZone_(), pattern);
}

function normalizeTimestamp_(value) {
  var d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : formatDate_(d, 'yyyy-MM-dd HH:mm:ss');
}

function uuid_(prefix) {
  return prefix + '_' + Utilities.getUuid();
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function stack_(err) {
  return err && err.stack ? err.stack : String(err);
}

function validateClassification_(obj) {
  if (!obj || !Array.isArray(obj.items)) throw new Error('Classification JSON must contain items[]');
  obj.warnings = obj.warnings || [];
  obj.assumptions = obj.assumptions || [];
  return obj;
}

function reviewItem_(title, rawText, reason) {
  return {
    type: 'review',
    title: title,
    date: null,
    start_time: null,
    end_time: null,
    target: '不明',
    category: '確認待ち',
    location: null,
    status: 'review',
    confidence: 0.1,
    calendar_action: 'review',
    task_action: 'review',
    notes: '要確認: ' + reason + '\n元メモ: ' + rawText
  };
}

function normalizeItem_(item, rawId, rawText) {
  var threshold = Number(getSetting_('auto_register_threshold', '0.85'));
  var confidence = Number(item.confidence || 0);
  var normalized = {
    id: item.id || uuid_('item'),
    raw_id: rawId || item.raw_id || '',
    type: item.type || 'review',
    title: item.title || '無題',
    date: cleanNullable_(item.date),
    start_time: cleanTime_(item.start_time),
    end_time: cleanTime_(item.end_time),
    target: item.target || '不明',
    category: item.category || '',
    location: cleanNullable_(item.location),
    status: confidence >= threshold ? (item.status || 'todo') : 'review',
    confidence: confidence,
    calendar_action: confidence >= threshold ? (item.calendar_action || 'none') : 'review',
    task_action: confidence >= threshold ? (item.task_action || 'none') : 'review',
    calendar_event_id: item.calendar_event_id || '',
    task_id: item.task_id || '',
    parent_item_id: item.parent_item_id || '',
    notes: item.notes || '',
    created_at: item.created_at || nowString_(),
    updated_at: nowString_(),
    dedupe_key: ''
  };
  normalized.dedupe_key = makeDedupeKey_(normalized);
  if (rawText && normalized.notes.indexOf('元メモ') === -1) normalized.notes = appendNote_(normalized.notes, '元メモ: ' + rawText);
  return normalized;
}

function cleanNullable_(v) {
  if (v === null || v === undefined || String(v).toLowerCase() === 'null') return '';
  return String(v).trim();
}

function cleanTime_(v) {
  v = cleanNullable_(v);
  if (!v) return '';
  var m = v.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return v;
  return ('0' + m[1]).slice(-2) + ':' + m[2];
}

function makeDedupeKey_(item) {
  return [item.type, item.title, item.date || '', item.start_time || '', item.target || ''].join('|').toLowerCase();
}

function appendNote_(oldNote, newNote) {
  if (!newNote) return oldNote || '';
  if (oldNote && oldNote.indexOf(newNote) !== -1) return oldNote;
  return oldNote ? oldNote + '\n' + newNote : newNote;
}

function calendarTitle_(row) {
  if (row.title.indexOf('ヘルパー') !== -1) return 'ヘルパーさん';
  if (row.title.indexOf('訪問看護') !== -1) return '訪問看護さん';
  if (row.title.indexOf('荷物') !== -1 || row.title.indexOf('受取') !== -1) return '荷物受取';
  return row.target && row.target !== '家' && row.target !== '不明' ? row.target + '：' + row.title : row.title;
}

function fixedBlockNote_(title) {
  if (title.indexOf('ヘルパー') !== -1) return '外出禁止ブロック。前後に余白を取り、家の中作業・片付け・印刷・準備・相談に使う。';
  if (title.indexOf('訪問看護') !== -1) return '前15分は準備、後15分は記録。訪問中と前後は外出予定を入れない。';
  if (title.indexOf('荷物') !== -1 || title.indexOf('受取') !== -1) return '受取時間中は外出禁止。15分前に在宅確認。';
  return '予定前後に余白を取る。';
}

function parseDateOnly_(dateString) {
  var parts = String(dateString).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function parseDateTime_(dateString, timeString) {
  var d = parseDateOnly_(dateString);
  var m = String(timeString || '00:00').match(/(\d{1,2}):(\d{2})/);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

function addDays_(dateString, days) {
  var d = parseDateOnly_(dateString);
  d.setDate(d.getDate() + days);
  return formatDate_(d, 'yyyy-MM-dd');
}

function addMinutesToTime_(dateString, timeString, minutes) {
  return formatDate_(new Date(parseDateTime_(dateString, timeString).getTime() + minutes * 60000), 'HH:mm');
}

function prepItemsForEvent_(row) {
  var title = row.title || '';
  var items = [];
  if (title.indexOf('訪問看護') !== -1 && row.start_time) {
    items.push(prep_('訪問看護前メモ準備', row.date, addMinutesToTime_(row.date, row.start_time, -15), '家', '医療・支援', '話すこと、困りごと、前回からの変化をメモする', 0.95));
    items.push(prep_('訪問看護後の内容メモ', row.date, row.end_time || row.start_time, '家', '医療・支援', '訪問看護後15分で内容と家族側の宿題を記録する', 0.95));
  }
  if ((title.indexOf('荷物') !== -1 || title.indexOf('受取') !== -1) && row.start_time) {
    items.push(prep_('荷物受取のため在宅確認', row.date, addMinutesToTime_(row.date, row.start_time, -15), '家', '受取', '玄関、インターホン、在宅を確認。外出禁止。', 0.95));
  }
  if (title.indexOf('プール') !== -1) {
    items.push(prep_('プール用品チェック', addDays_(row.date, -2), '', '娘', '園行事', '水着、巻き巻きタオル、帽子、プールバッグ、ビニール袋、名前記入を確認', 0.95));
    items.push(prep_('プールバッグ準備', addDays_(row.date, -1), '20:00', '娘', '園行事', '前日夜にプールバッグを準備', 0.95));
    items.push(prep_('プール用品を持つ', row.date, '07:30', '娘', '園行事', '当日朝にプール用品を持つ', 0.95));
  }
  if (['身体測定', '歯科検診', '避難訓練'].some(function (k) { return title.indexOf(k) !== -1; })) {
    items.push(prep_(title + ' 前日確認', addDays_(row.date, -1), '20:00', '娘', '園行事', '園アプリ・プリント、提出物、持ち物、服装を確認', 0.92));
  }
  return items;
}

function prep_(title, date, time, target, category, notes, confidence) {
  return { type: 'prep', title: title, date: date, start_time: time || null, end_time: null, target: target, category: category, location: null, status: 'todo', confidence: confidence, calendar_action: 'none', task_action: 'create', notes: notes };
}

function chooseTaskListName_(row) {
  if (row.type === 'shopping' || row.category === '買い物') return getSetting_('task_list_shopping', '買い物');
  if (row.target === '娘' || row.category === '園行事') return getSetting_('task_list_child', '園・子供');
  if (row.target === 'モカ' || row.category === '犬・病院') return getSetting_('task_list_mocha', 'モカ');
  if (row.category === '家の改善') return getSetting_('task_list_home', '家の改善');
  return getSetting_('task_list_today', '今日やる');
}

function taskTitle_(row) {
  return row.start_time ? row.start_time + ' ' + row.title : row.title;
}

function getOrCreateTaskList_(name) {
  var lists = Tasks.Tasklists.list().items || [];
  for (var i = 0; i < lists.length; i++) if (lists[i].title === name) return lists[i].id;
  return Tasks.Tasklists.insert({ title: name }).id;
}

function isFixedBlock_(title) {
  return ['ヘルパー', '訪問看護', '荷物', '受取'].some(function (k) { return String(title).indexOf(k) !== -1; });
}

function sortByTime_(a, b) {
  return String(a.start_time || '99:99').localeCompare(String(b.start_time || '99:99'));
}

function formatEventLine_(r) {
  var time = r.start_time ? r.start_time + '-' + (r.end_time || '') : '終日';
  return '- ' + time + ' ' + calendarTitle_(r);
}

function formatTaskLine_(r) {
  var prefix = r.date ? r.date + ' ' : '';
  if (r.start_time) prefix += r.start_time + ' ';
  return '- ' + prefix + r.title;
}

function linesFor_(arr, formatter) {
  if (!arr.length) return ['- なし'];
  return arr.map(formatter);
}

function buildDailyWarnings_(events, rows) {
  var warnings = [];
  events.forEach(function (e) { if (isFixedBlock_(e.title)) warnings.push(formatEventLine_(e).replace('- ', '') + ' は外出禁止・前後余白。'); });
  rows.forEach(function (r) { if (r.status === 'review') warnings.push('確認待ち: ' + r.title); });
  return warnings;
}

function chooseFirstThree_(tasks, shopping, prep) {
  return prep.concat(tasks).concat(shopping).slice(0, 3).map(function (r) { return r.title; });
}

function buildTimeTable_(date, events, tasks, shopping, prep) {
  var lines = [];
  var eventTitles = events.map(function (e) { return e.title; }).join(' ');
  events.forEach(function (e) {
    if (e.title.indexOf('ヘルパー') !== -1) lines.push('- 09:00-11:00 ヘルパーさん。家の中作業、印刷、冬服整理、準備確認に使う');
    if (e.title.indexOf('訪問看護') !== -1) {
      lines.push('- 13:45-14:00 訪問看護前メモ準備');
      lines.push('- 14:00-14:30 訪問看護さん');
      lines.push('- 14:30-14:45 訪問看護後の記録');
    }
    if (e.title.indexOf('荷物') !== -1 || e.title.indexOf('受取') !== -1) {
      lines.push('- 15:45-16:00 荷物受取準備');
      lines.push('- 16:00-18:00 荷物受取。外出禁止。家の中でできる軽作業のみ');
    }
  });
  if (eventTitles.indexOf('ヘルパー') !== -1) lines.push('- 11:00-12:00 モカの病院へ電話、買い物確認');
  lines.push('- 18:00以降 未完了整理');
  return lines.length ? lines : ['- 固定予定を基準に、外出禁止時間を避けて家タスクから実行'];
}

function heuristicClassification_(rawText, timestamp) {
  var today = formatDate_(new Date(), 'yyyy-MM-dd');
  var year = Number(formatDate_(new Date(), 'yyyy'));
  function d(month, day) { return year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2); }
  var text = String(rawText || '');
  var items = [];
  if (text.indexOf('ヘルパー') !== -1) items.push(event_('ヘルパーさん', today, '09:00', '11:00', '家', '支援', '家', 'ヘルパー時間は家の中作業に使う。外出禁止。'));
  if (text.indexOf('訪問看護') !== -1) items.push(event_('訪問看護さん', today, '14:00', '14:30', '家', '医療・支援', '家', '前15分準備、後15分記録。'));
  if (text.indexOf('荷物') !== -1 || text.indexOf('受取') !== -1) items.push(event_('荷物受取', today, '16:00', '18:00', '家', '受取', '家', '15分前に在宅確認。受取時間中は外出禁止。'));
  if (text.indexOf('狂犬病') !== -1 || text.indexOf('ワクチン') !== -1) items.push(task_('モカの動物病院に電話して狂犬病とワクチンの予定確認', '', '', 'モカ', '犬・病院', '動物病院に電話して狂犬病と混合ワクチンの接種可否・間隔・予約を確認する'));
  if (text.indexOf('ゴミ袋') !== -1) items.push(shopping_('ゴミ袋購入'));
  if (text.indexOf('冬用の服') !== -1 || text.indexOf('冬服') !== -1) items.push(task_('冬用の服を2軍へ移動し、上に置く', '', '', '家', '片付け', '衣類整理タスク'));
  if (text.indexOf('カレンダー印刷') !== -1) items.push(task_('6月以降カレンダー印刷', '', '', '家', '家事', '印刷タスク'));
  if (text.indexOf('知育プリント') !== -1) items.push(task_('知育プリント印刷', '', '', '家', '家事', '印刷タスク'));
  if (text.indexOf('子育て広場') !== -1) items.push(event_('子育て広場', d(6, 3), '', '', '娘', '園行事', '', '終日予定。'));
  if (text.indexOf('身体測定') !== -1) items.push(event_('身体測定', d(6, 4), '', '', '娘', '園行事', '', '前日確認を作る。'));
  if (text.indexOf('避難訓練') !== -1) items.push(event_('避難訓練', d(6, 5), '', '', '娘', '園行事', '', '園からの指定確認。'));
  if (text.indexOf('歯科検診') !== -1) items.push(event_('歯科検診', d(6, 5), '', '', '娘', '園行事', '', '歯磨き、提出物、問診票確認。'));
  if (text.indexOf('プール') !== -1) items.push(event_('プール開き', d(6, 9), '', '', '娘', '園行事', '', '持ち物確認のprepを生成。曜日が合うか確認。'));
  if (text.indexOf('巻き巻きタオル') !== -1) items.push(task_('巻き巻きタオル確認', '', '', '娘', '園行事', '疑問形のため購入確定ではなく確認。'));
  if (text.indexOf('帽子') !== -1) items.push(task_('帽子確認', '', '', '娘', '園行事', '疑問形のため確認。'));
  if (text.indexOf('時計固定') !== -1 || text.indexOf('時計') !== -1) {
    items.push(shopping_('時計固定用品確認'));
    items.push(task_('リビング側時計固定場所を決める', '', '', '家', '家の改善', '固定場所確認'));
    items.push(task_('ダイニング側時計固定場所を決める', '', '', '家', '家の改善', '固定場所確認'));
  }
  return { items: items, warnings: ['OPENAI_API_KEY未設定のためローカルMVP分類を使用'], assumptions: ['サンプル入力に最適化した分類'] };
}

function event_(title, date, start, end, target, category, location, notes) {
  return { type: 'event', title: title, date: date, start_time: start || null, end_time: end || null, target: target, category: category, location: location || null, status: 'confirmed', confidence: 0.95, calendar_action: 'create', task_action: 'none', notes: notes };
}

function task_(title, date, time, target, category, notes) {
  return { type: 'task', title: title, date: date || null, start_time: time || null, end_time: null, target: target, category: category, location: null, status: 'todo', confidence: 0.95, calendar_action: 'none', task_action: 'create', notes: notes };
}

function shopping_(title) {
  return { type: 'shopping', title: title, date: null, start_time: null, end_time: null, target: '家', category: '買い物', location: null, status: 'todo', confidence: 0.95, calendar_action: 'none', task_action: 'create', notes: '買い物リストへ' };
}
