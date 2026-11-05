// --- ttdu safe outbound fetch (manual redirects, per-hop validation) ---
const __ttduOrigFetch = globalThis.fetch.bind(globalThis);
function __ttduBadHost(h){h=(h||'').toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');if(!h)return 'empty host';if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.lan')||h.endsWith('.home.arpa'))return 'local hostname';if(h.includes(':'))return 'IP literal not allowed';if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h))return 'IP literal not allowed';if(/^(0x[0-9a-f]+|\d+)$/i.test(h))return 'IP literal not allowed';if(!h.includes('.'))return 'single-label host not allowed';return null;}
function __ttduCheckUrl(u){if(u.protocol!=='http:'&&u.protocol!=='https:')return 'only http/https allowed';if(u.port&&u.port!=='80'&&u.port!=='443')return 'only ports 80/443 allowed';if(u.username||u.password)return 'credentials in url not allowed';return __ttduBadHost(u.hostname);}
const __TTDU_SENSITIVE=/^(authorization|cookie|proxy-authorization|x-api-key|x-internal-token|x-client-ip)$/i;
async function __ttduSafeFetch(input,init){
  if(typeof input!=='string'&&!(input instanceof URL))return __ttduOrigFetch(input,init);
  init=Object.assign({},init||{});const wantManual=init.redirect==='manual';const MAX=5;
  let url=new URL(String(input));let method=(init.method||'GET').toUpperCase();let body=init.body;
  let headers=new Headers(init.headers||{});for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);
  for(let hop=0;;hop++){
    const bad=__ttduCheckUrl(url);if(bad)throw new Error((hop?'Redirect target rejected: ':'Target rejected: ')+bad);
    const r=await __ttduOrigFetch(url.toString(),Object.assign({},init,{method,headers,body,redirect:'manual'}));
    if(wantManual||![301,302,303,307,308].includes(r.status))return r;
    const loc=r.headers.get('location');if(!loc)return r;
    if(hop+1>MAX)throw new Error('Too many redirects (max '+MAX+')');
    const next=new URL(loc,url);
    if(next.origin!==url.origin){for(const k of [...headers.keys()])if(__TTDU_SENSITIVE.test(k))headers.delete(k);}
    if(r.status===303||((r.status===301||r.status===302)&&method==='POST')){method='GET';body=undefined;headers.delete('content-type');headers.delete('content-length');}
    url=next;
  }
}
const fetch=__ttduSafeFetch;
// --- end safe fetch ---
// tools-hub-expanded-v2: 23 new API endpoints
// Deployed via Zone Routes on toolsthatdontupload.com

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

async function getBody(request) {
  try { return await request.json(); } catch { return {}; }
}

// ===== TEXT ENDPOINTS =====

function textTruncate(body) {
  const { text, maxLength = 100, boundary = 'word', suffix = '...' } = body;
  if (!text) return err('text required');
  if (text.length <= maxLength) return json({ result: text, truncated: false });
  let cut = text.substring(0, maxLength - suffix.length);
  if (boundary === 'sentence') {
    const lastSentence = cut.lastIndexOf('. ');
    if (lastSentence > maxLength * 0.3) cut = cut.substring(0, lastSentence + 1);
  } else if (boundary === 'word') {
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.3) cut = cut.substring(0, lastSpace);
  }
  return json({ result: cut + suffix, truncated: true, originalLength: text.length });
}

function textSlug(body) {
  const { text, separator = '-', lowercase = true } = body;
  if (!text) return err('text required');
  let slug = text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s가-힣ぁ-んァ-ン一-龥a-zA-Z0-9]/g, '')
    .replace(/\s+/g, separator)
    .replace(new RegExp(`\\${separator}+`, 'g'), separator)
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), '');
  if (lowercase) slug = slug.toLowerCase();
  return json({ slug });
}

