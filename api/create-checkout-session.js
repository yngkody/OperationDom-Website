import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send("Missing items");
    }

    // items: [{ priceId, quantity }]
    const line_items = items.map((i) => ({
      price: i.priceId,
      quantity: Math.max(1, Math.min(99, Number(i.quantity || 1))),
    }));

    const origin =
      req.headers.origin ||
      `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/shop.html?success=true`,
      cancel_url: `${origin}/shop.html?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US"] },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err?.message || "Server error");
  }
}
