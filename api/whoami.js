import crypto from 'crypto';

// 你的 username/secret，部署到 Vercel 後在 Dashboard 裡設定為 Environment Variables
const USERNAME = process.env.CYBERBIZ_USERNAME;
const SECRET   = process.env.CYBERBIZ_SECRET;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Debug
  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  // 1. 準備 HMAC 所需的 parts
  const httpMethod    = 'GET';
  const requestPath   = `/v1/customers/${customerId}`;
  const protocol      = 'HTTP/1.1';
  const xDate         = new Date().toUTCString();  // e.g. 'Tue, 23 Jun 2025 08:00:00 GMT'
  const requestLine   = `${httpMethod} ${requestPath} ${protocol}`;
  
  // 2. 組合 sig_str，沒有 body，所以只要 x-date 與 request-line
  const sigStr = `x-date: ${xDate}\n${requestLine}`;
  
  // 3. 計算 HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(sigStr);
  const signature = hmac.digest('base64');

  // 4. 組 Authorization header
  const authorization = 
    `hmac username="${USERNAME}", algorithm="hmac-sha256", headers="x-date request-line", signature="${signature}"`;

  try {
    // 5. 呼叫官方 API
    const apiRes = await fetch(`https://api.cyberbiz.co${requestPath}`, {
      method: httpMethod,
      headers: {
        'X-Date': xDate,
        'Authorization': authorization,
        'Accept': 'application/json'
      }
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('Cyberbiz API error:', text);
      return res.status(apiRes.status).json({ error: text });
    }

    // 6. 處理回傳（v1 回的是陣列）
    const data = await apiRes.json();
    console.log('API returned:', data);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: '找不到此會員資料' });
    }
    const customer = data[0];
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map(t => t.name).filter(Boolean)
      : [];

    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
