// server/paddle.js
import crypto from 'crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

/**
 * DynamoDB Adapter
 * Table schema example:
 *   PK (email as string) | subscriptionStatus | subscriptionId | priceId | lastPaymentAt | updatedAt
 */
export function createDbAdapter({ tableName, region }) {
  const client = new DynamoDBClient({ region });

  async function updateUserSubscriptionByEmail(email, fields) {
    if (!email) return;

    const item = {
      email: { S: email },
      updatedAt: { S: new Date().toISOString() },
    };

    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined)
        item[k] = typeof v === 'string' ? { S: v } : { S: String(v) };
    }

    await client.send(new PutItemCommand({ TableName: tableName, Item: item }));
  }

  return { updateUserSubscriptionByEmail };
}

/** Verify HMAC Signature */
function verifySignature(rawBuffer, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.trim().split('='))
  );
  const sig = parts.h1;
  const ts = Number(parts.ts || 0);

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 5 * 60) return false;

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBuffer)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(sig, 'hex')
    );
  } catch {
    return false;
  }
}

/** Paddle Webhook Handler */
export function createPaddleRouter({ dbAdapter, webhookSecret }) {
  return async function paddleHandler(req, res) {
    try {
      const sig = req.header('Paddle-Signature');
      const raw = req.body;

      if (!verifySignature(raw, sig, webhookSecret))
        return res.status(400).send('Invalid signature');

      const evt = JSON.parse(raw.toString('utf8'));
      const type = evt.event_type;
      console.log(`[Paddle] Received ${type}`);

      switch (type) {
        case 'subscription.created': {
          const sub = evt.data;
          await dbAdapter.updateUserSubscriptionByEmail(sub.customer?.email, {
            subscriptionStatus: 'active',
            subscriptionId: sub.id,
            priceId: sub.items?.[0]?.price?.id,
          });
          break;
        }
        case 'payment.succeeded': {
          const p = evt.data;
          await dbAdapter.updateUserSubscriptionByEmail(p.customer?.email, {
            lastPaymentAt: new Date(p.created_at || Date.now()).toISOString(),
          });
          break;
        }
        case 'subscription.canceled': {
          const sub = evt.data;
          await dbAdapter.updateUserSubscriptionByEmail(sub.customer?.email, {
            subscriptionStatus: 'canceled',
          });
          break;
        }
        default:
          break;
      }

      res.status(200).send('ok');
    } catch (e) {
      console.error('[Paddle Webhook] Error:', e);
      res.status(500).send('server error');
    }
  };
}