function textStats(body) {
  const { text } = body;
  if (!text) return err('text required');
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSylPerWord = words.length ? syllables / words.length : 0;
  const avgWordsPerSent = sentences.length ? words.length / sentences.length : 0;
  const flesch = 206.835 - 1.015 * avgWordsPerSent - 84.6 * avgSylPerWord;
  const gradeLevel = 0.39 * avgWordsPerSent + 11.8 * avgSylPerWord - 15.59;
  const charFreq = {};
  for (const c of text.toLowerCase()) { if (/[a-z]/.test(c)) charFreq[c] = (charFreq[c] || 0) + 1; }
  return json({
    words: words.length, sentences: sentences.length, syllables,
    fleschReadingEase: Math.round(flesch * 10) / 10,
    fleschKincaidGrade: Math.round(Math.max(0, gradeLevel) * 10) / 10,
    avgWordsPerSentence: Math.round(avgWordsPerSent * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSylPerWord * 10) / 10,
    characterFrequency: Object.fromEntries(Object.entries(charFreq).sort((a, b) => b[1] - a[1]).slice(0, 10))
  });
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function markdownToHtml(body) {
  const { markdown } = body;
  if (!markdown) return err('markdown required');
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
    .replace(/\`(.+?)\`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>');
  return json({ html });
}

// ===== DATA ENDPOINTS =====

function jsonFlatten(body) {
  const { data, separator = '.' } = body;
  if (!data || typeof data !== 'object') return err('data (object) required');
  const result = {};
  function flatten(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? prefix + separator + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key);
      else result[key] = v;
    }
  }
  flatten(data, '');
  return json({ result });
}

function jsonUnflatten(body) {
  const { data, separator = '.' } = body;
  if (!data || typeof data !== 'object') return err('data (object) required');
  const result = {};
  for (const [k, v] of Object.entries(data)) {
    const keys = k.split(separator);
    let cur = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = v;
  }
  return json({ result });
}

function jsonPath(body) {
  const { data, path } = body;
  if (!data) return err('data required');
  if (!path) return err('path required (e.g. "$.store.book[0].title")');
  try {
    const parts = path.replace(/^\$\.?/, '').split('.').filter(Boolean);
    let cur = data;
    for (const p of parts) {
      const arrMatch = p.match(/^(\w+)\[(\d+)\]$/);
      if (arrMatch) { cur = cur[arrMatch[1]][parseInt(arrMatch[2])]; }
      else { cur = cur[p]; }
      if (cur === undefined) return json({ result: null, found: false });
    }
    return json({ result: cur, found: true });
  } catch(e) { return err('Invalid path: ' + e.message); }
}

function jsonMerge(body) {
  const { objects } = body;
  if (!Array.isArray(objects) || objects.length < 2) return err('objects (array of 2+ objects) required');
  function deepMerge(target, source) {
    const result = { ...target };
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && result[k] && typeof result[k] === 'object') {
        result[k] = deepMerge(result[k], v);
      } else { result[k] = v; }
    }
    return result;
  }
  let merged = objects[0];
  for (let i = 1; i < objects.length; i++) merged = deepMerge(merged, objects[i]);
  return json({ result: merged });
}

// ===== SECURITY ENDPOINTS =====

async function otpGenerate(body) {
  const { issuer = 'ToolsHub', account = 'user@example.com', digits = 6, period = 30 } = body;
  const secret = new Uint8Array(20);
  crypto.getRandomValues(secret);
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secretB32 = '';
  let bits = 0, value = 0;
  for (const byte of secret) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { bits -= 5; secretB32 += base32Chars[(value >> bits) & 31]; }
  }
  if (bits > 0) secretB32 += base32Chars[(value << (5 - bits)) & 31];
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=${digits}&period=${period}`;
  return json({ secret: secretB32, uri, issuer, account, digits, period });
}

async function otpVerify(body) {
  const { secret, code, digits = 6, period = 30, window = 1 } = body;
  if (!secret || !code) return err('secret and code required');
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits2 = 0, value2 = 0;
  const bytes2 = [];
  for (const c of secret.toUpperCase().replace(/=+$/, '')) {
    const idx = base32Chars.indexOf(c);
    if (idx === -1) continue;
    value2 = (value2 << 5) | idx; bits2 += 5;
    if (bits2 >= 8) { bits2 -= 8; bytes2.push((value2 >> bits2) & 0xff); }
  }
  const keyData = new Uint8Array(bytes2);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  for (let i = -window; i <= window; i++) {
    const counter = Math.floor((now / period) + i);
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint32(4, counter);
    const sig = await crypto.subtle.sign('HMAC', key, buf);
    const hmac = new Uint8Array(sig);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const otp = ((hmac[offset] & 0x7f) << 24 | hmac[offset+1] << 16 | hmac[offset+2] << 8 | hmac[offset+3]) % Math.pow(10, digits);
    if (otp.toString().padStart(digits, '0') === code.padStart(digits, '0')) {
      return json({ valid: true, drift: i });
    }
  }
  return json({ valid: false });
}

function cspParse(body) {
  const { csp } = body;
  if (!csp) return err('csp (Content-Security-Policy string) required');
  const directives = {};
  const warnings = [];
  for (const part of csp.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...values] = trimmed.split(/\s+/);
    directives[name] = values;
    if (name === 'script-src' && values.includes("'unsafe-inline'")) warnings.push("script-src has 'unsafe-inline' - XSS risk");
    if (name === 'script-src' && values.includes("'unsafe-eval'")) warnings.push("script-src has 'unsafe-eval' - code injection risk");
    if (name === 'default-src' && values.includes('*')) warnings.push("default-src allows all origins");
  }
  if (!directives['default-src'] && !directives['script-src']) warnings.push("No default-src or script-src directive");
  return json({ directives, directiveCount: Object.keys(directives).length, warnings });
}

// ===== CODE ENDPOINTS =====

function sqlFormat(body) {
  const { sql, indent = 2 } = body;
  if (!sql) return err('sql required');
  const sp = ' '.repeat(indent);
  let formatted = sql
    .replace(/\bSELECT\b/gi, '\nSELECT')
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bAND\b/gi, '\n' + sp + 'AND')
    .replace(/\bOR\b/gi, '\n' + sp + 'OR')
    .replace(/\bJOIN\b/gi, '\nJOIN')
    .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
    .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
    .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
    .replace(/\bON\b/gi, '\n' + sp + 'ON')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bHAVING\b/gi, '\nHAVING')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .replace(/\bINSERT INTO\b/gi, '\nINSERT INTO')
    .replace(/\bVALUES\b/gi, '\nVALUES')
    .replace(/\bUPDATE\b/gi, '\nUPDATE')
    .replace(/\bSET\b/gi, '\n' + sp + 'SET')
    .replace(/\bDELETE\b/gi, '\nDELETE')
    .replace(/,\s*/g, ',\n' + sp)
    .trim();
  return json({ formatted });
}

