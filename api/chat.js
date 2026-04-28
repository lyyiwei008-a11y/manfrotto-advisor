import fs from 'fs';
import path from 'path';

function detectCategory(messages) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  if (/三脚|tripod|さんきゃく|ビデオ三脚/.test(text)) return 'tripods';
  if (/バッグ|bag|かばん|鞄|ケース|backpack|pouch|ウエスト/.test(text)) return 'bags';
  if (/雲台|ball head|fluid head|うんだい/.test(text)) return 'heads';
  if (/一脚|monopod|いっきゃく/.test(text)) return 'monopods';
  if (/照明|ライト|lighting|スタンド/.test(text)) return 'lighting';
  return null;
}

function loadMini(filename) {
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'mini', filename);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function getProductSample(category) {
  try {
    const d = loadMini(`${category}.json`);
    if (!d) return null;
    const items = Array.isArray(d) ? d : [...(d.photo||[]), ...(d.video||[])];
    return {
      count: items.length,
      samples: items.slice(0, 8).map(p => `${p.name}（${p.sku}）`).join('\n')
    };
  } catch { return null; }
}

const FLOWS = {
  ja: {
    tripods: `【三脚の質問フロー】この順番で1つずつ質問：
1. 「三脚のみ」か「雲台セット」かを確認 → options:["三脚のみ","雲台セット"]
2. 用途を確認 → options:["写真メイン","動画メイン","両方"]
3. 使用機材を確認 → options:["Sony","Canon","Nikon","Fujifilm","その他"]
4. 動画の場合：パン/チルトのこだわりを確認 → options:["滑らかさ重視","素早い操作","こだわらない"]
5. 素材を確認 → options:["カーボン","アルミ","こだわらない"]
6. 撮影シーンを確認 → options:["旅行・登山","街撮り","スタジオ","スポーツ"]`,

    bags: `【カメラバッグの質問フロー】この順番で1つずつ質問：
1. バッグタイプを確認 → options:["バックパック","ショルダー","ウエスト","ローラー"]
2. 持ち出し機材を確認 → options:["1台+レンズ1〜2本","1台+レンズ3〜4本","2台以上"]
3. 最大レンズサイズを確認 → options:["標準ズーム","70-200mm","超望遠","シネレンズ"]
4. 個人荷物の量を確認 → options:["機材のみ","少し","普段使いも"]
5. 使用シーンを確認 → options:["旅行・登山","街撮り","プロ撮影","動画"]`,

    heads: `【雲台の質問フロー】この順番で1つずつ質問：
1. 雲台タイプを確認 → options:["ボールヘッド","フルードヘッド","3ウェイ","ギア","わからない"]
2. 用途を確認 → options:["写真メイン","動画メイン","両方"]
3. 機材重量を確認 → options:["〜2kg","2〜5kg","5〜10kg","10kg以上"]
4. 動画の場合：パン/チルトのこだわりを確認 → options:["滑らかさ重視","カウンターバランス","コンパクト"]
5. 設置スピードを確認 → options:["素早い架設","精密な調整","こだわらない"]
6. 三脚との組み合わせを確認 → options:["Manfrotto三脚","他社三脚","これから購入"]`,

    monopods: `【一脚の質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["スポーツ・報道","動画・走り撮り","登山・旅行","野鳥・望遠"]
2. 機材重量を確認 → options:["〜1.5kg","〜2.5kg","〜5kg","〜8kg"]
3. 雲台の必要性を確認 → options:["一脚のみ","雲台セット","既に持っている"]
4. 自立機能を確認 → options:["必要","不要","あれば嬉しい"]
5. ロック方式を確認 → options:["レバー式","ナット式","こだわらない"]
6. 素材を確認 → options:["カーボン","アルミ","こだわらない"]`,

    lighting: `【照明スタンドの質問フロー】この順番で1つずつ質問：
1. 用途を確認 → options:["ポートレート","動画・YouTube","商品撮影","屋外ロケ"]
2. 光源の種類を確認 → options:["ストロボ","LED","リングライト","大型モノブロック"]
3. スタンドの必要性を確認 → options:["スタンドも欲しい","既に持っている","アクセサリーのみ"]
4. 設置場所を確認 → options:["スタジオ固定","自宅・小スペース","屋外","卓上"]
5. アームの必要性を確認 → options:["必要","不要","わからない"]
6. バックドロップの必要性を確認 → options:["必要","不要"]`
  },

  en: {
    tripods: `[Tripod Flow] Ask ONE question at a time in this order:
1. Tripod only or with head set → options:["Tripod only","With head set"]
2. Main use → options:["Mainly photo","Mainly video","Both"]
3. Camera brand → options:["Sony","Canon","Nikon","Fujifilm","Other"]
4. Video: pan/tilt needs → options:["Smooth panning","Quick setup","Doesn't matter"]
5. Material → options:["Carbon","Aluminum","No preference"]
6. Scene → options:["Travel/hiking","Street","Studio","Sports"]`,

    bags: `[Camera Bag Flow] Ask ONE question at a time in this order:
1. Bag type → options:["Backpack","Shoulder bag","Waist bag","Roller bag"]
2. Gear for one outing → options:["1 body + 1-2 lenses","1 body + 3-4 lenses","2+ bodies"]
3. Largest lens → options:["Standard zoom","70-200mm","Super telephoto","Cine lens"]
4. Personal items → options:["Gear only","A little","Everyday use too"]
5. Main scene → options:["Travel/hiking","Street","Professional","Video"]`,

    heads: `[Head Flow] Ask ONE question at a time in this order:
1. Head type → options:["Ball head","Fluid head","3-way","Gear head","Not sure"]
2. Main use → options:["Mainly photo","Mainly video","Both"]
3. Equipment weight → options:["~2kg","2-5kg","5-10kg","10kg+"]
4. Video: pan/tilt → options:["Smooth panning","Counterbalance","Compact size"]
5. Setup speed → options:["Quick setup","Precise adjustment","No preference"]
6. Tripod combo → options:["Manfrotto tripod","Other brand","Not yet purchased"]`,

    monopods: `[Monopod Flow] Ask ONE question at a time in this order:
1. Main use → options:["Sports & news","Video & run","Hiking & travel","Wildlife & tele"]
2. Equipment weight → options:["~1.5kg","~2.5kg","~5kg","~8kg"]
3. Head needed → options:["Monopod only","With head","Already have one"]
4. Self-standing → options:["Yes needed","Not needed","Nice to have"]
5. Lock type → options:["Lever lock","Twist lock","No preference"]
6. Material → options:["Carbon","Aluminum","No preference"]`,

    lighting: `[Lighting Flow] Ask ONE question at a time in this order:
1. Main use → options:["Portrait","Video & YouTube","Product","Outdoor location"]
2. Light source → options:["Strobe","LED","Ring light","Large monoblock"]
3. Stand needed → options:["Need stand","Already have","Accessories only"]
4. Location → options:["Studio fixed","Home small space","Outdoor","Desktop"]
5. Boom arm → options:["Yes needed","Not needed","Not sure"]
6. Backdrop → options:["Yes needed","Not needed"]`
  }
};

