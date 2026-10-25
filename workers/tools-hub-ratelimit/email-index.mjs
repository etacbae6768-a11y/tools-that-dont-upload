// Email lookup index for API keys (KEYS_KV "email:<id>" -> "kh:<keyhash>").
// With the Workers secret EMAIL_HASH_KEY the index key and the stored key record carry only
// an HMAC-SHA256 of the normalized address ("e1." + hex). Without the secret the legacy
// plaintext layout is kept exactly as before, so a missing secret never breaks issuance or billing.
// The same secret must be bound to every Worker that reads or writes the index
// (tools-hub-keys, tools-hub-ratelimit, tools-hub-webhook).
const enc = new TextEncoder();
const keyCache = new Map();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const normEmail = (e) => String(e || '').trim().toLowerCase();

async function hmacKey(secret) {
  let k = keyCache.get(secret);
  if (!k) {
    k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keyCache.set(secret, k);
  }
  return k;
}

export async function emailId(env, email) {
  const secret = env && env.EMAIL_HASH_KEY;
  const e = normEmail(email);
  if (!secret || !e) return null;
  return 'e1.' + hex(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode('ttdu-email-v1\n' + e)));
}

// Returns the index value (for example "kh:<hash>") or null. Reads the HMAC index first, then the
// legacy plaintext index; a legacy entry is moved to the HMAC index when the secret is configured.
export async function findEmailRef(env, email) {
  const e = normEmail(email);
  if (!e) return null;
  const id = await emailId(env, e);
  if (id) {
    const v = await env.KEYS_KV.get('email:' + id);
    if (v) return v;
  }
  const legacy = await env.KEYS_KV.get('email:' + e);
  if (legacy && id) {
    await env.KEYS_KV.put('email:' + id, legacy);
    await env.KEYS_KV.delete('email:' + e);
  }
  return legacy;
}

// Writes the index entry and returns the fields to store in the key record.
export async function putEmailRef(env, email, ref) {
  const e = normEmail(email);
  const id = await emailId(env, e);
  await env.KEYS_KV.put('email:' + (id || e), ref);
  return id ? { emailId: id } : { email: e };
}

// Removes index entries that still point at this key record (both layouts).
export async function deleteEmailRef(env, rec, ref) {
  const ids = new Set();
  if (rec && rec.emailId) ids.add(rec.emailId);
  if (rec && rec.email) {
    ids.add(normEmail(rec.email));
    const id = await emailId(env, rec.email);
    if (id) ids.add(id);
  }
  for (const id of ids) {
    const cur = await env.KEYS_KV.get('email:' + id);
    if (cur === ref) await env.KEYS_KV.delete('email:' + id);
  }
}

// Replaces a plaintext "email" field in a key record with "emailId" and moves its index entry.
// Returns true when the record object changed (the caller writes it back).
export async function migrateRecord(env, rec, ref) {
  if (!rec || !rec.email) return false;
  const id = await emailId(env, rec.email);
  if (!id) return false;
  const e = normEmail(rec.email);
  const curNew = await env.KEYS_KV.get('email:' + id);
  const curOld = await env.KEYS_KV.get('email:' + e);
  if (!curNew && (curOld === ref || curOld === null)) await env.KEYS_KV.put('email:' + id, ref);
  if (curOld === ref) await env.KEYS_KV.delete('email:' + e);
  rec.emailId = id;
  delete rec.email;
  return true;
}
