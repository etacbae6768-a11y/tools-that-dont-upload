// Prepaid credit balance per account (2026-11-02). The balance used to be read, changed and written back in
// Workers KV by three workers (gateway, PayPal webhook, refunds). KV reads are cached for up to 60 s, so two
// changes close together could overwrite each other. The balance now lives in D1 (binding BILL, table ctr,
// key 'prepaid:<account>') and every change is one atomic SQL statement. The KV key is still written after each
// change so readers that use KV (the /api/keys/usage endpoint) keep showing the balance. Without BILL, or if D1
// fails, the old KV behaviour is used.
const K = (acct) => 'prepaid:' + acct;
const FAR = 4102444800; // 2100-01-01, the counter table's expiry column; balances do not expire
const kvGet = async (env, acct) => parseInt((await env.RATE_KV.get(K(acct))) || '0', 10) || 0;

export async function prepaidGet(env, acct) {
  if (env.BILL) {
    try {
      const r = await env.BILL.prepare('SELECT n FROM ctr WHERE k = ?1').bind(K(acct)).first();
      if (r && typeof r.n === 'number') return r.n;
    } catch (e) { /* fall back to KV */ }
  }
  return kvGet(env, acct);
}

// Adds d credits (d may be negative). The balance never goes below 0. Returns the new balance.
export async function prepaidAdd(env, acct, d) {
  if (env.BILL) {
    try {
      const seed = await kvGet(env, acct);
      const r = await env.BILL.prepare('INSERT INTO ctr (k, n, exp) VALUES (?1, max(0, ?2), ?3) ON CONFLICT(k) DO UPDATE SET n = max(0, n + ?4) RETURNING n')
        .bind(K(acct), seed + d, FAR, d).first();
      if (r && typeof r.n === 'number') { await env.RATE_KV.put(K(acct), String(r.n)); return r.n; }
    } catch (e) { /* fall back to KV */ }
  }
  const n = Math.max(0, (await kvGet(env, acct)) + d);
  await env.RATE_KV.put(K(acct), String(n));
  return n;
}

// Takes amt credits only if the balance covers them, in one statement. Returns true when taken.
export async function prepaidTake(env, acct, amt) {
  if (!(amt > 0)) return true;
  if (env.BILL) {
    try {
      await env.BILL.prepare('INSERT INTO ctr (k, n, exp) VALUES (?1, ?2, ?3) ON CONFLICT(k) DO NOTHING').bind(K(acct), await kvGet(env, acct), FAR).run();
      const r = await env.BILL.prepare('UPDATE ctr SET n = n - ?2 WHERE k = ?1 AND n >= ?2 RETURNING n').bind(K(acct), amt).first();
      if (!r) return false;
      await env.RATE_KV.put(K(acct), String(r.n));
      return true;
    } catch (e) { /* fall back to KV */ }
  }
  const cur = await kvGet(env, acct);
  if (cur < amt) return false;
  await env.RATE_KV.put(K(acct), String(cur - amt));
  return true;
}
