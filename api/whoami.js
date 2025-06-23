import 'dotenv/config';

const TOKEN = process.env.CYBERBIZ_TOKEN;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  try {
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

    // 解析原始回傳
    const data = await apiRes.json();
    console.log('v2 raw response:', data);

    // 兼容 data.customer 與 data 自身就是 customer 兩種情境
    const customer = data.customer || data;
    if (!customer || !customer.tags) {
      console.warn(`未找到 ID=${customerId} 的會員或 tags`);
      return res.status(404).json({ error: '找不到此會員資料' });
    }

    // 取出 tags 名稱
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map(t => t.name).filter(Boolean)
      : [];

    console.log('Tags =', tags);
    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler 錯誤:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
