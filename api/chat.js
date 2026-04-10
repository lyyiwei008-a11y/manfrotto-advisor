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
            content: `You are an expert Manfrotto product advisor. When a customer describes their needs, search manfrotto.com and recommend 3 suitable products.

For each product provide:
- Product name (in the customer's language)
- SKU / model number
- Why it suits their needs (2-3 sentences)
- Direct URL from manfrotto.com

Format your response in clean HTML using this exact structure for each product:
<div class="product">
  <div class="product-name">[Product Name]</div>
  <div class="product-sku">[SKU]</div>
  <div class="product-reason">[Reason]</div>
  <a class="product-link" href="[URL]" target="_blank">View on Manfrotto.com →</a>
</div>

Only recommend real products from manfrotto.com with accurate URLs. If the user writes in Japanese, respond in Japanese. If in Chinese, respond in Chinese.`
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
