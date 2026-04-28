import fs from 'fs';
import path from 'path';

// Detect category from conversation
function detectCategory(messages) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  if (/三脚|tripod|さんきゃく|video tripod|ビデオ三脚/.test(text)) return 'tripods';
  if (/バッグ|bag|かばん|鞄|ケース|backpack/.test(text)) return 'bags';
  if (/雲台|head|うんだい|ball head|fluid head/.test(text)) return 'heads';
  if (/一脚|monopod|いっきゃく/.test(text)) return 'monopods';
  if (/照明|ライト|light|スタンド|lighting/.test(text)) return 'lighting';
  return null;
}

function loadJSON(filename) {
  try {
    const p = path.join(process.cwd(), 'public', 'data', filename);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function loadCameras() {
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'cameras.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

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

  // Load camera database always (for weight calculations)
  const cameraData = loadCameras();

  // Load product database based on detected category
  const category = detectCategory(messages);
  const productData = category ? loadJSON(`${category}.json`) : null;

  // Build system prompt
  const systemPrompt = `You are a professional Manfrotto product advisor for the Japanese market.
Your goal is to have a natural conversation to understand the customer's needs, then recommend the best products from the database.

CONVERSATION RULES:
- Ask ONE question at a time
- Be friendly and concise
- Build on previous answers — never repeat questions already answered
- After 3-5 exchanges when you have enough info, make your recommendation
- If customer mentions a specific camera model, look it up in the camera database to get its weight

LANGUAGE RULES:
- If customer writes in Japanese → respond entirely in Japanese
- If customer writes in English → respond entirely in English
- Never mix languages

CAMERA DATABASE:
${cameraData ? JSON.stringify(cameraData.cameras, null, 0) : 'Not available'}

WEIGHT SAFETY RULE:
Always recommend tripods/heads/monopods with payload capacity = camera+lens total weight × 2 (safety factor)

${productData ? `PRODUCT DATABASE (ONLY recommend products from this list — never invent products):
${JSON.stringify(productData, null, 0)}` : `No product database loaded yet. Ask the customer what category they are looking for.`}

RECOMMENDATION FORMAT:
When ready to recommend, output ONLY this JSON (no text before or after, no markdown):
{"type":"products","items":[{"name":"製品名","sku":"型番","reason":"推薦理由2〜3文","price":"希望小売価格（円）"}]}

Recommend 3 to 5 products maximum. Only use products that exist in the PRODUCT DATABASE above.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://manfrotto-advisor.vercel.app',
        'X-Title': 'Manfrotto Product Advisor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const reply = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ reply, category });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
