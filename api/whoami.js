// api/whoami.js
import 'dotenv/config';

const TOKEN = process.env.CYBERBIZ_TOKEN;

export default async function handler(req, res) {
  // CORS 放行
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // 1. 取得 customer_id
  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  try {
    // 2. 呼叫 v2 API
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
      console.error('v2 API 非 200 回應:', text);
      return res.status(apiRes.status).json({ error: text });
    }

    // 3. 解析回傳 JSON
    const data = await apiRes.json();
    console.log('v2 raw response:', data);

    // 4. 空值檢查
    if (!data.customer) {
      console.warn(`未找到 ID=${customerId} 的會員資料`);
      return res.status(404).json({ error: '找不到此會員資料' });
    }

    // 5. 取出 tags
    const tags = Array.isArray(data.customer.tags)
      ? data.customer.tags.map(t => t.name).filter(Boolean)
      : [];

    console.log('Tags =', tags);
    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler 錯誤:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
