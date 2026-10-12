// Deploys every folder in workers/ to Cloudflare Workers.
// Runs in GitHub Actions. Adds BUILD_COMMIT / BUILD_RUN / BUILD_BUNDLE_SHA256 as plain-text bindings
// so the live service can report which attested build it is running.
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

const root = path.resolve('workers');
const names = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
let failed = 0;
for (const name of names) {
  const dir = path.join(root, name);
  const meta = JSON.parse(await readFile(path.join(dir, 'metadata.json'), 'utf8'));
  meta.bindings = (meta.bindings || []).filter((b) => !b.name.startsWith('BUILD_'));
  meta.bindings.push(
    { type: 'plain_text', name: 'BUILD_COMMIT', text: commit },
    { type: 'plain_text', name: 'BUILD_RUN', text: run },
    { type: 'plain_text', name: 'BUILD_BUNDLE_SHA256', text: bundleSha },
  );
  const code = await readFile(path.join(dir, meta.main_module), 'utf8');
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }), 'metadata.json');
  form.append(meta.main_module, new Blob([code], { type: 'application/javascript+module' }), meta.main_module);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${name}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (json.success) console.log(`deployed ${name}`);
  else { failed++; console.error(`FAILED ${name}: ${JSON.stringify(json.errors)}`); }
}
if (failed) process.exit(1);