const CAMERA_REF = `Sony:α7IV=659g,α7C=509g,α6700=493g,FX3=715g
Canon:R6II=670g,R5II=910g,R50=375g,C70=1010g
Nikon:Z6III=760g,Z8=910g,Z9=1340g,D850=1005g
Fujifilm:X-T5=557g,X-H2=660g,X100VI=521g
Ricoh:GRIV=275g,GRIIIx=262g`;

function buildGuidancePrompt(lang, category) {
  const flow = category && FLOWS[lang]?.[category]
    ? FLOWS[lang][category]
    : (lang === 'ja'
      ? 'まずどのカテゴリーをお探しか確認し、そのカテゴリーに合った質問をしてください。'
      : 'First confirm what product category they need, then follow the appropriate flow.');

  const langRule = lang === 'ja'
    ? '必ず日本語で回答してください。'
    : 'Always respond in English.';

  // Load full product data to show Claude the data EXISTS
  let productListStr = '';
  if (category) {
    const d = loadMini(`${category}.json`);
    if (d) {
      const items = Array.isArray(d) ? d : [...(d.photo||[]), ...(d.video||[])];
      // Only pass sku + name to save tokens
      const slim = items.map(p => `${p.sku}|${p.name}`).join('\n');
      productListStr = lang === 'ja'
        ? `\n【製品リスト（${items.length}件）— これらは全て実在するManfrotto製品です】\n${slim}`
        : `\n[Product List (${items.length} items — all real Manfrotto products)]\n${slim}`;
    }
  }
  const dataNote = productListStr
    ? (lang === 'ja'
      ? `${productListStr}\n【絶対厳守】上記の製品は全て実在するManfrotto製品です。「データがない」「取り扱いがない」は絶対に言わないでください。`
      : `${productListStr}\n[MANDATORY] All products above are REAL Manfrotto products. NEVER say they don't exist.`)
    : '';

  const exampleJa = `{"message":"動画撮影がメインですね！使用されるカメラを教えてください。","options":["Sony","Canon","Nikon","Fujifilm","その他"]}`;
  const exampleEn = `{"message":"Great, mainly for video! Which camera brand do you use?","options":["Sony","Canon","Nikon","Fujifilm","Other"]}`;

  return `You are a friendly Manfrotto product advisor.
${langRule}
${dataNote}

STYLE:
- Warmly acknowledge each answer before asking the next question
- Ask exactly ONE question per response
- Never say you don't have a product category

${flow}

CAMERA WEIGHT: ${CAMERA_REF}

Do NOT recommend products yet — keep gathering information.

RESPONSE FORMAT — output ONLY this JSON, nothing else:
{"message":"warm acknowledgment + one question","options":["opt1","opt2","opt3"]}

⚠️ MANDATORY RULES:
1. Output MUST be valid JSON only — no markdown, no extra text
2. "options" array MUST contain 3-5 items — NEVER empty, NEVER omit
3. Use the exact options shown after "→" in the flow above
4. Each option must be short (under 12 characters)

Example: ${lang === 'ja' ? exampleJa : exampleEn}`;
}

