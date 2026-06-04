import fs from 'fs';
import path from 'path';

// ============================================================
// カテゴリ→データファイルマッピング（Manfrottoのみローカルデータあり）
// ============================================================
const CATEGORY_TO_FILE = {
  '三脚':                     'tripods',
  '雲台':                     'heads',
  '一脚':                     'monopods',
  'カメラバッグ':             'bags',
  'バックパック':             'bags',
  'ショルダーバッグ':         'bags',
  'TLZ・トップローディング':  'bags',
  'レンズ・ハードケース':     'bags',
  'ギアアップ・アクセサリー': 'bags',
  'ライティング':             'lighting',
  'アクセサリー':             'lighting',
  // Gitzo
  '三脚（Gitzo）':            'tripods',
  '一脚（Gitzo）':            'monopods',
  '雲台（Gitzo）':            'heads',
  'バッグ・アクセサリー（Gitzo）': 'bags',
  // English
  'Tripod':    'tripods',
  'Head':      'heads',
  'Monopod':   'monopods',
  'Camera Bag':'bags',
  'Backpack':  'bags',
  'Lighting':  'lighting',
};

function loadMini(filename) {
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'mini', filename);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function getProductList(category) {
  const file = CATEGORY_TO_FILE[category];
  if (!file) return [];
  const d = loadMini(`${file}.json`);
  if (!d) return [];
  return Array.isArray(d) ? d : [...(d.photo || []), ...(d.video || [])];
}

