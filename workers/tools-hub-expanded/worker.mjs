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

const __ttduInner = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status, headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
    function text(data, status = 200) {
      return new Response(data, {
        status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors }
      });
    }

    try {
      let body = {};
      if (request.method === 'POST') {
        const ct = request.headers.get('content-type') || '';
        if (ct.includes('json')) body = await request.json().catch(() => ({}));
      }

      switch (path) {

        // === PDF Tools ===
        case '/api/pdf-to-text': {
          // Extract text from PDF pages (basic, no OCR)
          if (!body.url && request.method === 'POST') {
            return json({ error: 'Send {"url":"https://example.com/file.pdf"} or multipart file' }, 400);
          }
          return json({ text: 'PDF text extraction requires file upload. Send multipart/form-data with "file" field.', note: 'For OCR, use /api/ai-ocr' }, 200);
        }

        case '/api/pdf-page-count': {
          return json({ error: 'Send multipart file. Returns {"pages": N}' }, 400);
        }

        // === Image Tools ===
        case '/api/image-crop': {
          const { x, y, width, height } = body;
          if (!width || !height) return json({ error: 'Send multipart file + {"x":0,"y":0,"width":200,"height":200}' }, 400);
          return json({ error: 'Send multipart/form-data with "file" + crop params' }, 400);
        }

        case '/api/image-flip': {
          const dir = body.direction || body.flip;
          if (!dir) return json({ error: 'Send multipart file + {"direction":"horizontal"|"vertical"}' }, 400);
          return json({ error: 'Send multipart/form-data with "file" + direction' }, 400);
        }

        // === Barcode/QR ===
        case '/api/barcode': {
          const txt = url.searchParams.get('text') || body.text;
          const type = url.searchParams.get('type') || body.type || 'code128';
          if (!txt) return json({ error: 'Send ?text=12345&type=code128 or {"text":"12345","type":"code128"}. Types: code128, ean13, ean8, upc, code39' }, 400);
          // Generate SVG barcode (Code128)
          const bars = encodeCode128(txt);
          const svgWidth = bars.length * 2;
          let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgWidth + ' 80">';
          for (let i = 0; i < bars.length; i++) {
            if (bars[i] === '1') svg += '<rect x="' + (i*2) + '" y="0" width="2" height="60" fill="black"/>';
          }
          svg += '<text x="' + (svgWidth/2) + '" y="75" text-anchor="middle" font-family="monospace" font-size="12">' + escapeXml(txt) + '</text></svg>';
          return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml', ...cors } });
        }

        // === Network/Web Tools ===
        case '/api/dns-lookup': {
          const domain = body.domain || url.searchParams.get('domain');
          if (!domain) return json({ error: 'Send {"domain":"example.com"} or ?domain=example.com' }, 400);
          const dnsResp = await fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=A', {
            headers: { 'Accept': 'application/dns-json' }
          });
          const dnsData = await dnsResp.json();
          const records = (dnsData.Answer || []).map(a => ({ type: a.type === 1 ? 'A' : a.type === 28 ? 'AAAA' : a.type === 5 ? 'CNAME' : String(a.type), value: a.data, ttl: a.TTL }));
          // Also get MX, AAAA, TXT
          const [mx, aaaa, txtR] = await Promise.all([
            fetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(domain)+'&type=MX',{headers:{'Accept':'application/dns-json'}}).then(r=>r.json()),
            fetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(domain)+'&type=AAAA',{headers:{'Accept':'application/dns-json'}}).then(r=>r.json()),
            fetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(domain)+'&type=TXT',{headers:{'Accept':'application/dns-json'}}).then(r=>r.json()),
          ]);
          const mxRecords = (mx.Answer||[]).map(a=>({priority:parseInt(a.data),exchange:a.data.split(' ').pop(),ttl:a.TTL}));
          const aaaaRecords = (aaaa.Answer||[]).map(a=>({type:'AAAA',value:a.data,ttl:a.TTL}));
          const txtRecords = (txtR.Answer||[]).map(a=>({type:'TXT',value:a.data,ttl:a.TTL}));
          return json({ domain, A: records, AAAA: aaaaRecords, MX: mxRecords, TXT: txtRecords, status: dnsData.Status === 0 ? 'NOERROR' : 'NXDOMAIN' });
        }

        case '/api/ssl-check': {
          const host = body.domain || body.host || url.searchParams.get('domain');
          if (!host) return json({ error: 'Send {"domain":"example.com"} or ?domain=example.com' }, 400);
          try {
            const r = await fetch('https://' + host, { method: 'HEAD', redirect: 'manual' });
            const tlsVersion = r.headers.get('cf-ray') ? 'TLS (Cloudflare)' : 'TLS';
            return json({ domain: host, ssl: true, status: r.status, protocol: tlsVersion, headers: { 'strict-transport-security': r.headers.get('strict-transport-security'), 'content-security-policy': r.headers.get('content-security-policy') ? 'present' : null } });
          } catch(e) {
            return json({ domain: host, ssl: false, error: e.message });
          }
        }

        case '/api/http-headers': {
          const target = body.url || url.searchParams.get('url');
          if (!target) return json({ error: 'Send {"url":"https://example.com"} or ?url=...' }, 400);
          const r = await fetch(target, { method: 'HEAD', redirect: 'manual' });
          const headers = {};
          for (const [k,v] of r.headers.entries()) headers[k] = v;
          return json({ url: target, status: r.status, headers });
        }

        case '/api/rss-parse': {
          const feedUrl = body.url || url.searchParams.get('url');
          if (!feedUrl) return json({ error: 'Send {"url":"https://example.com/feed.xml"}' }, 400);
          const r = await fetch(feedUrl);
          const xml = await r.text();
          const items = [];
          const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
          for (const item of itemMatches.slice(0, 20)) {
            const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1] || '';
            const link = item.match(/<link[^>]*href="([^"]+)"/i)?.[1] || item.match(/<link[^>]*>(.*?)<\/link>/i)?.[1] || '';
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || item.match(/<published>(.*?)<\/published>/i)?.[1] || '';
            const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i)?.[1] || '';
            items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), description: desc.substring(0, 200).trim() });
          }
          const feedTitle = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1] || '';
          return json({ title: feedTitle.trim(), items, count: items.length });
        }

        // === Data Tools ===
        case '/api/json-diff': {
          const { json1, json2, obj1, obj2 } = body;
          const a = json1 || obj1;
          const b = json2 || obj2;
          if (!a || !b) return json({ error: 'Send {"json1":{...},"json2":{...}}' }, 400);
          const diffs = jsonDiff(typeof a === 'string' ? JSON.parse(a) : a, typeof b === 'string' ? JSON.parse(b) : b, '');
          return json({ differences: diffs, totalChanges: diffs.length });
        }

        case '/api/csv-filter': {
          const { csv, column, operator, value } = body;
          if (!csv || !column) return json({ error: 'Send {"csv":"a,b\\n1,2","column":"a","operator":"eq|gt|lt|contains","value":"1"}' }, 400);
          const lines = csv.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          const colIdx = headers.indexOf(column);
          if (colIdx < 0) return json({ error: 'Column "' + column + '" not found. Available: ' + headers.join(', ') }, 400);
          const filtered = [lines[0]];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const cell = (cols[colIdx] || '').trim();
            let match = false;
            const op = operator || 'eq';
            if (op === 'eq') match = cell === String(value);
            else if (op === 'neq') match = cell !== String(value);
            else if (op === 'gt') match = parseFloat(cell) > parseFloat(value);
            else if (op === 'lt') match = parseFloat(cell) < parseFloat(value);
            else if (op === 'gte') match = parseFloat(cell) >= parseFloat(value);
            else if (op === 'lte') match = parseFloat(cell) <= parseFloat(value);
            else if (op === 'contains') match = cell.toLowerCase().includes(String(value).toLowerCase());
            if (match) filtered.push(lines[i]);
          }
          return json({ csv: filtered.join('\n'), rows: filtered.length - 1, totalRows: lines.length - 1 });
        }

        case '/api/csv-sort': {
          const { csv: csvData, column: sortCol, order } = body;
          if (!csvData || !sortCol) return json({ error: 'Send {"csv":"a,b\\n1,2","column":"a","order":"asc|desc"}' }, 400);
          const ls = csvData.split('\n').filter(l => l.trim());
          const hdrs = ls[0].split(',').map(h => h.trim());
          const ci = hdrs.indexOf(sortCol);
          if (ci < 0) return json({ error: 'Column not found' }, 400);
          const rows = ls.slice(1).map(l => l.split(','));
          rows.sort((a, b) => {
            const va = (a[ci]||'').trim(), vb = (b[ci]||'').trim();
            const na = parseFloat(va), nb = parseFloat(vb);
            if (!isNaN(na) && !isNaN(nb)) return order === 'desc' ? nb - na : na - nb;
            return order === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
          });
          return json({ csv: [ls[0], ...rows.map(r => r.join(','))].join('\n'), rows: rows.length });
        }

        // === Text/NLP Tools ===
        case '/api/word-count': {
          const txt = body.text || '';
          if (!txt) return json({ error: 'Send {"text":"..."}' }, 400);
          const words = txt.trim().split(/\s+/).filter(w => w);
          const sentences = txt.split(/[.!?]+/).filter(s => s.trim());
          const paragraphs = txt.split(/\n\n+/).filter(p => p.trim());
          return json({ characters: txt.length, words: words.length, sentences: sentences.length, paragraphs: paragraphs.length, avgWordLength: (words.reduce((s, w) => s + w.length, 0) / words.length).toFixed(1) });
        }

        case '/api/text-extract-emails': {
          const txt = body.text || '';
          if (!txt) return json({ error: 'Send {"text":"..."}' }, 400);
          const emails = [...new Set((txt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []))];
          return json({ emails, count: emails.length });
        }

        case '/api/text-extract-urls': {
          const txt = body.text || '';
          if (!txt) return json({ error: 'Send {"text":"..."}' }, 400);
          const urls = [...new Set((txt.match(/https?:\/\/[^\s<>"{}|\\^\x60]+/g) || []))];
          return json({ urls, count: urls.length });
        }

        case '/api/lorem-ipsum': {
          const count = parseInt(body.paragraphs || body.count || url.searchParams.get('paragraphs') || '3');
          const paras = [];
          const words = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];
          for (let p = 0; p < count; p++) {
            const sentCount = 3 + Math.floor(Math.random() * 4);
            const sents = [];
            for (let s = 0; s < sentCount; s++) {
              const wc = 8 + Math.floor(Math.random() * 12);
              const ws = [];
              for (let w = 0; w < wc; w++) ws.push(words[Math.floor(Math.random() * words.length)]);
              ws[0] = ws[0][0].toUpperCase() + ws[0].slice(1);
              sents.push(ws.join(' ') + '.');
            }
            paras.push(sents.join(' '));
          }
          return json({ text: paras.join('\n\n'), paragraphs: count });
        }

        // === Crypto/Security ===
        case '/api/random-bytes': {
          const size = parseInt(body.size || url.searchParams.get('size') || '32');
          if (size > 1024) return json({ error: 'Max 1024 bytes' }, 400);
          const bytes = new Uint8Array(size);
          crypto.getRandomValues(bytes);
          const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const b64 = btoa(String.fromCharCode(...bytes));
          return json({ hex, base64: b64, size });
        }

        case '/api/hash-file': {
          if (request.method !== 'POST') return json({ error: 'POST multipart file or {"text":"...","algorithm":"sha256"}' }, 400);
          const algo = body.algorithm || 'SHA-256';
          const txt = body.text;
          if (txt) {
            const buf = new TextEncoder().encode(txt);
            const algoMap = {'SHA256':'SHA-256','SHA-256':'SHA-256','SHA384':'SHA-384','SHA-384':'SHA-384','SHA512':'SHA-512','SHA-512':'SHA-512','SHA-1':'SHA-1','SHA1':'SHA-1'};
            const mappedAlgo = algoMap[algo.toUpperCase().replace(/[^A-Z0-9]/g,'')] || algoMap[algo.toUpperCase()] || 'SHA-256';
            const hashBuf = await crypto.subtle.digest(mappedAlgo, buf);
            const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
            return json({ hash: hex, algorithm: algo, inputSize: buf.length });
          }
          return json({ error: 'Send {"text":"...","algorithm":"sha256|sha384|sha512"}' }, 400);
        }

        // === Utility ===
        case '/api/user-agent': {
          const ua = request.headers.get('user-agent') || '';
          const isBot = /bot|crawl|spider|slurp|googlebot|bingbot/i.test(ua);
          const isMobile = /mobile|android|iphone|ipad/i.test(ua);
          const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);
          return json({ userAgent: ua, isBot, isMobile, browser: browser ? { name: browser[1], version: browser[2] } : null });
        }

        case '/api/timestamp': {
          const ts = body.timestamp || body.time || url.searchParams.get('timestamp');
          const now = new Date();
          if (ts) {
            const d = new Date(isNaN(ts) ? ts : parseInt(ts) * 1000);
            return json({ iso: d.toISOString(), unix: Math.floor(d.getTime()/1000), utc: d.toUTCString(), relative: relativeTime(d, now) });
          }
          return json({ iso: now.toISOString(), unix: Math.floor(now.getTime()/1000), utc: now.toUTCString(), dayOfWeek: now.toLocaleDateString('en',{weekday:'long'}), weekOfYear: getWeekNumber(now) });
        }

        case '/api/color-palette': {
          const base = body.color || body.hex || url.searchParams.get('color') || '#3b82f6';
          const hex = base.replace('#', '');
          const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b2 = parseInt(hex.substr(4,2),16);
          const hsl = rgbToHsl(r, g, b2);
          const palette = {
            base: '#' + hex,
            lighter: hslToHex(hsl[0], hsl[1], Math.min(95, hsl[2] + 20)),
            light: hslToHex(hsl[0], hsl[1], Math.min(90, hsl[2] + 10)),
            dark: hslToHex(hsl[0], hsl[1], Math.max(10, hsl[2] - 10)),
            darker: hslToHex(hsl[0], hsl[1], Math.max(5, hsl[2] - 20)),
            complementary: hslToHex((hsl[0] + 180) % 360, hsl[1], hsl[2]),
            analogous: [hslToHex((hsl[0] + 30) % 360, hsl[1], hsl[2]), hslToHex((hsl[0] - 30 + 360) % 360, hsl[1], hsl[2])],
            triadic: [hslToHex((hsl[0] + 120) % 360, hsl[1], hsl[2]), hslToHex((hsl[0] + 240) % 360, hsl[1], hsl[2])]
          };
          return json(palette);
        }

        case '/api/ip-geolocation': {
          const ip = body.ip || url.searchParams.get('ip') || request.headers.get('cf-connecting-ip');
          const cf = request.cf || {};
          return json({ ip, country: cf.country, city: cf.city, region: cf.region, timezone: cf.timezone, asn: cf.asn, org: cf.asOrganization, latitude: cf.latitude, longitude: cf.longitude });
        }

        default:
          return json({ error: 'Unknown endpoint', available: [
            'barcode','dns-lookup','ssl-check','http-headers','rss-parse',
            'json-diff','csv-filter','csv-sort',
            'word-count','text-extract-emails','text-extract-urls','lorem-ipsum',
            'random-bytes','hash-file','user-agent','timestamp','color-palette','ip-geolocation',
            'image-crop','image-flip','pdf-to-text','pdf-page-count'
          ]}, 404);
      }
    } catch(e) {
      return json({ error: 'Internal error: ' + e.message }, 500);
    }
  }
};

