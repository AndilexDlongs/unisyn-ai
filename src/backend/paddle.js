import fetch from 'node-fetch';

const PADDLE_API = 'https://sandbox-api.paddle.com';
const PADDLE_KEY = process.env.PADDLE_API_KEY;

export async function createTransaction(priceId, userId, email) {
  console.log('🟣 Creating Paddle checkout session for', priceId);

  const payload = {
    items: [
      {
        price_id: priceId,
        quantity: 1,
      },
    ],
    customer: {
      email: email || 'user@example.com',
    },
    custom_data: { userId: userId || 'TEST_USER' },
    success_url: 'http://localhost:8787/success',
    cancel_url: 'http://localhost:8787/pricing',
  };

  const response = await fetch(`${PADDLE_API}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PADDLE_KEY}`,
      'Paddle-Version': '1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log('🔹 Paddle API response:', JSON.stringify(data, null, 2));

  if (data.error)
    throw new Error(data.error.detail || 'Checkout session error');

  const checkoutUrl =
    data.data?.checkout_url || data.data?.checkout?.url || null;

  if (!checkoutUrl) throw new Error('No checkout URL returned by Paddle');

  console.log('✅ Checkout URL:', checkoutUrl);
  return checkoutUrl;
}

export async function handleWebhook(req, res) {
  console.log('📦 Webhook event received:', req.body);
  res.sendStatus(200);
}