// ============================================================
// ブランド別 質問フロー（システムプロンプト用）
// ============================================================
const FLOWS = {
  ja: {
    // Manfrotto
    '三脚': `【三脚の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["写真撮影メイン","動画撮影メイン","写真・動画両方"]
2. 機材重量を確認 → options:["〜2kg","2〜5kg","5〜10kg","10kg以上"]
3. 撮影シーンを確認 → options:["旅行・登山","街撮り・日常","スタジオ・室内","スポーツ・野鳥"]
4. 素材を確認 → options:["カーボン（軽量優先）","アルミ（コスパ優先）","こだわらない"]
5. 予算を確認 → options:["〜3万円","3〜8万円","8〜15万円","15万円以上"]`,

    '雲台': `【雲台の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["写真撮影メイン","動画撮影メイン","写真・動画両方"]
2. 機材重量を確認 → options:["〜2kg","2〜5kg","5〜10kg","10kg以上"]
3. 三脚との組み合わせを確認 → options:["Manfrotto三脚と合わせたい","他社三脚を持っている","三脚もこれから購入"]
4. 予算を確認 → options:["〜2万円","2〜5万円","5〜10万円","10万円以上"]`,

    '一脚': `【一脚の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["スポーツ・報道","動画・Vlog","登山・旅行","野鳥・超望遠"]
2. 機材重量を確認 → options:["〜1.5kg","〜2.5kg","〜5kg","5kg以上"]
3. 雲台の必要性を確認 → options:["一脚のみでよい","雲台セットが欲しい","既に雲台を持っている"]
4. 素材を確認 → options:["カーボン（軽量優先）","アルミ（コスパ優先）","こだわらない"]`,

    'カメラバッグ': `【カメラバッグの質問フロー】この順番で1つずつ質問：
1. 収納機材を確認 → options:["ミラーレス+レンズ2〜3本","一眼+レンズ3〜4本","大型機材複数"]
2. 最大レンズサイズを確認 → options:["標準ズーム程度","70-200mm","超望遠300mm以上"]
3. PC収納を確認 → options:["13インチ以下","15インチ","不要"]
4. 使用シーンを確認 → options:["旅行・登山","街撮り・日常","プロ撮影","ドローン運搬"]`,

    'バックパック': `【バックパックの質問フロー】この順番で1つずつ質問：
1. 収納機材を確認 → options:["ミラーレス+レンズ2〜3本","一眼+レンズ3〜4本","大型機材複数"]
2. 最大レンズサイズを確認 → options:["標準ズーム程度","70-200mm","超望遠・シネレンズ"]
3. PC収納を確認 → options:["13インチ以下","15インチ","不要"]
4. 使用シーンを確認 → options:["旅行・登山","街撮り・日常","プロ撮影","ドローン運搬"]`,

    'ショルダーバッグ': `【ショルダーバッグの質問フロー】この順番で1つずつ質問：
1. 収納機材を確認 → options:["コンパクト1台のみ","カメラ1台+レンズ1本","カメラ+レンズ複数"]
2. スタイルを確認 → options:["斜めがけショルダー","スリング","トップローディング"]
3. 使用シーンを確認 → options:["日常・街撮り","旅行","スポーツ・アウトドア"]`,

    'TLZ・トップローディング': `【TLZ・トップローディングの質問フロー】この順番で1つずつ質問：
1. レンズサイズを確認 → options:["〜24-70mm","〜70-200mm","300mm以上"]
2. 用途を確認 → options:["素早く取り出したい","しっかり保護したい","両方"]
3. 使い方を確認 → options:["単独で使う","他のバッグのインサートとして"]`,

    'レンズ・ハードケース': `【レンズ・ハードケースの質問フロー】この順番で1つずつ質問：
1. 収納物を確認 → options:["交換レンズ","カメラ+アクセサリー","バッテリー・小物"]
2. サイズを確認 → options:["小型（〜8cm径）","中型（〜11cm径）","大型（〜13cm径）"]
3. 使い方を確認 → options:["バッグのインサート","単独で携帯","スタジオ保管"]`,

    'ギアアップ・アクセサリー': `【ギアアップアクセサリーの質問フロー】この順番で1つずつ質問：
1. 収納物を確認 → options:["ケーブル・バッテリー","カメラ本体","レンズ","メモリーカード"]
2. 使い方を確認 → options:["バッグのインサート","単独で使う","整理収納"]`,

    'ライティング': `【ライティングの質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["ポートレート","動画・YouTube","商品撮影","屋外ロケ"]
2. 光源の種類を確認 → options:["ストロボ","LED","リングライト","大型モノブロック"]
3. スタンドの必要性を確認 → options:["スタンドも欲しい","既に持っている","アクセサリーのみ"]
4. 設置場所を確認 → options:["スタジオ固定","自宅・小スペース","屋外","卓上"]`,

    'アクセサリー': `【アクセサリーの質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["カメラ固定・支持","テザー撮影","ライティング補助","その他"]
2. 取り付け先を確認 → options:["三脚","ライトスタンド","カメラ本体","壁・天井"]
3. 種類を確認 → options:["マジックアーム","クランプ","プレート","ストラップ"]`,

    // Gitzo
    '三脚（Gitzo）': `【Gitzo三脚の質問フロー】この順番で1つずつ質問：
1. 撮影シーンを確認 → options:["旅行・登山","風景・長時間露光","野鳥・超望遠","動画・映像制作"]
2. 機材重量を確認 → options:["〜3kg","3〜6kg","6〜10kg","10kg以上"]
3. 雲台の必要性を確認 → options:["三脚のみ","雲台もセットで欲しい","既に雲台を持っている"]
4. 優先事項を確認 → options:["できるだけ軽く小さく","安定性重視","バランス重視"]`,

    '一脚（Gitzo）': `【Gitzo一脚の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["スポーツ・野鳥","風景・旅行","動画・Vlog"]
2. 機材重量を確認 → options:["〜3kg","3〜6kg","6kg以上"]
3. 優先事項を確認 → options:["コンパクトに畳みたい","剛性重視","こだわらない"]`,

    '雲台（Gitzo）': `【Gitzo雲台の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["写真撮影","動画撮影","パノラマ・360°"]
2. 機材重量を確認 → options:["〜5kg","5〜10kg","10〜25kg"]
3. 組み合わせを確認 → options:["Gitzo三脚と合わせたい","他社三脚を持っている","三脚もこれから購入"]`,

    'バッグ・アクセサリー（Gitzo）': `【Gitzoバッグの質問フロー】この順番で1つずつ質問：
1. 種類を確認 → options:["三脚バッグ","カメラバッグ","アクセサリー"]
2. サイズを確認 → options:["コンパクト（トラベラー相当）","中型","大型"]`,
  },

  en: {
    '三脚': `[Tripod Flow] Ask ONE question at a time:
1. Main use → options:["Photography","Video","Both"]
2. Equipment weight → options:["~2kg","2-5kg","5-10kg","10kg+"]
3. Scene → options:["Travel/hiking","Street","Studio","Sports/wildlife"]
4. Material → options:["Carbon (lightweight)","Aluminum (value)","No preference"]`,

    '雲台': `[Head Flow] Ask ONE question at a time:
1. Main use → options:["Photography","Video","Both"]
2. Equipment weight → options:["~2kg","2-5kg","5-10kg","10kg+"]
3. Tripod combo → options:["Manfrotto tripod","Other brand","Not yet purchased"]`,

    '一脚': `[Monopod Flow] Ask ONE question at a time:
1. Main use → options:["Sports & news","Video & vlog","Hiking & travel","Wildlife & tele"]
2. Equipment weight → options:["~1.5kg","~2.5kg","~5kg","5kg+"]
3. Head needed → options:["Monopod only","With head set","Already have one"]`,

    'バックパック': `[Backpack Flow] Ask ONE question at a time:
1. Gear to carry → options:["Mirrorless + 2-3 lenses","DSLR + 3-4 lenses","Large gear multiple"]
2. Largest lens → options:["Standard zoom","70-200mm","Super telephoto"]
3. Laptop → options:["13\" or smaller","15\"","Not needed"]
4. Main scene → options:["Travel/hiking","Street/daily","Professional","Drone transport"]`,

    'ライティング': `[Lighting Flow] Ask ONE question at a time:
1. Main use → options:["Portrait","Video/YouTube","Product","Outdoor location"]
2. Light source → options:["Strobe","LED","Ring light","Large monoblock"]
3. Stand needed → options:["Need stand too","Already have one","Accessories only"]`,
  }
};

