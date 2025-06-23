import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 1. 拿 customer_id
  const customerId = req.query.customer_id;
  if (!customerId) {
    res.status(400).json({ error: '請提供 customer_id' });
    return;
  }

  try {
    // 2. 呼叫 Cyberbiz API
    const apiRes = await fetch(
      `https://app-store-api.cyberbiz.io/v2/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CYBERBIZ_TOKEN}`,
          Accept: 'application/json'
        }
      }
    );
    if (!apiRes.ok) {
      const msg = await apiRes.text();
      res.status(apiRes.status).json({ error: msg });
      return;
    }
    const { customer } = await apiRes.json();

    // 3. 解析 tags
    const tags = customer.tags
      ? customer.tags.split(',').map(t => t.trim())
      : [];

    // 4. 回傳
    res.status(200).json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
