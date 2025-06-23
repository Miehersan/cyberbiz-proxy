export default async function handler(req, res) {
  // --- CORS 全部放行 ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // -----------------------

  // 以下是你原本的业务逻辑……
  const customerId = req.query.customer_id;
  console.log('Customer ID =', customerId);
  if (!customerId) {
    return res.status(400).json({ error: '請提供 customer_id' });
  }
  // …HMAC 签名、呼 API、解析 tags、回传 JSON …
}
