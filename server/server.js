require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || !secretKey.startsWith("sk_test_")) {
  console.error("Missing or invalid STRIPE_SECRET_KEY in server/.env (it must start with sk_test_).");
  process.exit(1);
}

const stripe = new Stripe(secretKey);
const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Donation server is running.");
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, name, email } = req.body;
    const dollars = Number(amount);

    if (!Number.isFinite(dollars) || dollars < 1 || dollars > 1000) {
      return res.status(400).json({ error: "Donation must be between $1 and $1000." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(dollars * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: "Donation to Community Music Band Organization",
      receipt_email: email || undefined,
      metadata: { donor_name: name || "Anonymous" },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4242, () => {
  console.log("Donation server running at http://localhost:4242");
});