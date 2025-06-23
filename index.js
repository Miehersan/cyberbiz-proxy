require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.get('/api/whoami', async (req, res) => {
  const customerId = req.query.customer_id;
  if (!customerId) return res.status(400).json({ error: '請提供 customer_id' });
  try {
    const apiRes = await fetch(
      `https://app-store-api.cyberbiz.io/v2/customers/${customerId}`,
      { headers: { Authorization: `Bearer ${process.env.CYBERBIZ_TOKEN}`, Accept: 'application/json' } }
    );
    if (!apiRes.ok) {
      const msg = await apiRes.text();
      return res.status(apiRes.status).json({ error: msg });
    }
    const json = await apiRes.json();
    const tags = json.customer.tags
      ? json.customer.tags.split(',').map(t => t.trim())
      : [];
    res.json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
