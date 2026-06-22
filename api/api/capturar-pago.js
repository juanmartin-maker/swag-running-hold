export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { paymentId } = req.body;
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      body: JSON.stringify({ capture: true }),
    });
    res.status(200).json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