function jsonToTypescript(body) {
  const { data, name = 'Root' } = body;
  if (!data) return err('data (JSON object) required');
  const interfaces = [];
  function toInterface(obj, iName) {
    const lines = [`interface ${iName} {`];
    for (const [k, v] of Object.entries(obj)) {
      const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      if (v === null) { lines.push(`  ${safe}: null;`); }
      else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(`  ${safe}: any[];`);
        else if (typeof v[0] === 'object' && v[0] !== null) {
          const subName = iName + k.charAt(0).toUpperCase() + k.slice(1) + 'Item';
          toInterface(v[0], subName);
          lines.push(`  ${safe}: ${subName}[];`);
        } else lines.push(`  ${safe}: ${typeof v[0]}[];`);
      } else if (typeof v === 'object') {
        const subName = iName + k.charAt(0).toUpperCase() + k.slice(1);
        toInterface(v, subName);
        lines.push(`  ${safe}: ${subName};`);
      } else lines.push(`  ${safe}: ${typeof v};`);
    }
    lines.push('}');
    interfaces.push(lines.join('\n'));
  }
  toInterface(data, name);
  return json({ typescript: interfaces.reverse().join('\n\n') });
}

function htmlEntities(body) {
  const { text, mode = 'encode' } = body;
  if (!text) return err('text required');
  if (mode === 'encode') {
    const encoded = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    return json({ result: encoded });
  } else {
    const decoded = text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(\d+);/g, (m,n) => String.fromCharCode(n));
    return json({ result: decoded });
  }
}

// ===== UTILITY ENDPOINTS =====

