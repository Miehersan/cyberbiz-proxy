// api/whoami.js
import 'dotenv/config';
import crypto from 'crypto';

// V1 HMAC 认证所需的 username/secret，请在 Vercel Dashboard → Environment Variables 设置：
const USERNAME = process.env.CYBERBIZ_USERNAME;
const SECRET   = process.env.CYBERBIZ_SECRET;

export default async function handler(req, res) {
  // —— CORS 放行 —— 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1. 取得 customer_id
  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  // 2. 準備 HMAC 簽名字串
  const httpMethod  = 'GET';
  const requestPath = `/v1/customers/${customerId}`;
  const protocol    = 'HTTP/1.1';
  const xDate       = new Date().toUTCString();  
  const sigStr      = `x-date: ${xDate}\n${httpMethod} ${requestPath} ${protocol}`;

  // 3. 計算 HMAC-SHA256 signature
  const hmac      = crypto.createHmac('sha256', SECRET).update(sigStr).digest('base64');
  const authorization = 
    `hmac username="${USERNAME}", algorithm="hmac-sha256", headers="x-date request-line", signature="${hmac}"`;

  // Debug：在 Vercel Logs 中確認
  console.log('sigStr =', sigStr);
  console.log('Authorization =', authorization);

  try {
    // 4. 呼叫 Cyberbiz V1 API
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

    // 5. 解析回傳（v1 回傳陣列）
    const data = await apiRes.json();
    console.log('API returned:', data);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: '找不到此會員資料' });
    }

    const customer = data[0];
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map(t => t.name).filter(Boolean)
      : [];

    // 6. 將 tags 回傳給前端
    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
