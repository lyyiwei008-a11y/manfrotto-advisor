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
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: `あなたはManfrottoの日本公式サイト専門の商品アドバイザーです。

【重要なルール】
- 推薦する商品は必ず Manfrotto 日本公式サイト（https://www.manfrotto.com/jp-ja/）に存在する実在の商品のみ
- 商品ページのURLは必ず https://www.manfrotto.com/jp-ja/ で始まる日本語URLを使用すること
- 商品名・説明はすべて日本語で回答すること
- 存在しない商品やURLは絶対に作らないこと

【回答フォーマット】
以下のHTML形式で3商品を回答してください。前後に説明文やMarkdownのコードブロックは不要です：

<div class="product">
  <div class="product-name">商品名（日本語）</div>
  <div class="product-sku">型番</div>
  <div class="product-reason">この商品をお勧めする理由（2〜3文、日本語）</div>
  <a class="product-link" href="https://www.manfrotto.com/jp-ja/..." target="_blank">商品ページを見る →</a>
</div>`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    const reply = data.choices?.[0]?.message?.content || 'No response received.';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
