const PRICE_ID_9 = 'pri_01k9we6b4x5whg5vx3jszm64dz';
const PRICE_ID_19 = 'pri_01k9we6b4x5whg5vx3jszm64dz'; // use your second plan’s ID if different

async function openCheckout(priceId) {
  try {
    console.log('🟣 Creating checkout for:', priceId);

    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId: 'TEST_USER',
        email: 'user@example.com',
      }),
    });

    const data = await response.json();
    console.log('🟢 Checkout response:', data);

    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      throw new Error(data.error || 'No checkout URL returned');
    }
  } catch (err) {
    console.error('❌ Checkout error:', err);
    alert('Failed to open checkout. Check console for details.');
  }
}

// --- Attach buttons ---
document
  .getElementById('btn-9')
  .addEventListener('click', () => openCheckout(PRICE_ID_9));
document
  .getElementById('btn-19')
  .addEventListener('click', () => openCheckout(PRICE_ID_19));
