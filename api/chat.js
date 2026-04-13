export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    // Step 1: Claude で商品を検索
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://manfrotto-advisor.vercel.app',
        'X-Title': 'Manfrotto Product Advisor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5:online',
        messages: [
          {
            role: 'system',
            content: `あなたはManfrottoの日本公式サイト専門の商品アドバイザーです。

【重要なルール】
- 必ず https://www.manfrotto.com/jp-ja/ を実際に検索して実在する商品を3点見つけること
- 商品ページのURLは必ず https://www.manfrotto.com/jp-ja/ で始まること
- 存在しない商品・URLは絶対に作らないこと
- すべて日本語で回答すること

【回答フォーマット】
余分な説明不要。以下のJSON形式のみで回答してください：
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
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

    const raw = data.choices?.[0]?.message?.content || '';

    // Step 2: JSONを抽出
    let products = [];
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) products = JSON.parse(match[0]);
    } catch (e) {
      return res.status(200).json({
        reply: `<div style="font-size:13px;line-height:1.9;white-space:pre-wrap">${raw}</div>`
      });
    }

    if (!products || products.length === 0) {
      return res.status(200).json({
        reply: `<div style="font-size:13px;line-height:1.9;white-space:pre-wrap">${raw}</div>`
      });
    }

    // Step 3: 各商品ページから画像URLを取得
    const productsWithImages = await Promise.all(products.map(async (p) => {
      try {
        const pageRes = await fetch(p.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000)
        });
        const html = await pageRes.text();

        // og:image メタタグから画像URLを取得
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
                     || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
          p.image = ogMatch[1];
        } else {
          // cdn.manfrotto.com の画像を探す
          const cdnMatch = html.match(/https:\/\/cdn\.manfrotto\.com\/media\/catalog\/product[^"'\s]+\.(jpg|png|webp)/i);
          if (cdnMatch) p.image = cdnMatch[0];
        }
      } catch (e) {
        // 画像取得失敗は無視、デフォルト画像を使用
      }
      return p;
    }));

    // Step 4: HTMLに変換
    const html = productsWithImages.map(p => {
      const imgSrc = p.image && p.image.startsWith('http') ? p.image : '/images/hero-tripod.png';
      return `
<div class="product">
  <div class="product-img-wrap">
    <img src="${imgSrc}" alt="${p.name}" onerror="this.src='/images/hero-tripod.png'">
  </div>
  <div>
    <div class="product-name">${p.name}</div>
    <div class="product-sku">${p.sku}</div>
    <div class="product-reason">${p.reason}</div>
    <a class="product-link" href="${p.url}" target="_blank">商品ページを見る →</a>
  </div>
</div>`;
    }).join('');

    res.status(200).json({ reply: html });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
