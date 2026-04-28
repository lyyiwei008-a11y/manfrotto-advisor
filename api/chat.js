import fs from 'fs';
import path from 'path';

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

  const cameraData = loadJSON('cameras.json');
  const category = detectCategory(messages);
  const productData = category ? loadJSON(`${category}.json`) : null;

  const systemPrompt = `You are a professional Manfrotto product advisor for the Japanese market.
Your goal is to have a natural conversation to understand the customer's needs, then recommend the best products.

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
Always recommend tripods/heads/monopods with payload capacity = camera+lens total weight × 2

${productData ? `PRODUCT DATABASE (ONLY recommend products from this list):
${JSON.stringify(productData, null, 0)}` : 'No product database loaded yet. Ask the customer what category they need.'}

RESPONSE FORMAT:
Every response MUST be a JSON object with this exact structure (no text before or after):
{
  "message": "Your conversational response here",
  "options": ["option1", "option2", "option3"]
}

RULES FOR options:
- Always provide 3-5 short, clickable options relevant to your question
- Options should be concise (under 15 characters each)
- Options should match the language of the message (Japanese or English)
- When recommending products, use empty options array: []

RULES FOR products recommendation:
When ready to recommend products, use this format instead:
{
  "type": "products",
  "message": "Based on your needs, here are my recommendations:",
  "items": [
    {"name": "製品名", "sku": "型番", "reason": "推薦理由2〜3文", "price": "希望小売価格"}
  ]
}

Only recommend 3-5 products that exist in the PRODUCT DATABASE. Never invent products.`;

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

    if (parsed) {
      res.status(200).json({ reply: parsed, category });
    } else {
      // Fallback: return raw text with no options
      res.status(200).json({ reply: { message: raw, options: [] }, category });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