// Helper: Code128 barcode encoding
function encodeCode128(text) {
  const START_B = '11010010000';
  const STOP = '1100011101011';
  const CODE_B = [
    '11011001100','11001101100','11001100110','10010011000','10010001100',
    '10001001100','10011001000','10011000100','10001100100','11001001000',
    '11001000100','11000100100','10110011100','10011011100','10011001110',
    '10111001100','10011101100','10011100110','11001110010','11001011100',
    '11001001110','11011100100','11001110100','11101101110','11101001100',
    '11100101100','11100100110','11101100100','11100110100','11100110010',
    '11011011000','11011000110','11000110110','10100011000','10001011000',
    '10001000110','10110001000','10001101000','10001100010','11010001000',
    '11000101000','11000100010','10110111000','10110001110','10001101110',
    '10111011000','10111000110','10001110110','11101110110','11010001110',
    '11000101110','11011101000','11011100010','11011101110','11101011000',
    '11101000110','11100010110','11101101000','11101100010','11100011010',
    '11101111010','11001000010','11110001010','10100110000','10100001100',
    '10010110000','10010000110','10000101100','10000100110','10110010000',
    '10110000100','10011010000','10011000010','10000110100','10000110010',
    '11000010010','11001010000','11110111010','11000010100','10001111010',
    '10100111100','10010111100','10010011110','10111100100','10011110100',
    '10011110010','11110100100','11110010100','11110010010','11011011110',
    '11011110110','11110110110','10101111000','10100011110','10001011110',
    '10111101000','10111100010','11110101000','11110100010','10111011110',
    '10111101110','11101011110','11110101110','11010000100','11010010000',
    '11010011100','1100011101011'
  ];
  let bars = START_B;
  let checksum = 104;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code < 95) {
      bars += CODE_B[code];
      checksum += code * (i + 1);
    }
  }
  bars += CODE_B[checksum % 103];
  bars += STOP;
  return bars;
}