function ibanValidate(body) {
  const { iban } = body;
  if (!iban) return err('iban required');
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return json({ valid: false, error: 'Invalid IBAN format' });
  const country = clean.substring(0, 2);
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  let numStr = '';
  for (const c of rearranged) { numStr += /[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c; }
  let remainder = 0n;
  for (let i = 0; i < numStr.length; i += 7) {
    remainder = BigInt(remainder.toString() + numStr.substring(i, i + 7)) % 97n;
  }
  return json({ valid: remainder === 1n, country, bban: clean.substring(4), formattedIban: clean.match(/.{1,4}/g).join(' ') });
}

function creditCardValidate(body) {
  const { number } = body;
  if (!number) return err('number required');
  const clean = number.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(clean)) return json({ valid: false, error: 'Invalid card number format' });
  let sum = 0;
  let double = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let d = parseInt(clean[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d; double = !double;
  }
  const valid = sum % 10 === 0;
  let issuer = 'Unknown';
  if (/^4/.test(clean)) issuer = 'Visa';
  else if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) issuer = 'Mastercard';
  else if (/^3[47]/.test(clean)) issuer = 'American Express';
  else if (/^3(?:0[0-5]|[68])/.test(clean)) issuer = 'Diners Club';
  else if (/^6(?:011|5)/.test(clean)) issuer = 'Discover';
  else if (/^35/.test(clean)) issuer = 'JCB';
  else if (/^62/.test(clean)) issuer = 'UnionPay';
  return json({ valid, issuer, lastFour: clean.slice(-4), length: clean.length });
}

function crontabNext(body) {
  const { cron, count = 5 } = body;
  if (!cron) return err('cron expression required');
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return err('cron must have 5 fields (min hour dom mon dow)');
  const [minF, hourF, domF, monF, dowF] = parts;
  const results = [];
  let d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  
  function matches(val, field, min, max) {
    if (field === '*') return true;
    const expanded = [];
    for (const p of field.split(',')) {
      if (p.includes('/')) {
        const [range, step] = p.split('/');
        const s = parseInt(step);
        const start = range === '*' ? min : parseInt(range);
        for (let i = start; i <= max; i += s) expanded.push(i);
      } else if (p.includes('-')) {
        const [a, b] = p.split('-').map(Number);
        for (let i = a; i <= b; i++) expanded.push(i);
      } else { expanded.push(parseInt(p)); }
    }
    return expanded.includes(val);
  }
  
  for (let iter = 0; iter < 525600 && results.length < Math.min(count, 20); iter++) {
    if (matches(d.getMinutes(), minF, 0, 59) &&
        matches(d.getHours(), hourF, 0, 23) &&
        matches(d.getDate(), domF, 1, 31) &&
        matches(d.getMonth() + 1, monF, 1, 12) &&
        matches(d.getDay(), dowF, 0, 6)) {
      results.push(d.toISOString());
    }
    d = new Date(d.getTime() + 60000);
  }
  return json({ cron, next: results });
}

function cidrCalc(body) {
  const { cidr } = body;
  if (!cidr) return err('cidr required (e.g. "192.168.1.0/24")');
  const match = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match) return err('Invalid CIDR format');
  const ip = match[1].split('.').map(Number);
  const prefix = parseInt(match[2]);
  if (prefix < 0 || prefix > 32) return err('Prefix must be 0-32');
  const ipNum = (ip[0] << 24 | ip[1] << 16 | ip[2] << 8 | ip[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const first = prefix >= 31 ? network : (network + 1) >>> 0;
  const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.pow(2, 32 - prefix) - 2;
  const toIP = n => [(n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255].join('.');
  return json({
    network: toIP(network), broadcast: toIP(broadcast),
    firstHost: toIP(first), lastHost: toIP(last),
    netmask: toIP(mask), hosts, prefix,
    wildcard: toIP((~mask) >>> 0)
  });
}

// ===== WEB ENDPOINTS =====

function structuredDataValidate(body) {
  const { jsonld } = body;
  if (!jsonld) return err('jsonld (JSON-LD object or string) required');
  let parsed;
  try { parsed = typeof jsonld === 'string' ? JSON.parse(jsonld) : jsonld; }
  catch(e) { return err('Invalid JSON: ' + e.message); }
  const errors = [];
  const warnings = [];
  if (!parsed['@context']) errors.push('Missing @context');
  else if (parsed['@context'] !== 'https://schema.org' && parsed['@context'] !== 'http://schema.org')
    warnings.push('@context is not schema.org');
  if (!parsed['@type']) errors.push('Missing @type');
  if (parsed['@type'] === 'Article' || parsed['@type'] === 'NewsArticle') {
    if (!parsed.headline) errors.push('Article missing headline');
    if (!parsed.author) warnings.push('Article missing author');
    if (!parsed.datePublished) warnings.push('Article missing datePublished');
  }
  if (parsed['@type'] === 'FAQPage' && parsed.mainEntity) {
    if (!Array.isArray(parsed.mainEntity)) errors.push('FAQPage mainEntity should be array');
    else {
      parsed.mainEntity.forEach((q, i) => {
        if (q['@type'] !== 'Question') errors.push(`FAQ item ${i}: @type should be Question`);
        if (!q.acceptedAnswer) errors.push(`FAQ item ${i}: missing acceptedAnswer`);
      });
    }
  }
  return json({ valid: errors.length === 0, errors, warnings, type: parsed['@type'], context: parsed['@context'] });
}

async function openGraph(body) {
  const { url } = body;
  if (!url) return err('url required');
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'ToolsHubBot/1.0' } });
    const html = await resp.text();
    const og = {};
    const tc = {};
    const metaRegex = /<meta[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*?)["'][^>]*\/?>/gi;
    const metaRegex2 = /<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']([^"']+)["'][^>]*\/?>/gi;
    let m3;
    while ((m3 = metaRegex.exec(html)) !== null) {
      if (m3[1].startsWith('og:')) og[m3[1].replace('og:', '')] = m3[2];
      if (m3[1].startsWith('twitter:')) tc[m3[1].replace('twitter:', '')] = m3[2];
    }
    while ((m3 = metaRegex2.exec(html)) !== null) {
      if (m3[2].startsWith('og:')) og[m3[2].replace('og:', '')] = m3[1];
      if (m3[2].startsWith('twitter:')) tc[m3[2].replace('twitter:', '')] = m3[1];
    }
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    return json({ url, title: titleMatch?.[1] || null, openGraph: og, twitterCard: tc });
  } catch(e) { return err('Failed to fetch URL: ' + e.message); }
}

