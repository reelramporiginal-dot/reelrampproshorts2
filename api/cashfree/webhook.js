import crypto from 'node:crypto';
export const config = { api: { bodyParser: false } };

const readRaw = async (req) => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c).toString('utf8'); };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return res.status(500).end();
  const raw = await readRaw(req);
  const ts = String(req.headers['x-webhook-timestamp'] || '');
  const sig = String(req.headers['x-webhook-signature'] || '');
  const expected = crypto.createHmac('sha256', secret).update(ts + raw).digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (!sig || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'bad signature' });
  // Verified event. NEXT STAGE: store in webhook_events (unique event id) and grant entitlement server-side.
  console.log('cashfree webhook verified:', JSON.parse(raw)?.type);
  return res.status(200).json({ ok: true });
}
