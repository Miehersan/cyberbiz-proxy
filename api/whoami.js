export default async function handler(req, res) {
  // 允许来自任意来源的浏览器请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 如果你页面 JS 里有自定义 headers，也可以：
  res.setHeader('Access-Control-Allow-Headers', '*');
  // 若要让浏览器先发 OPTIONS 预检，还需要：
  if (req.method === 'OPTIONS') {
    res.status(204).end();
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