async function linkCheck(body) {
  const { url, timeout = 10 } = body;
  if (!url) return err('url required');
  try {
    const start = Date.now();
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const elapsed = Date.now() - start;
    return json({
      url, reachable: true, status: resp.status, statusText: resp.statusText,
      responseTime: elapsed, contentType: resp.headers.get('content-type'),
      server: resp.headers.get('server'), redirected: resp.redirected,
      finalUrl: resp.url
    });
  } catch(e) {
    return json({ url, reachable: false, error: e.message });
  }
}


// ===== ADDITIONAL ENDPOINTS =====

function robotsValidate(body) {
  const { content } = body;
  if (!content) return err('content (robots.txt content) required');
  const lines = content.split('\n');
  const rules = [];
  const warnings = [];
  let currentAgent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const match = line.match(/^(User-agent|Disallow|Allow|Sitemap|Crawl-delay):\s*(.*)/i);
    if (!match) {
      warnings.push(`Line ${i+1}: Unknown directive "${line}"`);
      continue;
    }
    
    const [, directive, value] = match;
    const dir = directive.toLowerCase();
    
    if (dir === 'user-agent') {
      currentAgent = value.trim() || '*';
      rules.push({ agent: currentAgent, rules: [] });
    } else if (dir === 'sitemap') {
      rules.push({ type: 'sitemap', url: value.trim() });
    } else if (dir === 'crawl-delay') {
      if (currentAgent === null) warnings.push(`Line ${i+1}: Crawl-delay before User-agent`);
      const delay = parseFloat(value);
      if (isNaN(delay)) warnings.push(`Line ${i+1}: Invalid crawl-delay value`);
    } else {
      if (currentAgent === null) warnings.push(`Line ${i+1}: ${directive} before User-agent`);
      else rules[rules.length - 1]?.rules?.push({ type: dir, path: value.trim() });
    }
  }
  
  const agents = rules.filter(r => r.agent).map(r => r.agent);
  const sitemaps = rules.filter(r => r.type === 'sitemap').map(r => r.url);
  
  return json({
    valid: warnings.length === 0,
    agents,
    sitemaps,
    ruleCount: rules.filter(r => r.rules).reduce((s, r) => s + r.rules.length, 0),
    warnings,
    parsed: rules
  });
}