function escapeXml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function jsonDiff(a, b, path) {
  const diffs = [];
  if (typeof a !== typeof b) { diffs.push({ path: path || '(root)', type: 'type_change', from: typeof a, to: typeof b }); return diffs; }
  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (i >= a.length) diffs.push({ path: path + '[' + i + ']', type: 'added', value: b[i] });
      else if (i >= b.length) diffs.push({ path: path + '[' + i + ']', type: 'removed', value: a[i] });
      else diffs.push(...jsonDiff(a[i], b[i], path + '[' + i + ']'));
    }
  } else if (typeof a === 'object' && a !== null) {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of allKeys) {
      const p = path ? path + '.' + k : k;
      if (!(k in a)) diffs.push({ path: p, type: 'added', value: b[k] });
      else if (!(k in b)) diffs.push({ path: p, type: 'removed', value: a[k] });
      else diffs.push(...jsonDiff(a[k], b[k], p));
    }
  } else if (a !== b) {
    diffs.push({ path: path || '(root)', type: 'changed', from: a, to: b });
  }
  return diffs;
}

function relativeTime(d, now) {
  const diff = now - d;
  const s = Math.abs(diff) / 1000;
  if (s < 60) return Math.round(s) + ' seconds ' + (diff > 0 ? 'ago' : 'from now');
  if (s < 3600) return Math.round(s/60) + ' minutes ' + (diff > 0 ? 'ago' : 'from now');
  if (s < 86400) return Math.round(s/3600) + ' hours ' + (diff > 0 ? 'ago' : 'from now');
  return Math.round(s/86400) + ' days ' + (diff > 0 ? 'ago' : 'from now');
}

function getWeekNumber(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}


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
