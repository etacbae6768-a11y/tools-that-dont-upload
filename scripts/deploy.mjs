// Deploys every folder in workers/ to Cloudflare Workers.
// Runs in GitHub Actions. Adds BUILD_COMMIT / BUILD_RUN / BUILD_BUNDLE_SHA256 as plain-text bindings
// so the live service can report which attested build it is running.
//
// 2026-10-25: uploads every module in the folder (workers are multi-module), and refuses to deploy
// a worker if metadata.json would drop a binding that is live now. Secrets are kept with
// keep_bindings: ["secret_text"]; routes are zone settings and are not touched by this script.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const commit = process.env.GITHUB_SHA || '';
const run = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : '';
const bundleSha = process.env.BUNDLE_SHA256 || '';
if (!token || !account) throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`;
const auth = { Authorization: `Bearer ${token}` };

async function liveBindingNames(name) {
  const res = await fetch(`${api}/${name}/settings`, { headers: auth });
  const json = await res.json();
  if (!json.success) throw new Error(`cannot read live settings of ${name}: ${JSON.stringify(json.errors)}`);
  return (json.result.bindings || [])
    .filter((b) => b.type !== 'secret_text' && !b.name.startsWith('BUILD_'))
    .map((b) => b.name);
}

const root = path.resolve('workers');
const names = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
let failed = 0;
for (const name of names) {
  const dir = path.join(root, name);
  const meta = JSON.parse(await readFile(path.join(dir, 'metadata.json'), 'utf8'));
  meta.bindings = (meta.bindings || []).filter((b) => !b.name.startsWith('BUILD_'));
  meta.keep_bindings = Array.from(new Set([...(meta.keep_bindings || []), 'secret_text']));

  // Binding guard: every live non-secret binding must be present in metadata.json.
  let live;
  try { live = await liveBindingNames(name); } catch (e) { failed++; console.error(`FAILED ${name}: ${e.message}`); continue; }
  const declared = new Set(meta.bindings.map((b) => b.name));
  const missing = live.filter((n) => !declared.has(n));
  if (missing.length) { failed++; console.error(`SKIPPED ${name}: metadata.json lacks live bindings ${missing.join(', ')}`); continue; }

  meta.bindings.push(
    { type: 'plain_text', name: 'BUILD_COMMIT', text: commit },
    { type: 'plain_text', name: 'BUILD_RUN', text: run },
    { type: 'plain_text', name: 'BUILD_BUNDLE_SHA256', text: bundleSha },
  );
  const files = (await readdir(dir)).filter((f) => /\.(mjs|js)$/.test(f));
  if (!files.includes(meta.main_module)) { failed++; console.error(`FAILED ${name}: main module ${meta.main_module} missing`); continue; }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }), 'metadata.json');
  for (const f of files) {
    const code = await readFile(path.join(dir, f), 'utf8');
    form.append(f, new Blob([code], { type: 'application/javascript+module' }), f);
  }
  const res = await fetch(`${api}/${name}`, { method: 'PUT', headers: auth, body: form });
  const json = await res.json();
  if (!json.success) { failed++; console.error(`FAILED ${name}: ${JSON.stringify(json.errors)}`); continue; }
  const after = await liveBindingNames(name);
  const lost = live.filter((n) => !after.includes(n));
  if (lost.length) { failed++; console.error(`BINDINGS LOST ${name}: ${lost.join(', ')}`); continue; }
  console.log(`deployed ${name} (${files.length} modules, ${after.length} non-secret bindings)`);
}
if (failed) process.exit(1);
