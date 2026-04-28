import fs from 'fs';
import path from 'path';

// ── Category detection ──
function detectCategory(messages) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  if (/三脚|tripod|さんきゃく|ビデオ三脚/.test(text)) return 'tripods';
  if (/バッグ|bag|かばん|鞄|ケース|backpack/.test(text)) return 'bags';
  if (/雲台|ball head|fluid head|うんだい/.test(text)) return 'heads';
  if (/一脚|monopod|いっきゃく/.test(text)) return 'monopods';
  if (/照明|ライト|lighting|スタンド/.test(text)) return 'lighting';
  return null;
}

// ── Check if ready to recommend ──
function isReadyToRecommend(messages) {
  // Need at least 3 user messages and category detected
  const userMsgs = messages.filter(m => m.role === 'user');
  return userMsgs.length >= 3;
}

// ── Load mini data ──
function loadMini(filename) {
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'mini', filename);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

// ── System prompts ──

// Phase 1: Guidance only — NO product data (very cheap)
function buildGuidancePrompt(lang) {
  return `You are a professional Manfrotto product advisor for the Japanese market.
Your goal is to understand the customer's needs through natural conversation.

CONVERSATION RULES:
- Ask ONE question at a time — never ask multiple questions at once
- Be friendly and concise
- Build on previous answers — never repeat questions already answered
- Detect the product category from the customer's message
- Ask about: category → purpose (photo/video) → equipment weight → scene → preferences
- Do NOT recommend products yet — just gather information

LANGUAGE: Match the customer's language exactly (Japanese or English)

CAMERA WEIGHT REFERENCE (use when customer mentions camera model):
Sony: α7IV=659g, α7C=509g, α6700=493g, FX3=715g
Canon: R6II=670g, R5II=910g, R50=375g, C70=1010g
Nikon: Z6III=760g, Z8=910g, Z9=1340g, D850=1005g
Fujifilm: X-T5=557g, X-H2=660g, X100VI=521g
Ricoh: GRIV=275g, GRIIIx=262g

RESPONSE FORMAT (strict JSON, no text before/after):
{"message":"Your question here","options":["option1","option2","option3"]}

Options should be short (under 12 chars), relevant to your question, in customer's language.`;
}

// Phase 2: Recommendation with product data
function buildRecommendPrompt(category, messages) {
  const productData = category ? loadMini(`${category}.json`) : null;
  const cameraData = loadMini('cameras.json');

  // Build conversation summary
  const summary = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' / ');

  return `You are a professional Manfrotto product advisor.
Based on the conversation, recommend the best products from the database below.

CUSTOMER NEEDS SUMMARY: ${summary}

WEIGHT SAFETY RULE: Recommend payload_kg ≥ (camera+lens weight) × 2

CAMERA DATABASE:
${cameraData ? JSON.stringify(cameraData.cameras) : ''}

PRODUCT DATABASE (only recommend from this list):
${productData ? JSON.stringify(productData) : 'No data available'}

LANGUAGE: Match the customer's language (Japanese or English)

RESPONSE FORMAT (strict JSON, no text before/after):
{"type":"products","message":"Intro text","items":[{"name":"製品名","sku":"型番","reason":"推薦理由2〜3文","price":"価格"}]}

Recommend 3-5 products only. Never invent products not in the database.`;
}

// ── Main handler ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const category = detectCategory(messages);
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

  // Decide phase: guidance or recommendation
  // Switch to recommendation when:
  // 1. Category detected AND
  // 2. 3+ user messages AND
  // 3. Last message contains a signal to recommend
  const recommendSignals = /以上です|それで|おすすめ|推薦|recommend|that's all|決めて|お願い/i;
  const shouldRecommend = category &&
    userMessages.length >= 3 &&
    (userMessages.length >= 5 || recommendSignals.test(lastUserMsg));

  const lang = /[^\x00-\x7F]/.test(lastUserMsg) ? 'ja' : 'en';
  const systemPrompt = shouldRecommend
    ? buildRecommendPrompt(category, messages)
    : buildGuidancePrompt(lang);

  // Cost logging
  const phase = shouldRecommend ? 'RECOMMEND' : 'GUIDE';
  const promptTokens = Math.ceil(systemPrompt.length / 4);
  console.log(`[${phase}] category:${category} userMsgs:${userMessages.length} promptTokens:~${promptTokens}`);

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
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const raw = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    // If product recommendation, enrich with price from database (no image for now)
    if (parsed && parsed.type === 'products' && parsed.items) {
      // Build a price lookup map from all mini product files
      const priceMap = {};
      const categories = ['tripods', 'bags', 'heads', 'monopods', 'lighting'];
      for (const cat of categories) {
        try {
          const d = loadMini(`${cat}.json`);
          if (!d) continue;
          const items = Array.isArray(d) ? d : [
            ...(d.photo || []),
            ...(d.video || [])
          ];
          for (const item of items) {
            if (item.sku && item.price != null) {
              priceMap[item.sku.toString().trim().toUpperCase()] = item.price;
            }
          }
        } catch {}
      }

      // Enrich each product with correct price from DB
      parsed.items = parsed.items.map(p => {
        const sku = (p.sku || '').toString().trim().toUpperCase();
        const dbPrice = priceMap[sku];
        if (dbPrice != null && !isNaN(Number(dbPrice))) {
          p.price = Number(dbPrice);
        } else {
          p.price = null;
        }
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