function mimeLookup(body) {
  const { extension, filename } = body;
  const ext = (extension || (filename && filename.split('.').pop()) || '').toLowerCase().replace(/^\./, '');
  if (!ext) return err('extension or filename required');
  
  const mimeTypes = {
    // Documents
    pdf:'application/pdf', doc:'application/msword',
    docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:'application/vnd.ms-excel',
    xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt:'application/vnd.ms-powerpoint',
    pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt:'application/vnd.oasis.opendocument.text',
    // Images
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif',
    webp:'image/webp', svg:'image/svg+xml', ico:'image/x-icon', bmp:'image/bmp',
    tiff:'image/tiff', avif:'image/avif', heic:'image/heic', heif:'image/heif',
    // Audio
    mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', flac:'audio/flac',
    aac:'audio/aac', m4a:'audio/mp4', wma:'audio/x-ms-wma', opus:'audio/opus',
    // Video
    mp4:'video/mp4', webm:'video/webm', avi:'video/x-msvideo', mov:'video/quicktime',
    mkv:'video/x-matroska', flv:'video/x-flv', wmv:'video/x-ms-wmv',
    // Web
    html:'text/html', htm:'text/html', css:'text/css', js:'application/javascript',
    mjs:'application/javascript', json:'application/json', xml:'application/xml',
    csv:'text/csv', txt:'text/plain', md:'text/markdown', yaml:'text/yaml',
    yml:'text/yaml', rss:'application/rss+xml', atom:'application/atom+xml',
    // Archives
    zip:'application/zip', gz:'application/gzip', tar:'application/x-tar',
    rar:'application/vnd.rar', '7z':'application/x-7z-compressed',
    bz2:'application/x-bzip2',
    // Programming
    py:'text/x-python', rb:'text/x-ruby', java:'text/x-java-source',
    ts:'text/typescript', tsx:'text/typescript', jsx:'text/javascript',
    c:'text/x-c', cpp:'text/x-c++', h:'text/x-c', cs:'text/x-csharp',
    go:'text/x-go', rs:'text/x-rust', php:'text/x-php', swift:'text/x-swift',
    kt:'text/x-kotlin', sql:'application/sql', sh:'application/x-sh',
    // Fonts
    woff:'font/woff', woff2:'font/woff2', ttf:'font/ttf', otf:'font/otf', eot:'application/vnd.ms-fontobject',
    // Other
    wasm:'application/wasm', apk:'application/vnd.android.package-archive',
    exe:'application/vnd.microsoft.portable-executable',
    dmg:'application/x-apple-diskimage', iso:'application/x-iso9660-image',
    ics:'text/calendar', vcf:'text/vcard',
  };
  
  const mime = mimeTypes[ext] || 'application/octet-stream';
  const category = mime.split('/')[0];
  const isText = mime.startsWith('text/') || ['application/json','application/xml','application/javascript','application/sql'].includes(mime);
  
  return json({ extension: ext, mimeType: mime, category, isText, isKnown: !!mimeTypes[ext] });
}

// ===== ROUTER =====

const __ttduInner = {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    
    const url = new URL(request.url);
    const p = url.pathname;
    const body = request.method === 'POST' ? await getBody(request) : {};
    
    switch (p) {
      // Text
      case '/api/text-truncate': return textTruncate(body);
      case '/api/text-slug': return textSlug(body);
      case '/api/text-stats': return textStats(body);
      case '/api/markdown-to-html': return markdownToHtml(body);
      // Data
      case '/api/json-flatten': return jsonFlatten(body);
      case '/api/json-unflatten': return jsonUnflatten(body);
      case '/api/json-path': return jsonPath(body);
      case '/api/json-merge': return jsonMerge(body);
      // Security
      case '/api/otp-generate': return otpGenerate(body);
      case '/api/otp-verify': return otpVerify(body);
      case '/api/csp-parse': return cspParse(body);
      // Code
      case '/api/sql-format': return sqlFormat(body);
      case '/api/json-to-typescript': return jsonToTypescript(body);
      case '/api/html-entities': return htmlEntities(body);
      // Utility
      case '/api/iban-validate': return ibanValidate(body);
      case '/api/credit-card-validate': return creditCardValidate(body);
      case '/api/crontab-next': return crontabNext(body);
      case '/api/cidr-calc': return cidrCalc(body);
      // Web
      case '/api/structured-data': return structuredDataValidate(body);
      case '/api/open-graph': return openGraph(body);
      case '/api/link-check': return linkCheck(body);
      case '/api/robots-validate': return robotsValidate(body);
      case '/api/mime-lookup': return mimeLookup(body);
      default: return new Response('Not Found', { status: 404 });
    }
  }
};


