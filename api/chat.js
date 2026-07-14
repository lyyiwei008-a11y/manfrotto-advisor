import fs from 'fs';
import path from 'path';

// ============================================================
// カテゴリ→データファイルマッピング
// ============================================================
const CATEGORY_TO_FILE = {
  // Manfrotto 日本語
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
  // Gitzo 日本語
  '三脚（Gitzo）':            'tripods',
  '一脚（Gitzo）':            'monopods',
  '雲台（Gitzo）':            'heads',
  'バッグ・アクセサリー（Gitzo）': 'bags',
  // 英語カテゴリ
  'Tripod':              'tripods',
  'Head':                'heads',
  'Monopod':             'monopods',
  'Camera Bag':          'bags',
  'Backpack':            'bags',
  'Shoulder Bag':        'bags',
  'TLZ / Top Loading':   'bags',
  'Lens & Hard Case':    'bags',
  'GearUp & Accessories':'bags',
  'Lighting':            'lighting',
  'Accessories':         'lighting',
  'Tripod (Gitzo)':      'tripods',
  'Monopod (Gitzo)':     'monopods',
  'Head (Gitzo)':        'heads',
  'Bag & Accessories':   'bags',
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
// 質問フロー定義（V2と完全統一・条件分岐なし）
// ============================================================
const FLOWS = {
  ja: {
    '三脚': `【三脚の質問フロー】1つずつ質問：
1. 主な用途 → options:["写真撮影メイン","動画撮影メイン","写真・動画両方"]
2. 使用機材の重さ → options:["〜2kg","2〜5kg","5〜10kg","10kg以上"]
3. 撮影シーン → options:["旅行・登山","街撮り・日常","スタジオ・室内","スポーツ・野鳥","放送・シネマ"]
4. 素材のこだわり → options:["カーボン（軽量優先）","アルミ（コスパ優先）","こだわらない"]
5. 予算感 → options:["〜3万円","3〜8万円","8〜15万円","15万円以上"]`,

    '雲台': `【雲台の質問フロー】1つずつ質問：
1. 主な用途 → options:["写真撮影メイン","動画撮影メイン","写真・動画両方"]
2. 雲台のタイプ → options:["ボールヘッド","3ウェイ","ビデオ雲台（フルード）","ギア雲台","わからない"]
3. 使用機材の重さ → options:["〜2kg","2〜5kg","5〜10kg","10kg以上"]
4. 三脚との組み合わせ → options:["Manfrotto三脚と合わせたい","他社三脚を持っている","三脚もこれから購入"]
5. 予算感 → options:["〜2万円","2〜5万円","5〜10万円","10万円以上"]`,

    '一脚': `【一脚の質問フロー】1つずつ質問：
1. 主な用途 → options:["スポーツ・報道","動画・Vlog","登山・旅行","野鳥・超望遠"]
2. 機材の重さ → options:["〜1.5kg","〜2.5kg","〜5kg","5kg以上"]
3. 雲台は必要か → options:["一脚のみでよい","雲台セットが欲しい","既に雲台を持っている"]
4. 素材 → options:["カーボン（軽量優先）","アルミ（コスパ優先）","こだわらない"]`,

    'カメラバッグ': `【カメラバッグの質問フロー】1つずつ質問：
1. バッグのスタイル → options:["バックパック","ショルダーバッグ","トップローディング","どれでもよい"]
2. 収納したい機材 → options:["ミラーレス+レンズ2〜3本","一眼+レンズ3〜4本","大型機材複数"]
3. 最大レンズサイズ → options:["標準ズーム程度","70-200mm","超望遠300mm以上"]
4. PC・タブレット収納 → options:["13インチ以下","15インチ","不要"]
5. 使用シーン → options:["旅行・登山","街撮り・日常","プロ撮影","ドローン運搬"]`,

    'バックパック': `【バックパックの質問フロー】1つずつ質問：
1. 収納したい機材 → options:["ミラーレス+レンズ2〜3本","一眼+レンズ3〜4本","大型機材複数"]
2. 最大レンズサイズ → options:["標準ズーム程度","70-200mm","超望遠・シネレンズ"]
3. PC・タブレット収納 → options:["13インチ以下","15インチ","不要"]
4. 使用シーン → options:["旅行・登山","街撮り・日常","プロ撮影","ドローン運搬"]
5. 防水・レインカバー → options:["必須","あれば嬉しい","不要"]`,

    'ショルダーバッグ': `【ショルダーバッグの質問フロー】1つずつ質問：
1. 収納したい機材 → options:["コンパクト1台のみ","カメラ1台+レンズ1本","カメラ+レンズ複数"]
2. バッグのスタイル → options:["斜めがけショルダー","スリング","トップローディング"]
3. 使用シーン → options:["日常・街撮り","旅行","スポーツ・アウトドア"]`,

    'TLZ・トップローディング': `【TLZ・トップローディングの質問フロー】1つずつ質問：
1. 収納したいレンズサイズ → options:["〜24-70mm","〜70-200mm","300mm以上"]
2. 重視すること → options:["素早く取り出したい","しっかり保護したい","両方"]
3. 使い方 → options:["単独で使う","他のバッグのインサートとして"]`,

    'レンズ・ハードケース': `【レンズ・ハードケースの質問フロー】1つずつ質問：
1. 収納したいもの → options:["交換レンズ","カメラ+アクセサリー","バッテリー・小物"]
2. レンズサイズ → options:["小型（〜8cm径）","中型（〜11cm径）","大型（〜13cm径）"]
3. 使い方 → options:["バッグのインサート","単独で携帯","スタジオ保管"]`,

    'ギアアップ・アクセサリー': `【ギアアップアクセサリーの質問フロー】1つずつ質問：
1. 収納したいもの → options:["ケーブル・バッテリー","カメラ本体","レンズ","メモリーカード"]
2. 使い方 → options:["バッグのインサート","単独で使う","整理収納"]`,

    'ライティング': `【ライティングの質問フロー】1つずつ質問：
1. 主な用途 → options:["ポートレート","動画・YouTube","商品・物撮り","屋外ロケ"]
2. 光源の種類 → options:["ストロボ","LED","リングライト","大型モノブロック"]
3. スタンドも必要か → options:["スタンドも欲しい","既に持っている","アクセサリーのみ"]
4. 設置場所 → options:["スタジオ固定","自宅・小スペース","屋外移動","卓上"]
5. アームも必要か → options:["必要","不要","わからない"]`,

    'アクセサリー': `【アクセサリーの質問フロー】1つずつ質問：
1. 何に使いたいか → options:["カメラ固定・支持","テザー撮影","ライティング補助","その他"]
2. 取り付け先 → options:["三脚","ライトスタンド","カメラ本体","壁・天井"]
3. 具体的に欲しいもの → options:["マジックアーム","クランプ","プレート","ストラップ"]`,

    '三脚（Gitzo）': `【Gitzo三脚の質問フロー】1つずつ質問：
1. 撮影シーン → options:["旅行・登山","風景・長時間露光","野鳥・超望遠","動画・映像制作"]
2. カメラ＋レンズの合計重量 → options:["〜3kg","3〜6kg","6〜10kg","10kg以上"]
3. 雲台も必要か → options:["三脚のみ","雲台もセットで欲しい","既に雲台を持っている"]
4. 携帯性のこだわり → options:["できるだけ軽く小さく","安定性重視","バランス重視"]
5. 予算感 → options:["〜5万円","5〜10万円","10〜20万円","20万円以上"]`,

    '一脚（Gitzo）': `【Gitzo一脚の質問フロー】1つずつ質問：
1. 撮影シーン → options:["スポーツ・野鳥","風景・旅行","動画・Vlog"]
2. 機材の重さ → options:["〜3kg","3〜6kg","6kg以上"]
3. 段数のこだわり → options:["コンパクトに畳みたい","剛性重視","こだわらない"]`,

    '雲台（Gitzo）': `【Gitzo雲台の質問フロー】1つずつ質問：
1. 主な用途 → options:["写真撮影","動画撮影","パノラマ・360°"]
2. 機材の重さ → options:["〜5kg","5〜10kg","10〜25kg"]
3. 三脚との組み合わせ → options:["Gitzo三脚と合わせたい","他社三脚を持っている","三脚もこれから購入"]`,

    'バッグ・アクセサリー（Gitzo）': `【Gitzoバッグの質問フロー】1つずつ質問：
1. 何を収納したいか → options:["三脚バッグ","カメラバッグ","アクセサリー"]
2. 対応したい三脚サイズ → options:["コンパクト（トラベラー相当）","中型","大型"]`,
  },

  en: {
    'Tripod': `[Tripod Flow] Ask ONE question at a time:
1. Main purpose → options:["Photography","Video","Both photo & video"]
2. Gear weight (camera + lens) → options:["Up to 2kg","2-5kg","5-10kg","10kg+"]
3. Shooting scene → options:["Travel/hiking","Street/daily","Studio","Sports/wildlife","Cinema/broadcast"]
4. Material → options:["Carbon (lightweight)","Aluminum (value)","No preference"]
5. Budget → options:["Under ¥30,000","¥30,000-80,000","¥80,000-150,000","¥150,000+"]`,

    'Head': `[Head Flow] Ask ONE question at a time:
1. Main purpose → options:["Photography","Video","Both photo & video"]
2. Head type → options:["Ball head","3-way","Fluid (video)","Geared","Not sure"]
3. Gear weight → options:["Up to 2kg","2-5kg","5-10kg","10kg+"]
4. Tripod combination → options:["With Manfrotto tripod","With other brand tripod","Need tripod too"]
5. Budget → options:["Under ¥20,000","¥20,000-50,000","¥50,000-100,000","¥100,000+"]`,

    'Monopod': `[Monopod Flow] Ask ONE question at a time:
1. Main use → options:["Sports & news","Video & vlog","Hiking & travel","Wildlife & telephoto"]
2. Gear weight → options:["Up to 1.5kg","Up to 2.5kg","Up to 5kg","5kg+"]
3. Head needed? → options:["Monopod only","With head set","Already have a head"]
4. Material → options:["Carbon (lightweight)","Aluminum (value)","No preference"]`,

    'Camera Bag': `[Camera Bag Flow] Ask ONE question at a time:
1. Bag style → options:["Backpack","Shoulder bag","Top loading","Any style"]
2. Gear to carry → options:["Mirrorless + 2-3 lenses","DSLR + 3-4 lenses","Large gear multiple"]
3. Largest lens → options:["Standard zoom","70-200mm","Super telephoto 300mm+"]
4. Laptop/tablet → options:["Up to 13\\"","15\\"","Not needed"]
5. Main scene → options:["Travel/hiking","Street/daily","Professional","Drone transport"]`,

    'Lighting': `[Lighting Flow] Ask ONE question at a time:
1. Main purpose → options:["Portrait","Video/YouTube","Product photography","Outdoor location"]
2. Light source → options:["Strobe","LED","Ring light","Large monoblock"]
3. Stand needed? → options:["Need stand too","Already have one","Accessories only"]
4. Location → options:["Studio fixed","Home/small space","Outdoor mobile","Desktop"]
5. Arm needed? → options:["Needed","Not needed","Not sure"]`,

    'Accessories': `[Accessories Flow] Ask ONE question at a time:
1. Main use → options:["Camera support","Tethered shooting","Lighting support","Other"]
2. Mount point → options:["Tripod","Light stand","Camera body","Wall/ceiling"]
3. Type needed → options:["Magic arm","Clamp","Plate","Strap"]`,

    'Tripod (Gitzo)': `[Gitzo Tripod Flow] Ask ONE question at a time:
1. Shooting scene → options:["Travel/hiking","Landscape/long exposure","Wildlife/telephoto","Video/cinema"]
2. Gear weight → options:["Up to 3kg","3-6kg","6-10kg","10kg+"]
3. Head needed? → options:["Tripod only","Need head too","Already have a head"]
4. Portability → options:["As light as possible","Stability over weight","Balanced"]
5. Budget → options:["Under ¥50,000","¥50,000-100,000","¥100,000-200,000","¥200,000+"]`,

    'Monopod (Gitzo)': `[Gitzo Monopod Flow] Ask ONE question at a time:
1. Shooting scene → options:["Sports/wildlife","Landscape/travel","Video/vlog"]
2. Gear weight → options:["Up to 3kg","3-6kg","6kg+"]
3. Section count → options:["Compact folding","Rigidity priority","No preference"]`,

    'Head (Gitzo)': `[Gitzo Head Flow] Ask ONE question at a time:
1. Main purpose → options:["Photography","Video","Panorama/360°"]
2. Gear weight → options:["Up to 5kg","5-10kg","10-25kg"]
3. Tripod combination → options:["With Gitzo tripod","With other brand tripod","Need tripod too"]`,

    'Bag & Accessories': `[Gitzo Bag Flow] Ask ONE question at a time:
1. What to store → options:["Tripod bag","Camera bag","Accessories"]
2. Tripod size → options:["Compact (Traveler size)","Medium","Large (Systematic size)"]`,

    'Backpack': `[Backpack Flow] Ask ONE question at a time:
1. Gear to carry → options:["Mirrorless + 2-3 lenses","DSLR + 3-4 lenses","Large gear + accessories"]
2. Largest lens → options:["Standard zoom","70-200mm","Super telephoto/cine lens"]
3. Laptop → options:["Up to 13\\"","15\\"","Not needed"]
4. Main scene → options:["Travel/hiking","Street/daily","Professional","Drone transport"]
5. Rain cover → options:["Essential","Nice to have","Not needed"]`,

    'Shoulder Bag': `[Shoulder Bag Flow] Ask ONE question at a time:
1. Gear to carry → options:["Compact camera only","Camera + 1 lens","Camera + multiple lenses"]
2. Bag style → options:["Shoulder bag","Sling","Top loading"]
3. Main scene → options:["Daily/street","Travel","Sports/outdoor"]`,

    'TLZ / Top Loading': `[TLZ Flow] Ask ONE question at a time:
1. Lens size → options:["Up to 24-70mm","Up to 70-200mm","300mm+"]
2. Priority → options:["Quick access","Solid protection","Both"]
3. Usage → options:["Standalone use","As bag insert"]`,

    'Lens & Hard Case': `[Case Flow] Ask ONE question at a time:
1. What to store → options:["Interchangeable lens","Camera + accessories","Battery/small items"]
2. Lens size → options:["Small (~8cm dia.)","Medium (~11cm dia.)","Large (~13cm dia.)"]
3. Usage → options:["As bag insert","Standalone carry","Studio storage"]`,

    'GearUp & Accessories': `[GearUp Flow] Ask ONE question at a time:
1. What to store → options:["Cables/batteries","Camera body","Lens","Memory cards"]
2. Usage → options:["As bag insert","Standalone use","Organization"]`,
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
        ? `\n【製品リスト（${items.length}件）— 実在する製品】\n${slim}\n【絶対厳守】上記製品は全て実在します。「データがない」は絶対に言わないでください。`
        : `\n[Product List (${items.length} items — real products)]\n${slim}\n[MANDATORY] All products above are REAL. NEVER say they don't exist.`;
    }
  }

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
4. Each option must be short (under 15 characters)`;
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
{"type":"products","message":"intro text","items":[{"name":"製品名","sku":"型番","brand":"ブランド","reason":"推薦理由2〜3文","price":数値orNull}]}

Recommend 5-7 products. Never return empty items array — always recommend something.
Never invent products that don't exist.`;
}

// ============================================================
// メインハンドラー（OpenRouter + Claude Haiku）
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

  // V2と同じ：forceRecommendのみで推薦（質問途中での早期推薦を防ぐ）
  const minTurns = 4;
  const shouldRecommend = (forceRecommend === true) ||
    (userMessages.length >= minTurns && recommendSignals.test(lastUserMsg));

  const phase = shouldRecommend ? 'RECOMMEND' : 'GUIDE';
  const systemPrompt = shouldRecommend
    ? buildRecommendPrompt(lang, brand, category, messages)
    : buildGuidancePrompt(lang, brand, category);

  console.log(`[${phase}] lang:${lang} brand:${brand} category:${category} turns:${userMessages.length}`);

  try {
    // V1: OpenRouter経由でClaude Haikuを呼び出す
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
        max_tokens: 1500
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
      for (const cat of ['tripods', 'bags', 'heads', 'monopods', 'lighting', 'accessories']) {
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