// ============================================================
// システムプロンプト構築（GUIDEフェーズ）
// ============================================================
function buildGuidancePrompt(lang, brand, category) {
  const catKey = category || '';
  const flow = FLOWS[lang]?.[catKey] || (
    lang === 'ja'
      ? 'まずどのカテゴリーをお探しか確認し、そのカテゴリーに合った質問をしてください。'
      : 'First confirm what product category they need, then follow the appropriate flow.'
  );

  const langRule = lang === 'ja' ? '必ず日本語で回答してください。' : 'Always respond in English.';
  const brandNote = brand && brand !== 'all'
    ? (lang === 'ja' ? `対象ブランド: ${brand}` : `Target brand: ${brand}`)
    : '';

  // 製品リスト（SKU+名前のみ・トークン節約）
  let productListStr = '';
  if (category) {
    const items = getProductList(category);
    if (items.length > 0) {
      const slim = items.map(p => `${p.sku}|${p.name}`).join('\n');
      productListStr = lang === 'ja'
        ? `\n【製品リスト（${items.length}件）— 実在するManfrotto製品】\n${slim}\n【絶対厳守】上記製品は全て実在します。「データがない」は絶対に言わないでください。`
        : `\n[Product List (${items.length} items — real products)]\n${slim}\n[MANDATORY] All products above are REAL. NEVER say they don't exist.`;
    }
  }

  const exampleJa = `{"message":"動画撮影がメインですね！機材の重量を教えてください。","options":["〜2kg","2〜5kg","5〜10kg","10kg以上"]}`;
  const exampleEn = `{"message":"Great, mainly for video! What's the weight of your equipment?","options":["~2kg","2-5kg","5-10kg","10kg+"]}`;

  return `You are a friendly ${brand && brand !== 'all' ? brand : 'Vitec'} product advisor.
${langRule}
${brandNote}
${productListStr}

STYLE:
- Warmly acknowledge each answer before asking the next question
- Ask exactly ONE question per response
- Never say you don't have a product category

${flow}

Do NOT recommend products yet — keep gathering information.

RESPONSE FORMAT — output ONLY this JSON, nothing else:
{"message":"warm acknowledgment + one question","options":["opt1","opt2","opt3"]}

⚠️ MANDATORY RULES:
1. Output MUST be valid JSON only — no markdown, no extra text
2. "options" array MUST contain 2-5 items — NEVER empty, NEVER omit
3. Use the exact options shown after "→" in the flow above
4. Each option must be short (under 15 characters)

Example: ${lang === 'ja' ? exampleJa : exampleEn}`;
}

