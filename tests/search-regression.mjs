#!/usr/bin/env node
// Regression test for MCP search_tools ranking.
// Usage: node tests/search-regression.mjs [MCP_URL]
// Default MCP_URL: https://toolsthatdontupload.com/mcp
// Background: before 2026-10-12 the tokenizer split on /[^a-z0-9]+/, so Korean-only
// queries produced zero tokens and the server returned the first catalog entries
// (accept_header, aes_decrypt, ...) for any Korean query.
const URL_ = process.argv[2] || 'https://toolsthatdontupload.com/mcp';
const CASES = [
  // [query, expected tool in top 3 (null = any non-empty result)]
  ['사업자등록번호', 'kr_business_number'],
  ['개인정보 마스킹', 'ko_pii_mask'],
  ['견적서', 'kr_quote'],
  ['거래명세서', 'kr_transaction_statement'],
  ['차용증', 'kr_loan_agreement'],
  ['근로계약서', 'kr_employment_contract'],
  ['한글 금액', 'ko_amount_words'],
  ['조사 붙이기', 'ko_josa'],
  ['초성', 'ko_chosung'],
  ['PDF 병합', 'pdf_merge'],
  ['해시', null],
  ['pdf merge', 'pdf_merge'],
  ['json format', 'json_format'],
  ['dns lookup', 'dns_lookup'],
  ['base64 encode', 'base64'],
  ['sha256', null],
  ['uuid v4', null],
];
// Tools that used to fill the list for unmatched queries; they must never rank #1 for Korean queries.
const DEGENERATE = ['accept_header', 'aes_decrypt', 'aes_encrypt'];
async function search(query) {
  const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'search_tools', arguments: { query, limit: 5 } } }) });
  const j = await r.json();
  return JSON.parse(j.result.content[0].text).tools.map(t => t.name);
}
let fail = 0;
for (const [q, want] of CASES) {
  const got = await search(q);
  const ok = (want ? got.slice(0, 3).includes(want) : got.length > 0) && !(/[\u3131-\uD79D]/.test(q) && DEGENERATE.includes(got[0]));
  if (!ok) fail++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + JSON.stringify(q) + ' -> ' + got.slice(0, 3).join(', '));
}
const none = await search('완전무관한단어xyz');
const noneOk = none.length === 0; if (!noneOk) fail++;
console.log((noneOk ? 'PASS' : 'FAIL') + '  unmatched query returns empty list -> ' + JSON.stringify(none));
console.log(fail ? `\n${fail} failure(s)` : '\nall passed');
process.exit(fail ? 1 : 0);