function buildRecommendPrompt(lang, category, messages) {
  const productData = category ? loadMini(`${category}.json`) : null;
  const cameraData = loadMini('cameras.json');
  const summary = messages.filter(m => m.role === 'user').map(m => m.content).join(' / ');
  const langRule = lang === 'ja' ? '必ず日本語で回答してください。' : 'Always respond in English.';

  // Normalize product data to array
  let productList = [];
  if (productData) {
    if (Array.isArray(productData)) {
      productList = productData;
    } else {
      productList = [...(productData.photo||[]), ...(productData.video||[])];
    }
  }

  console.log(`[RECOMMEND] category:${category} products:${productList.length}`);

  return `You are a Manfrotto product advisor. Recommend products from the database below.
${langRule}

CUSTOMER NEEDS: ${summary}

CAMERA DATABASE: ${cameraData ? JSON.stringify(cameraData.cameras) : ''}

PRODUCT DATABASE — ${productList.length} real products (recommend ONLY from this list, never invent):
${JSON.stringify(productList)}

WEIGHT SAFETY: payload_kg ≥ (camera + lens weight) × 2

RESPONSE FORMAT — strict JSON only:
{"type":"products","message":"intro text","items":[{"name":"製品名","sku":"型番","reason":"推薦理由2〜3文"}]}

Recommend 3-5 products. If no perfect match exists, recommend the closest options from the list.
Never return empty items array — always recommend something from the database.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, lang = 'ja' } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const category = detectCategory(messages);
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

  const recommendSignals = /以上です|おすすめして|推薦して|お願いします|please recommend|show me products|suggest products/i;
  const shouldRecommend = category &&
    userMessages.length >= 3 &&
    (userMessages.length >= 5 || recommendSignals.test(lastUserMsg));

  const phase = shouldRecommend ? 'RECOMMEND' : 'GUIDE';
  const systemPrompt = shouldRecommend
    ? buildRecommendPrompt(lang, category, messages)
    : buildGuidancePrompt(lang, category);

  console.log(`[${phase}] lang:${lang} category:${category} turns:${userMessages.length}`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://manfrotto-advisor.vercel.app',
        'X-Title': 'Manfrotto Advisor'
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

    // If parse failed but we got text, wrap it with empty options
    if (!parsed && raw) {
      parsed = { message: raw.replace(/\*\*/g, ''), options: [] };
    }

    // If options is missing or empty, add default options based on category
    if (parsed && !parsed.type && (!parsed.options || parsed.options.length === 0)) {
      const defaultOptions = {
        ja: { tripods: ['写真メイン','動画メイン','両方'], bags: ['バックパック','ショルダー','ウエスト'], heads: ['ボールヘッド','フルードヘッド','わからない'], monopods: ['スポーツ','動画','登山'], lighting: ['ポートレート','動画','商品撮影'] },
        en: { tripods: ['Photo','Video','Both'], bags: ['Backpack','Shoulder','Waist'], heads: ['Ball head','Fluid head','Not sure'], monopods: ['Sports','Video','Hiking'], lighting: ['Portrait','Video','Product'] }
      };
      parsed.options = defaultOptions[lang]?.[category] || [];
    }

    // Enrich product prices from DB
    if (parsed?.type === 'products' && parsed.items) {
      const priceMap = {};
      for (const cat of ['tripods','bags','heads','monopods','lighting']) {
        try {
          const d = loadMini(`${cat}.json`);
          if (!d) continue;
          const items = Array.isArray(d) ? d : [...(d.photo||[]), ...(d.video||[])];
          for (const item of items) {
            if (item.sku && item.price != null) {
              priceMap[item.sku.toString().trim().toUpperCase()] = item.price;
            }
          }
        } catch {}
      }
      parsed.items = parsed.items.map(p => {
        const sku = (p.sku||'').toString().trim().toUpperCase();
        const dbPrice = priceMap[sku];
        p.price = (dbPrice != null && !isNaN(Number(dbPrice))) ? Number(dbPrice) : null;
        return p;
      });
    }

    res.status(200).json({
      reply: parsed || { message: raw, options: [] },
      phase,
      category
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