const __TTDU_CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key','Access-Control-Expose-Headers':'X-Credits-Used,X-Credits-Limit,X-Credits-Cost,Retry-After,RateLimit-Limit,RateLimit-Remaining'};
function __ttduProblem(status,title,detail,extra){return new Response(JSON.stringify({type:'about:blank',title,status,detail}),{status,headers:{'Content-Type':'application/problem+json',...__TTDU_CORS,...(extra||{})}});}
const __ttduOrig={async fetch(request,env,ctx){
  const m=request.method;
  if(m==='OPTIONS')return new Response(null,{status:204,headers:{...__TTDU_CORS,'Access-Control-Max-Age':'86400'}});
  if(m!=='GET'&&m!=='POST'&&m!=='HEAD')return __ttduProblem(405,'Method Not Allowed','Use GET or POST.',{Allow:'GET, POST, OPTIONS'});
  let req=request;
  const ct=(request.headers.get('content-type')||'').toLowerCase();
  if(m==='POST'&&ct.includes('application/json')){
    const t=await request.text();
    if(t.trim()){try{JSON.parse(t);}catch(e){return __ttduProblem(400,'Bad Request','Request body is not valid JSON.');}}
    req=new Request(request,{body:t||'{}'});
  }
  let r;
  try{r=await __ttduInner.fetch(req,env,ctx);}catch(e){return __ttduProblem(400,'Bad Request','The tool could not process this input. Check field names and types against the example in /openapi.json.');}
  if(!r)return __ttduProblem(500,'Internal Error','Empty response.');
  const rct=(r.headers.get('content-type')||'').toLowerCase();
  if(r.status>=500&&rct.includes('html'))return __ttduProblem(500,'Internal Error','The tool failed on this input.');
  const out=new Response(r.body,r);
  for(const [k,v] of Object.entries(__TTDU_CORS))out.headers.set(k,v);if(!out.headers.get('X-Egress'))out.headers.set('X-Egress','none');out.headers.set('Access-Control-Expose-Headers',__TTDU_CORS['Access-Control-Expose-Headers']+',X-Egress');
  return out;
}};

/* TTDU GET-query policy for compute endpoints (S-HUB 2026-11-04). Input in a GET query string is deprecated:
 * until the sunset the response carries Deprecation / Sunset / Warning / Link headers (same format as the gateway),
 * from the sunset it is rejected with 405 and a note to send POST. One setting: __TTDU_GETQ_SUNSET
 * (or a plain-text binding GET_QUERY_SUNSET). Exempt: endpoints documented as GET. */
const __TTDU_GETQ_SINCE='2026-11-04T00:00:00Z';
const __TTDU_GETQ_SUNSET='2026-12-16T00:00:00Z';
const __TTDU_GETQ_EXEMPT=new Set(['/api/kr-holidays','/api/password-gen','/api/qr','/api/http-bin-get']);
export default{async fetch(request,env,ctx){
  let __u;try{__u=new URL(request.url);}catch(e){return __ttduOrig.fetch(request,env,ctx);}
  const __get=request.method==='GET'||request.method==='HEAD';
  if(!__get||!__u.search||__u.search==='?'||!__u.pathname.startsWith('/api/')||__TTDU_GETQ_EXEMPT.has(__u.pathname.replace(/\/+$/,'')))return __ttduOrig.fetch(request,env,ctx);
  const since=Date.parse((env&&env.GET_QUERY_SINCE)||__TTDU_GETQ_SINCE),sunset=Date.parse((env&&env.GET_QUERY_SUNSET)||__TTDU_GETQ_SUNSET);
  if(Number.isFinite(sunset)&&Date.now()>=sunset)return new Response(JSON.stringify({title:'Method Not Allowed',status:405,detail:'Send input in a POST body so it is not placed in the request URL.'}),{status:405,headers:{'Content-Type':'application/problem+json','Access-Control-Allow-Origin':'*',Allow:'POST, OPTIONS'}});
  const res=await __ttduOrig.fetch(request,env,ctx);const r=new Response(res.body,res);const day=new Date(sunset).toISOString().slice(0,10);
  r.headers.set('Deprecation','@'+Math.floor(since/1000));r.headers.set('Sunset',new Date(sunset).toUTCString());
  r.headers.set('Warning','299 - "Input in the URL query is deprecated and stops working on '+day+'. Send it as a JSON POST body."');
  r.headers.set('Link','<https://toolsthatdontupload.com/docs/#input-rules>; rel="deprecation"');
  const ex=r.headers.get('Access-Control-Expose-Headers');r.headers.set('Access-Control-Expose-Headers',(ex?ex+',':'')+'Deprecation,Sunset,Warning,Link');return r;}};
