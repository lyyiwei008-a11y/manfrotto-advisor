import fs from 'fs';
import path from 'path';

function detectCategory(messages) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  if (/三脚|tripod|さんきゃく|ビデオ三脚/.test(text)) return 'tripods';
  if (/バッグ|bag|かばん|鞄|ケース|backpack/.test(text)) return 'bags';
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

// ── Category-specific guidance flows ──
const FLOWS = {
  ja: {
    tripods: `【三脚の質問フロー】以下の順番で1つずつ質問してください：
1. 「三脚のみ」か「雲台セット」かを確認
2. 「写真メイン」「動画メイン」「両方」を確認
3. 使用機材を確認（カメラ機種 or 重量目安）→ 耐荷重計算のため必須
4. 動画の場合のみ：パン/チルトの滑らかさ、カウンターバランスの必要性を確認
5. 素材（カーボン/アルミ）の希望を確認
6. 撮影シーン（登山/旅行/スタジオ/スポーツ等）を確認`,

    bags: `【カメラバッグの質問フロー】以下の順番で1つずつ質問してください：
1. バッグタイプ（バックパック/ショルダー/ウエストポーチ/ローラーバッグ）を確認
2. 「今回の撮影で持ち出す機材」を確認（所有台数ではなく実際の持ち出し量）
3. 一番大きいレンズを確認（70-200mm f/2.8が入るかが重要な分岐点）
4. 個人荷物の量（機材のみ/少し/普段使いも）を確認 → 普段使いの場合はPC サイズも確認
5. 三脚を一緒に持ち歩くか確認（小型/大型）
6. 主な使用シーン（旅行/街撮り/プロ撮影/動画）を確認`,

    heads: `【雲台の質問フロー】以下の順番で1つずつ質問してください：
1. 雲台タイプ（ボールヘッド/フルードヘッド/3ウェイ/ギア）が決まっているか確認
2. 主な撮影（写真/動画/両方）を確認
3. 使用機材の重量を確認（カメラ機種 or 重量目安）
4. 動画の場合：パン/チルトの滑らかさ、カウンターバランスの必要性を確認
5. 設置スピードの優先度（素早い架設/精密な調整）を確認
6. 既存の三脚との組み合わせ（Manfrotto/他社/これから購入）を確認`,

    monopods: `【一脚の質問フロー】以下の順番で1つずつ質問してください：
1. 主な用途（スポーツ・報道/動画・走り撮り/登山・旅行/野鳥・望遠）を確認
2. 使用機材の重量を確認（カメラ機種 or 重量目安）
3. 雲台が必要か確認（一脚のみ/セット/既に持っている）
4. 自立機能が必要か確認
5. ロック方式（レバー式/ナット式）の好みを確認
6. 素材（カーボン/アルミ）の希望を確認`,

    lighting: `【照明スタンドの質問フロー】以下の順番で1つずつ質問してください：
1. 主な用途（ポートレート/動画・YouTube/商品撮影/屋外ロケ）を確認
2. 使用する光源の種類（ストロボ/LED/リングライト/大型モノブロック）を確認
3. スタンドが必要か確認（スタンドも欲しい/既に持っている/アクセサリーのみ）
4. 設置場所（スタジオ固定/自宅・小スペース/屋外ロケ/卓上）を確認
5. アームやブームが必要か確認
6. バックドロップ（背景紙）が必要か確認`
  },

  en: {
    tripods: `[Tripod Question Flow] Ask ONE question at a time in this order:
1. Confirm: tripod only OR tripod + head set
2. Confirm: mainly photo / mainly video / both
3. Confirm camera model or weight estimate → essential for payload calculation
4. Video only: ask about pan/tilt smoothness and counterbalance needs
5. Confirm material preference (carbon / aluminum)
6. Confirm shooting scene (hiking / travel / studio / sports etc.)`,

    bags: `[Camera Bag Question Flow] Ask ONE question at a time in this order:
1. Confirm bag type (backpack / shoulder / waist / roller)
2. Confirm gear for ONE typical outing (not total owned gear)
3. Confirm largest lens (70-200mm f/2.8 is a key dividing point)
4. Confirm personal items (gear only / a little / everyday use) → if everyday: ask laptop size
5. Confirm tripod carry (none / compact / full-size)
6. Confirm main scene (travel / street / professional / video)`,

    heads: `[Ball Head Question Flow] Ask ONE question at a time in this order:
1. Ask if head type is decided (ball head / fluid head / 3-way / gear)
2. Confirm main shooting (photo / video / both)
3. Confirm equipment weight (camera model or weight estimate)
4. Video: ask about pan/tilt smoothness and counterbalance
5. Confirm setup speed priority (quick setup / precise adjustment)
6. Confirm tripod compatibility (Manfrotto / other brand / not yet purchased)`,

    monopods: `[Monopod Question Flow] Ask ONE question at a time in this order:
1. Confirm main use (sports & news / video & run-and-gun / hiking / wildlife & telephoto)
2. Confirm equipment weight (camera model or weight estimate)
3. Confirm head needed (monopod only / with head / already have one)
4. Ask if self-standing feature is needed
5. Confirm lock type preference (lever / twist)
6. Confirm material (carbon / aluminum)`,

    lighting: `[Lighting Stand Question Flow] Ask ONE question at a time in this order:
1. Confirm main use (portrait / video & YouTube / product / outdoor location)
2. Confirm light source type (strobe / LED / ring light / large monoblock)
3. Confirm if stand is needed (need stand / already have / accessories only)
4. Confirm location (studio / home small space / outdoor / desktop)
5. Ask if boom arm is needed
6. Ask if backdrop system is needed`
  }
};

