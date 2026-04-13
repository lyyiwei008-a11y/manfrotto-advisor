export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

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
        model: 'perplexity/sonar',
        messages: [
          {
            role: 'system',
            content: `あなたはManfrottoの日本公式サイト専門の商品アドバイザーです。
必ずmanfrotto.com/jp-jaを検索して実在する商品を3点見つけてください。

【重要なルール】
- 実際にmanfrotto.com/jp-jaを検索すること
- 存在しない商品・URLは絶対に作らないこと
- URLは必ず https://www.manfrotto.com/jp-ja/ で始まること
- すべて日本語で回答すること

【回答フォーマット】
余分な説明は不要です。以下のJSON形式のみで回答してください：
[
  {
    "name": "商品名",
    "sku": "型番",
    "reason": "推薦理由（2〜3文）",
    "url": "https://www.manfrotto.com/jp-ja/..."
  },
  { ... },
  { ... }
]`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    const raw = data.choices?.[0]?.message?.content || '';

    // JSONを抽出してHTMLに変換
    let products = [];
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        products = JSON.parse(match[0]);
      }
    } catch (e) {
      // JSON解析失敗の場合はそのまま返す
      return res.status(200).json({ reply: `<div style="font-size:13px;line-height:1.9;white-space:pre-wrap">${raw}</div>` });
    }

    if (!products || products.length === 0) {
      return res.status(200).json({ reply: `<div style="font-size:13px;line-height:1.9;white-space:pre-wrap">${raw}</div>` });
    }

    // HTMLに変換
    const html = products.map(p => `
<div class="product">
  <div class="product-img-wrap"><img src="/images/hero-tripod.png" alt="${p.name}"></div>
  <div>
    <div class="product-name">${p.name}</div>
    <div class="product-sku">${p.sku}</div>
    <div class="product-reason">${p.reason}</div>
    <a class="product-link" href="${p.url}" target="_blank">商品ページを見る →</a>
  </div>
</div>`).join('');

    res.status(200).json({ reply: html });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