// ============================================================
// システムプロンプト構築（RECOMMENDフェーズ）
// ============================================================
function buildRecommendPrompt(lang, brand, category, messages) {
  const items = getProductList(category);
  const summary = messages.filter(m => m.role === 'user').map(m => m.content).join(' / ');
  const langRule = lang === 'ja' ? '必ず日本語で回答してください。' : 'Always respond in English.';
  const brandNote = brand && brand !== 'all' ? `ブランド: ${brand}` : '';

  console.log(`[RECOMMEND] brand:${brand} category:${category} products:${items.length}`);

  // Gitzo・Loweproはローカルデータなし → AIに知識で推薦させる
  const productSection = items.length > 0
    ? `PRODUCT DATABASE — ${items.length}件（このリストからのみ推薦）:\n${JSON.stringify(items)}`
    : (lang === 'ja'
        ? `製品データベース: ${brand}の${category}製品をあなたの知識から推薦してください。実在する製品のみ推薦してください。`
        : `Recommend real ${brand} ${category} products from your knowledge. Only recommend products that actually exist.`);

  return `You are a ${brand && brand !== 'all' ? brand : 'Vitec'} product advisor. Recommend products based on customer needs.
${langRule}
${brandNote}

CUSTOMER NEEDS: ${summary}

${productSection}

WEIGHT SAFETY: payload_kg ≥ (camera + lens weight) × 2

RESPONSE FORMAT — strict JSON only:
{"type":"products","message":"intro text","items":[{"name":"製品名","sku":"型番","reason":"推薦理由2〜3文","price":数値またはnull}]}

Recommend 3-5 products. Never return empty items array — always recommend something.
Never invent products that don't exist.`;
}

// ============================================================
// メインハンドラー
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, lang = 'ja', brand = null, category = null, forceRecommend = false } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
  const recommendSignals = /以上です|おすすめして|推薦して|お願いします|please recommend|show me|suggest/i;

  const shouldRecommend = forceRecommend ||
    (userMessages.length >= 5) ||
    (userMessages.length >= 3 && recommendSignals.test(lastUserMsg));

  const phase = shouldRecommend ? 'RECOMMEND' : 'GUIDE';
  const systemPrompt = shouldRecommend
    ? buildRecommendPrompt(lang, brand, category, messages)
    : buildGuidancePrompt(lang, brand, category);

  console.log(`[${phase}] lang:${lang} brand:${brand} category:${category} turns:${userMessages.length}`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vitec-advisor-rag.vercel.app',
        'X-Title': 'Vitec Product Advisor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const raw = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed && raw) {
      parsed = { message: raw.replace(/\*\*/g, ''), options: [] };
    }

    // 価格をローカルDBから補完（Manfrottoのみ）
    if (parsed?.type === 'products' && parsed.items) {
      const priceMap = {};
      for (const cat of ['tripods', 'bags', 'heads', 'monopods', 'lighting']) {
        try {
          const d = loadMini(`${cat}.json`);
          if (!d) continue;
          const items = Array.isArray(d) ? d : [...(d.photo || []), ...(d.video || [])];
          for (const item of items) {
            if (item.sku && item.price != null) {
              priceMap[item.sku.toString().trim().toUpperCase()] = item.price;
            }
          }
        } catch {}
      }
      parsed.items = parsed.items.map(p => {
        const sku = (p.sku || '').toString().trim().toUpperCase();
        const dbPrice = priceMap[sku];
        p.price = (dbPrice != null && !isNaN(Number(dbPrice))) ? Number(dbPrice) : (p.price || null);
        return p;
      });
    }

    res.status(200).json({ reply: parsed || { message: raw, options: [] }, phase, category });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