// ── Camera weight reference ──
const CAMERA_REF = `Sony: α7IV=659g α7C=509g α6700=493g FX3=715g ZV-E1=483g
Canon: R6II=670g R5II=910g R50=375g R8=461g C70=1010g
Nikon: Z6III=760g Z8=910g Z9=1340g Zf=710g D850=1005g
Fujifilm: X-T5=557g X-H2=660g X100VI=521g GFX100SII=883g
Ricoh: GRIV=275g GRIIIx=262g
Panasonic: S5II=740g S9=431g GH7=658g
OM System: OM-1II=599g OM-5=414g`;

function buildGuidancePrompt(lang, category) {
  const flow = category && FLOWS[lang]?.[category]
    ? FLOWS[lang][category]
    : (lang === 'ja'
      ? 'まずどのカテゴリーをお探しか確認し、そのカテゴリーに合った質問をしてください。'
      : 'First confirm the product category, then ask relevant questions.');

  const langRule = lang === 'ja'
    ? '必ず日本語で回答してください。'
    : 'Always respond in English.';

  const responseExample = lang === 'ja'
    ? `{"message":"動画撮影がメインですね！次に、使用されるカメラ機種を教えていただけますか？カメラの重さによって必要な耐荷重が変わります。","options":["Sony α7","Canon R6","Nikon Z6","ビデオカメラ"]}`
    : `{"message":"Great, mainly for video! Could you tell me which camera you use? The weight determines the payload we need.","options":["Sony α7","Canon R6","Nikon Z6","Video camera"]}`;

  return `You are a friendly and knowledgeable Manfrotto product advisor.
${langRule}

CONVERSATION STYLE:
- Always acknowledge the customer's answer warmly before asking the next question
- Example: "動画撮影がメインですね！" or "Great choice for video!"
- Ask exactly ONE question at a time
- Never list multiple questions together
- Keep responses concise and natural

${flow}

CAMERA WEIGHT REFERENCE:
${CAMERA_REF}

WEIGHT RULE: Recommend payload = (camera + lens weight) × 2 minimum

RESPONSE FORMAT (strict JSON only, no text outside):
{"message":"Your warm response + next question","options":["choice1","choice2","choice3","choice4"]}

Options: 3-5 short choices matching your question. Match customer's language.

Example: ${responseExample}`;
}

function buildRecommendPrompt(lang, category, messages) {
  const productData = category ? loadMini(`${category}.json`) : null;
  const cameraData = loadMini('cameras.json');
  const summary = messages.filter(m => m.role === 'user').map(m => m.content).join(' / ');

  const langRule = lang === 'ja'
    ? '必ず日本語で回答してください。'
    : 'Always respond in English.';

  const intro = lang === 'ja'
    ? 'ご条件に合う製品をデータベースから検索し、最適な製品を推薦してください。'
    : 'Search the database for products matching the customer needs and recommend the best ones.';

  return `You are a Manfrotto product advisor. ${intro}
${langRule}

CUSTOMER NEEDS: ${summary}

CAMERA DATABASE: ${cameraData ? JSON.stringify(cameraData.cameras) : ''}

PRODUCT DATABASE (recommend ONLY from this list, never invent products):
${productData ? JSON.stringify(productData) : 'No data'}

WEIGHT SAFETY: payload_kg must be ≥ (camera + lens weight) × 2

RESPONSE FORMAT (strict JSON only):
{"type":"products","message":"${lang === 'ja' ? 'ご条件に合う製品をご提案します' : 'Here are my recommendations based on your needs'}","items":[{"name":"製品名","sku":"型番","reason":"推薦理由2〜3文"}]}

Recommend 3-5 products. Never include products not in the database.`;
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

  const recommendSignals = /以上です|それで|おすすめ|推薦|recommend|that's all|決めて|お願い|please recommend/i;
  const shouldRecommend = category &&
    userMessages.length >= 3 &&
    (userMessages.length >= 6 || recommendSignals.test(lastUserMsg));

  const systemPrompt = shouldRecommend
    ? buildRecommendPrompt(lang, category, messages)
    : buildGuidancePrompt(lang, category);

  const phase = shouldRecommend ? 'RECOMMEND' : 'GUIDE';
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
        temperature: 0.3,
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
