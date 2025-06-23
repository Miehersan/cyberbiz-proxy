// api/whoami.js
import 'dotenv/config';

// Bearer Token 方式，只要在 Vercel Dashboard 設定下面這個環境變數即可
// CYBERBIZ_TOKEN = 你的 v2 Bearer Token
const TOKEN = process.env.CYBERBIZ_TOKEN;

export default async function handler(req, res) {
  // CORS 放行
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  try {
    // 呼 v2 API 拿 customer data
    const apiRes = await fetch(
      `https://app-store-api.cyberbiz.io/v2/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/json'
        }
      }
    );
    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('v2 API error:', text);
      return res.status(apiRes.status).json({ error: text });
    }

    // 解析回傳： { customer: { tags: [ { name: '…' }, … ] } }
    const { customer } = await apiRes.json();
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map(t => t.name).filter(Boolean)
      : [];

    console.log('Tags =', tags);
    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
