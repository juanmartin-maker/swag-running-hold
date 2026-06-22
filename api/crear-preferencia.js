export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  const { monto, nombre, email, dni, regId, eventoNombre } = req.body;
  
  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{ title: eventoNombre, quantity: 1, unit_price: monto, currency_id: "ARS" }],
        payer: { name: nombre, email },
        external_reference: regId,
        back_urls: {
          success: `https://swag-running-hold.vercel.app/confirmacion?id=${regId}`,
          failure: `https://swag-running-hold.vercel.app/?error=1`,
          pending: `https://swag-running-hold.vercel.app/confirmacion?id=${regId}`,
        },
        auto_return: "approved",
        metadata: { dni, regId },
      }),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
