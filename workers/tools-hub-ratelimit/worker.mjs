
const NET_MAP={"/api/web-fetch":"B13","/api/url-info":"B13","/api/dns-lookup":"EXP","/api/ssl-check":"EXP","/api/http-headers":"EXP","/api/rss-parse":"EXP","/api/meta-extract":"MISS","/api/sitemap-parse":"MISS","/api/link-check":"EXP2","/api/open-graph":"EXP2","/api/http-redirect":"REDIR","/api/whois":"WHOIS","/api/cors-test":"B7B","/api/sri-hash":"B7A","/api/security-headers":"B7A","/api/webhook-test":"B8A","/api/lighthouse-score":"B3","/api/favicon":"B3","/api/tech-detect":"B3","/api/canonical-url":"B3","/api/domain-age":"B3"};
const AI_MAP={"/api/ai-translate":"AI","/api/ai-summarize":"AI","/api/ai-ocr":"AI"};
const FILE_EPS=new Set(["/api/pdf-merge","/api/pdf-split","/api/pdf-rotate","/api/pdf-watermark","/api/pdf-metadata","/api/pdf-extract"]);
const COST={net:20,file:60,'/api/ai-translate':50,'/api/ai-summarize':50,'/api/ai-ocr':100,'/api/ai-image':200};
const LIMITS={free:1000,dev:100000,business:500000};
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key','Access-Control-Expose-Headers':'X-Credits-Used,X-Credits-Limit,X-Credits-Cost,Retry-After'};
const day=()=>new Date().toISOString().slice(0,10);
const month=()=>new Date().toISOString().slice(0,7);
function json(d,s,extra){return new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json',...C,...(extra||{})}});}
function secsToMidnightUTC(){const n=new Date();return Math.max(1,Math.ceil((Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+1)-n.getTime())/1000));}
function badHost(h){
  h=(h||'').toLowerCase().replace(/\.$/,'');
  if(!h)return 'empty host';
  if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.lan')||h.endsWith('.home.arpa'))return 'local hostname';
  if(/^\[?[0-9a-f:]+\]?$/i.test(h)&&h.includes(':'))return 'IP literal not allowed';
  if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h))return 'IP literal not allowed';
  if(/^(0x[0-9a-f]+|\d+)$/i.test(h))return 'IP literal not allowed';
  if(!h.includes('.'))return 'single-label host not allowed';
  return null;
}
function checkTarget(b){
  const fields=['url','target','feedUrl','feed','link','href','site'];
  for(const f of fields){
    if(typeof b[f]==='string'&&b[f]){
      let u;try{u=new URL(b[f]);}catch(e){return 'invalid url in '+f;}
      if(u.protocol!=='http:'&&u.protocol!=='https:')return 'only http/https allowed';
      if(u.port&&u.port!=='80'&&u.port!=='443')return 'only ports 80/443 allowed';
      if(u.username||u.password)return 'credentials in url not allowed';
      const r=badHost(u.hostname);if(r)return r;
    }
  }
  for(const f of ['domain','host','hostname']){
    if(typeof b[f]==='string'&&b[f]){const h=b[f].replace(/^https?:\/\//,'').split('/')[0].split(':')[0];const r=badHost(h);if(r)return r;}
  }
  if(Array.isArray(b.urls)){for(const x of b.urls){const r=checkTarget({url:x});if(r)return r;}}
  return null;
}
async function sha(k){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(k));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function lookupKey(env,k){
  const h=await sha(k);
  let raw=await env.KEYS_KV.get('kh:'+h);
  if(!raw){
    raw=await env.KEYS_KV.get('key:'+k);
    if(raw){try{const o=JSON.parse(raw);delete o.key;o.keyHint=k.slice(0,10)+'…'+k.slice(-4);await env.KEYS_KV.put('kh:'+h,JSON.stringify(o));await env.KEYS_KV.delete('key:'+k);if(o.email)await env.KEYS_KV.put('email:'+o.email,'kh:'+h);raw=JSON.stringify(o);}catch(e){}}
  }
  if(!raw)return null;
  try{const o=JSON.parse(raw);o._h=h;return o;}catch(e){return null;}
}
export default{async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
  const url=new URL(request.url);const p=url.pathname;
  const isNet=!!NET_MAP[p],isAI=!!AI_MAP[p],isFile=FILE_EPS.has(p);
  if(!isNet&&!isAI&&!isFile)return json({type:'about:blank',title:'Not Found',status:404,detail:'This endpoint is not available. It was withdrawn until it passes accuracy tests. See https://toolsthatdontupload.com/openapi.json for the current list.'},404);
  if(request.method!=='POST'&&request.method!=='GET')return json({title:'Method Not Allowed',status:405},405,{Allow:'GET, POST, OPTIONS'});
  const internal=env.INTERNAL_TOKEN&&request.headers.get('x-internal-token')===env.INTERNAL_TOKEN;
  const ip=(internal&&request.headers.get('x-client-ip'))||request.headers.get('cf-connecting-ip')||'unknown';
  const cost=isNet?COST.net:isFile?COST.file:COST[p];
  if(isFile){const ct=request.headers.get('content-type')||'';if(!ct.includes('multipart/form-data'))return json({title:'Bad Request',status:400,detail:'This endpoint requires a multipart/form-data file upload.'},400);}
  // read body once for checks (non-file)
  let bodyText=null,bodyObj={};
  if(!isFile&&request.method==='POST'){bodyText=await request.text();if(bodyText){try{bodyObj=JSON.parse(bodyText);}catch(e){return json({title:'Bad Request',status:400,detail:'Body must be valid JSON.'},400);}}}
  if(!isFile&&request.method==='GET'){url.searchParams.forEach((v,k)=>{bodyObj[k]=v;});}
  if(isNet){const bad=checkTarget(bodyObj||{});if(bad)return json({title:'Bad Request',status:400,detail:'Target rejected: '+bad+'. Only public http(s) hosts on ports 80/443 are allowed.'},400);}
  const apiKey=request.headers.get('x-api-key')||(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  let headersOut={};
  if(apiKey&&apiKey.startsWith('ttdu_')){
    const kd=await lookupKey(env,apiKey);
    if(!kd)return json({title:'Unauthorized',status:401,detail:'Invalid API key.'},401);
    const tier=kd.cancelled_at?'free':(kd.tier||'free');
    const limit=LIMITS[tier]||1000;
    const acct=kd.account?String(kd.account).replace(/^kh:|^oa:/,''):kd._h;const uKey='cr:'+acct+':'+month();
    const used=parseInt(await env.RATE_KV.get(uKey)||'0');
    const prepaid=parseInt(await env.RATE_KV.get('prepaid:'+acct)||'0');
    if(cost>limit-used+prepaid)return json({title:'Payment Required',status:402,detail:'Insufficient credits for this call.',used,monthlyLimit:limit,prepaid,needed:cost},402);
    const rem=limit-used;
    if(cost<=rem)await env.RATE_KV.put(uKey,String(used+cost),{expirationTtl:2764800});
    else{await env.RATE_KV.put(uKey,String(limit),{expirationTtl:2764800});await env.RATE_KV.put('prepaid:'+acct,String(prepaid-(cost-Math.max(0,rem))));}
    headersOut={'X-Credits-Used':String(used+cost),'X-Credits-Limit':String(limit),'X-Credits-Cost':String(cost)};
  }else{
    if(isNet)return json({title:'Unauthorized',status:401,detail:'This tool fetches external URLs and requires an API key in the X-API-Key header. Free keys: https://toolsthatdontupload.com/api-keys/'},401);
    const cat=isFile?'file':'ai';const lim=isFile?20:10;
    const k=cat+':'+ip+':'+day();
    const n=parseInt(await env.RATE_KV.get(k)||'0');
    if(n>=lim){const ra=secsToMidnightUTC();return json({title:'Too Many Requests',status:429,detail:'Anonymous daily '+cat+' limit ('+lim+'/day per IP) reached. Resets at 00:00 UTC. An API key raises the limit: https://toolsthatdontupload.com/api-keys/'},429,{'Retry-After':String(ra),'RateLimit-Limit':String(lim),'RateLimit-Remaining':'0','RateLimit-Reset':String(ra)});}
    await env.RATE_KV.put(k,String(n+1),{expirationTtl:90000});
    headersOut={'RateLimit-Limit':String(lim),'RateLimit-Remaining':String(lim-n-1)};
  }
  // dispatch
  const fwdHeaders=new Headers();
  for(const [k,v] of request.headers){if(!/^(x-api-key|authorization|x-internal-token|x-client-ip)$/i.test(k))fwdHeaders.set(k,v);}
  let resp;
  const target=NET_MAP[p]||AI_MAP[p];
  if(target){
    const init={method:request.method,headers:fwdHeaders};
    if(request.method==='POST')init.body=bodyText||'{}';
    if(request.method==='POST'&&!fwdHeaders.get('content-type'))fwdHeaders.set('content-type','application/json');
    resp=await env[target].fetch(new Request('https://toolsthatdontupload.com'+p+url.search,init));
  }else{
    resp=await fetch(new Request(request,{headers:fwdHeaders}));
  }
  const out=new Response(resp.body,resp);
  let egress='none';
  if(isNet){const t=bodyObj.url||bodyObj.target||bodyObj.feedUrl||bodyObj.domain||bodyObj.host||'';let host='';try{host=new URL(/^https?:/i.test(t)?t:'https://'+t).hostname;}catch(e){}
    const fixed={'/api/dns-lookup':'cloudflare-dns.com','/api/whois':'rdap.org (or rdap.verisign.com)','/api/domain-age':'rdap.org'};egress=fixed[p]?(fixed[p]+(host?'; query='+host:'')):(host||'user-supplied host');}
  else if(isAI)egress='api.cloudflare.com (Workers AI)';
  out.headers.set('X-Egress',egress);out.headers.set('Access-Control-Expose-Headers','X-Credits-Used,X-Credits-Limit,X-Credits-Cost,Retry-After,X-Egress,RateLimit-Limit,RateLimit-Remaining');
  for(const [k,v] of Object.entries({...C,...headersOut}))out.headers.set(k,v);
  return out;
}};
