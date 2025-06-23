export default async function handler(req, res) {
  const customerId = req.query.customer_id;
  if (!customerId) {
    res.status(400).json({ error: '請提供 customer_id' });
    return;
  }

  try {
    // 呼叫 Cyberbiz API
    const apiRes = await fetch(
      `https://app-store-api.cyberbiz.io/v1/customers?customer_id=${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CYBERBIZ_TOKEN}`,
          Accept: 'application/json',
        },
      }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      res.status(apiRes.status).json({ error: text });
      return;
    }

    // 解析回傳 JSON （陣列）
    const data = await apiRes.json();
    if (!Array.isArray(data) || data.length === 0) {
      res.status(404).json({ error: '找不到此會員資料' });
      return;
    }

    const customer = data[0];
    // customer.tags 是 [ { name: '...' }, ... ]
    const tags = Array.isArray(customer.tags)
      ? customer.tags.map((t) => t.name).filter(Boolean)
      : [];

    res.status(200).json({ tags });
  } catch (err) {
    console.error('whoami error:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}
