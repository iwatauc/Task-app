const required = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Project URL'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anon public key'],
  ['NEXT_PUBLIC_SITE_URL', 'アプリのURL'],
  ['OPENAI_API_KEY', 'OpenAI API key'],
  ['OPENAI_IMAGE_MODEL', 'OpenAI画像モデル名'],
]

console.log('AI下絵工房 セットアップ確認\n')

let missing = 0
for (const [key, label] of required) {
  const value = process.env[key]
  if (value) {
    const masked = key.includes('KEY') ? `${value.slice(0, 8)}...` : value
    console.log(`OK  ${key}: ${masked}`)
  } else {
    missing += 1
    console.log(`NG  ${key}: 未設定（${label}）`)
  }
}

console.log('')
if (missing === 0) {
  console.log('すべて設定されています。npm run dev で起動できます。')
} else {
  console.log(`${missing}個の環境変数が未設定です。`)
  console.log('画面確認だけなら未設定でも起動できます。生成・保存まで使う場合は .env.local または Vercel Environment Variables に設定してください。')
}
