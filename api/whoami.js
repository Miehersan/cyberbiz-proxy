// api/whoami.js
require('dotenv').config();
const crypto = require('crypto');
const fetch = global.fetch || require('node-fetch');  // Node18+ 内建 fetch

module.exports = async (req, res) => {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 取 customer_id
  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }

  // HMAC 认证用到的 username/secret
  const USERNAME = process.env.CYBERBIZ_USERNAME;
  const SECRET   = process.env.CYBERBIZ_SECRET;

  // 1. 准备签名字符串
  const httpMethod  = 'GET';
  const requestPath = `/v1/customers/${customerId}`;
  const protocol    = 'HTTP/1.1';
  const xDate       = new Date().toUTCString();  // e.g. "Tue, 23 Jun 2025 08:00:00 GMT"
  const sigStr      = `x-date: ${xDate}\n${httpMethod} ${requestPath} ${protocol}`;

  // 2. 计算 HMAC-SHA256 signature
  const hmac      = crypto.createHmac('sha256', SECRET).update(sigStr).digest('base64');
  const authorization = 
    `hmac username="${USERNAME}", algorithm="hmac-sha256", headers="x-date request-line", signature="${hmac}"`;

  // Debug 打印
  console.log('sigStr =', sigStr);
  console.log('Authorization header =', authorization);

  try {
    // 3. 发请求到 Cyberbiz v1 API
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

    // 4. 解析回传（v1 返回的是数组）
    const data = await apiRes.json();
    console.log('API returned:', data);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: '找不到此會員資料' });
    }

    const customer = data[0];
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map(t => t.name).filter(Boolean)
      : [];

    // 5. 回传 tags
    return res.status(200).json({ tags });

  } catch (err) {
    console.error('whoami handler error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤' });
  }
};
