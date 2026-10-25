import { readBodyCapped, requestWithBody } from './request-guards.mjs';
import { migrateRecord } from './email-index.mjs';
import { getQueryPolicy, withDeprecation } from './get-query-policy.mjs';
import { withEvents } from './ttdu-events.mjs';
import { checkPdfUpload, mapOriginPdfError } from './pdf-input-guard.mjs';

const NET_MAP={"/api/web-fetch":"B13","/api/url-info":"B13","/api/dns-lookup":"EXP","/api/ssl-check":"EXP","/api/http-headers":"EXP","/api/rss-parse":"EXP","/api/meta-extract":"MISS","/api/sitemap-parse":"MISS","/api/link-check":"EXP2","/api/open-graph":"EXP2","/api/http-redirect":"REDIR","/api/whois":"WHOIS","/api/cors-test":"B7B","/api/sri-hash":"B7A","/api/security-headers":"B7A","/api/webhook-test":"B8A","/api/lighthouse-score":"B3","/api/favicon":"B3","/api/tech-detect":"B3","/api/canonical-url":"B3","/api/domain-age":"B3"};
const AI_MAP={"/api/ai-translate":"AI","/api/ai-summarize":"AI","/api/ai-ocr":"AI"};
const RENDER_MAP={"/api/html-to-pdf":"RENDER","/api/markdown-to-pdf":"RENDER","/api/pdf-table-extract":"PDFTXT","/api/pdf-text-layout":"PDFTXT"};
const FILE_EPS=new Set(["/api/pdf-merge","/api/pdf-split","/api/pdf-rotate","/api/pdf-watermark","/api/pdf-metadata","/api/pdf-extract"]);
// W-HUBFIX 2026-10-14: handled by Worker tools-hub-pdf when the PDF service binding exists, otherwise by the origin.
const PDF_LOCAL=new Set(["/api/pdf-extract","/api/pdf-split","/api/pdf-metadata"]);
const COST={net:20,file:60,'/api/ai-translate':50,'/api/ai-summarize':50,'/api/ai-ocr':100};
const LIMITS={free:1000,dev:100000,business:500000};
// W-HUBIA 2026-10-15: human-readable next steps on limit and key errors (fields and headers only added).
const DEV_URL='https://toolsthatdontupload.com/developers/#limits';const PAID='Paid plans (Dev $9/month, Business $49/month) and credit packs are on sale at https://toolsthatdontupload.com/pricing/ (payments by PayPal).';const HELP_LINK='<https://toolsthatdontupload.com/developers/#limits>; rel="help"';
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key,X-AI-Key','Access-Control-Expose-Headers':'X-Credits-Used,X-Credits-Limit,X-Credits-Cost,X-Credits-Remaining,X-Free-Daily-Limit,X-Free-Daily-Remaining,Retry-After,X-Egress,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset,Link','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const day=()=>new Date().toISOString().slice(0,10);
const month=()=>new Date().toISOString().slice(0,7);
function json(d,s,extra){return new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json',...C,...(extra||{})}});}
function secsToMidnightUTC(){const n=new Date();return Math.max(1,Math.ceil((Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+1)-n.getTime())/1000));}
function badHost(h){
  h=(h||'').toLowerCase().replace(/\.$/,'');
  if(!h)return 'empty host';
  if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.lan')||h.endsWith('.home.arpa'))return 'local hostname';
  if(h.includes(':'))return 'IP literal not allowed';
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
    if(typeof b[f]==='string'&&b[f]){let raw=b[f].trim();if(!/^https?:\/\//i.test(raw))raw='http://'+raw;let u;try{u=new URL(raw);}catch(e){return 'invalid host in '+f;}if(u.username||u.password)return 'credentials not allowed';if(u.port&&u.port!=='80'&&u.port!=='443')return 'only ports 80/443 allowed';const r=badHost(u.hostname);if(r)return r;}
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
    if(raw){try{const o=JSON.parse(raw);delete o.key;o.keyHint=k.slice(0,10)+'…'+k.slice(-4);if(o.email&&!(await migrateRecord(env,o,'kh:'+h)))await env.KEYS_KV.put('email:'+o.email,'kh:'+h);await env.KEYS_KV.put('kh:'+h,JSON.stringify(o));await env.KEYS_KV.delete('key:'+k);raw=JSON.stringify(o);}catch(e){}}
  }
  if(!raw)return null;
  try{const o=JSON.parse(raw);if(o.email){try{if(await migrateRecord(env,o,'kh:'+h))await env.KEYS_KV.put('kh:'+h,JSON.stringify(o));}catch(e){}}o._h=h;return o;}catch(e){return null;}
}
const __inner={async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
  const url=new URL(request.url);const p=url.pathname;
  const isNet=!!NET_MAP[p],isAI=!!AI_MAP[p],isRender=!!RENDER_MAP[p],isFile=FILE_EPS.has(p)||isRender;
  if(!isNet&&!isAI&&!isFile)return json({type:'about:blank',title:'Not Found',status:404,detail:'This endpoint is not available. It was withdrawn until it passes accuracy tests. See https://toolsthatdontupload.com/openapi.json for the current list.'},404);
  if(request.method!=='POST'&&request.method!=='GET')return json({title:'Method Not Allowed',status:405},405,{Allow:'GET, POST, OPTIONS'});
  const contentType=(request.headers.get('content-type')||'').toLowerCase();
  const isMultiAI=isAI&&contentType.includes('multipart/form-data');
  let bodyBytes=null;
  if(request.method==='POST'){
    const maxBytes=isRender?2*1024*1024:(isFile||isMultiAI?15*1024*1024:2*1024*1024);
    const limited=await readBodyCapped(request,maxBytes);
    if(limited.tooLarge)return json({title:'Payload Too Large',status:413,detail:'Request exceeds the endpoint size limit.'},413);
    bodyBytes=limited.bytes;
  }
  const internal=env.INTERNAL_TOKEN&&request.headers.get('x-internal-token')===env.INTERNAL_TOKEN;
  const ip=(internal&&request.headers.get('x-client-ip'))||request.headers.get('cf-connecting-ip')||'unknown';
  let cost=isNet?COST.net:isFile?COST.file:COST[p];
  if(isFile&&!isRender&&!contentType.includes('multipart/form-data'))return json({title:'Bad Request',status:400,detail:'This endpoint requires a multipart/form-data file upload.'},400);
  let bodyText=null,bodyObj={};
  let aiOpts={};
  if(isMultiAI&&request.method==='POST'){try{const fd=await requestWithBody(request,bodyBytes).formData();for(const k of ['provider','quality','model']){const v=fd.get(k);if(typeof v==='string')aiOpts[k]=v;}}catch(e){return json({title:'Bad Request',status:400,detail:'Multipart body is invalid.'},400);}}
  if((!isFile||isRender)&&!isMultiAI&&request.method==='POST'){bodyText=new TextDecoder().decode(bodyBytes);if(bodyText){try{bodyObj=JSON.parse(bodyText);}catch(e){return json({title:'Bad Request',status:400,detail:'Body must be valid JSON.'},400);}}}
  if(!isFile&&request.method==='GET'){url.searchParams.forEach((v,k)=>{bodyObj[k]=v;});}
  if(isNet){const bad=checkTarget(bodyObj||{});if(bad)return json({title:'Bad Request',status:400,detail:'Target rejected: '+bad+'. Only public http(s) hosts on ports 80/443 are allowed.'},400);}
  if(isAI&&!isMultiAI)aiOpts=bodyObj||{};
  const aiProv=String(aiOpts.provider||'').toLowerCase();const isByok=isAI&&!!request.headers.get('x-ai-key')&&(aiProv==='anthropic'||aiProv==='openai');const isHigh=isAI&&!isByok&&aiOpts.quality==='high';
  if(isByok)cost=5;else if(isHigh)cost=150;
  const apiKey=request.headers.get('x-api-key')||(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  let headersOut={};
  if(apiKey&&apiKey.startsWith('ttdu_')){
    const kd=await lookupKey(env,apiKey);
    if(!kd)return json({title:'Unauthorized',status:401,detail:'Invalid API key.',get_key_url:'https://toolsthatdontupload.com/api-keys/',developers_url:DEV_URL},401,{Link:HELP_LINK});
    const tier=kd.cancelled_at?'free':(kd.tier||'free');
    const limit=LIMITS[tier]||1000;
    const acct=kd.account?String(kd.account).replace(/^kh:|^oa:/,''):kd._h;const uKey='cr:'+acct+':'+month();
    let freeUsed=false;
    if((isFile||isAI)&&!isHigh){const fcat=isFile?'file':'ai';const flim=isFile?20:10;const fk='kfree:'+fcat+':'+acct+':'+day();const fn=parseInt(await env.RATE_KV.get(fk)||'0');
      if(fn<flim){await env.RATE_KV.put(fk,String(fn+1),{expirationTtl:90000});freeUsed=true;headersOut={'X-Credits-Cost':'0','X-Free-Daily-Limit':String(flim),'X-Free-Daily-Remaining':String(flim-fn-1)};}}
    if(!freeUsed){
    const used=parseInt(await env.RATE_KV.get(uKey)||'0');
    const prepaid=parseInt(await env.RATE_KV.get('prepaid:'+acct)||'0');
    if(cost>limit-used+prepaid)return json({title:'Usage Limit Reached',status:402,detail:'All API credits have been used for this billing period. Purchase additional credits or upgrade your plan to continue.',message:'API 사용량을 모두 소진하였습니다. 추가 크레딧을 구매하거나 플랜을 업그레이드해 주세요.',used,monthlyLimit:limit,prepaid,needed:cost,upgrade_url:'https://toolsthatdontupload.com/pricing/',docs_url:'https://toolsthatdontupload.com/docs/api-keys/',developers_url:DEV_URL,paid_plans:PAID,next_steps:'Your monthly credits reset at the start of the next month (UTC). Paid plans and credit packs: https://toolsthatdontupload.com/pricing/ (payments by PayPal). Questions: hello@toolsthatdontupload.com. Limits explained: '+DEV_URL,next_steps_ko:'월 크레딧은 다음 달 1일(UTC)에 초기화됩니다. 유료 플랜과 크레딧 팩: https://toolsthatdontupload.com/ko/pricing/ (PayPal 결제). 문의: hello@toolsthatdontupload.com 한도 안내: https://toolsthatdontupload.com/ko/developers/#limits'},402,{Link:HELP_LINK});
    const rem=limit-used;
    if(cost<=rem)await env.RATE_KV.put(uKey,String(used+cost),{expirationTtl:2764800});
    else{await env.RATE_KV.put(uKey,String(limit),{expirationTtl:2764800});await env.RATE_KV.put('prepaid:'+acct,String(prepaid-(cost-Math.max(0,rem))));}
    headersOut={'X-Credits-Used':String(used+cost),'X-Credits-Limit':String(limit),'X-Credits-Cost':String(cost),'X-Credits-Remaining':String(Math.max(0,limit-used-cost))};
    }
  }else{
    if(isHigh)return json({title:'API Key Required',status:401,detail:'The "high" quality option uses larger AI models and requires an API key (X-API-Key header). Get a free key with 1,000 credits/month, or bring your own Claude/ChatGPT key.',message:'고품질 모드는 대형 AI 모델을 사용하며 API 키가 필요합니다.',upgrade_url:'https://toolsthatdontupload.com/api-keys/',docs_url:'https://toolsthatdontupload.com/docs/ai-upgrade/',developers_url:DEV_URL},401,{Link:HELP_LINK});
    if(isNet)return json({title:'API Key Required',status:401,detail:'Network tools fetch external URLs and require an API key in the X-API-Key header. Free keys include 1,000 credits/month.',message:'네트워크 도구는 API 키가 필요합니다. 무료 키를 발급받으세요.',upgrade_url:'https://toolsthatdontupload.com/api-keys/',docs_url:'https://toolsthatdontupload.com/docs/api-keys/',developers_url:DEV_URL},401,{Link:HELP_LINK});
    const cat=isFile?'file':'ai';const lim=isFile?20:10;
    const k=cat+':'+ip+':'+day();
    const n=parseInt(await env.RATE_KV.get(k)||'0');
    if(n>=lim){const ra=secsToMidnightUTC();return json({title:'Daily Limit Reached',status:429,detail:'Daily anonymous '+cat+' usage limit ('+lim+' calls/day per IP) has been reached. The limit resets at 00:00 UTC. Get a free API key for 1,000 credits/month and higher limits.',message:'일일 무료 사용량('+lim+'회)을 모두 소진하였습니다. 00:00 UTC에 초기화됩니다. 무료 API 키를 발급받으면 월 1,000 크레딧과 더 높은 한도를 이용할 수 있습니다.',daily_limit:lim,daily_used:n,resets_at:'00:00 UTC',upgrade_url:'https://toolsthatdontupload.com/pricing/',get_key_url:'https://toolsthatdontupload.com/api-keys/',developers_url:DEV_URL,paid_plans:PAID,retry_after_seconds:ra,next_steps:'You have used today\'s free '+(cat==='file'?'file':'AI')+' calls for your IP address. Try again after 00:00 UTC (in about '+Math.ceil(ra/3600)+' hours), or get a free API key with your email (no card) for your own daily allowance and 1,000 credits a month. Nothing is charged. Limits explained: '+DEV_URL,next_steps_ko:'오늘 이 IP 의 무료 '+(cat==='file'?'파일':'AI')+' 호출을 모두 썼습니다. 00:00 UTC(한국 시각 오전 9시, 약 '+Math.ceil(ra/3600)+'시간 뒤) 이후 다시 시도하거나, 이메일로 무료 API 키(카드 없음)를 받으면 키별 하루 허용량과 월 1,000 크레딧을 쓸 수 있습니다. 요금은 청구되지 않습니다. 한도 안내: https://toolsthatdontupload.com/ko/developers/#limits'},429,{'Retry-After':String(ra),'RateLimit-Limit':String(lim),'RateLimit-Remaining':'0','RateLimit-Reset':String(ra),'X-RateLimit-Limit':String(lim),'X-RateLimit-Remaining':'0','X-RateLimit-Reset':String(ra),Link:HELP_LINK});}
    await env.RATE_KV.put(k,String(n+1),{expirationTtl:90000});
    {const rs=String(secsToMidnightUTC());headersOut={'RateLimit-Limit':String(lim),'RateLimit-Remaining':String(lim-n-1),'RateLimit-Reset':rs,'X-RateLimit-Limit':String(lim),'X-RateLimit-Remaining':String(lim-n-1),'X-RateLimit-Reset':rs};}
  }
  if(isFile&&!isRender){const g=await checkPdfUpload(p,requestWithBody(request,bodyBytes));if(g)return json(g,g.status,{...headersOut,...(g.status===405?{Allow:'POST, OPTIONS'}:{})});}
  const fwdHeaders=new Headers();
  for(const [k,v] of request.headers){if(!/^(x-api-key|authorization|x-internal-token|x-client-ip)$/i.test(k))fwdHeaders.set(k,v);}
  let resp;
  const target=NET_MAP[p]||AI_MAP[p]||RENDER_MAP[p];
  if(target){
    const init={method:request.method,headers:fwdHeaders};
    if(request.method==='POST')init.body=bodyBytes;
    if(request.method==='POST'&&!fwdHeaders.get('content-type'))fwdHeaders.set('content-type','application/json');
    try{resp=await env[target].fetch(new Request('https://toolsthatdontupload.com'+p+url.search,init));}
    catch{return json({title:'Bad Gateway',status:502,detail:'The processing service is temporarily unavailable.'},502);}
  }else{
    try{const __pr=new Request(requestWithBody(request,bodyBytes),{headers:fwdHeaders});resp=(PDF_LOCAL.has(p)&&env.PDF)?await env.PDF.fetch(__pr):await fetch(__pr);}
    catch{return json({title:'Bad Gateway',status:502,detail:'The processing service is temporarily unavailable.'},502);}
  }
  if(isFile&&!isRender&&resp.status>=500){const m=await mapOriginPdfError(resp);if(m)return json(m,m.status,headersOut);}
  if(resp.status>=500)return json({title:'Bad Gateway',status:502,detail:'The processing service could not complete this request.'},502);
  const out=new Response(resp.body,resp);
  let egress='none';
  if(isNet){const t=bodyObj.url||bodyObj.target||bodyObj.feedUrl||bodyObj.domain||bodyObj.host||'';let host='';try{host=new URL(/^https?:/i.test(t)?t:'https://'+t).hostname;}catch(e){}
    const fixed={'/api/dns-lookup':'cloudflare-dns.com','/api/whois':'rdap.org (or rdap.verisign.com)','/api/domain-age':'rdap.org'};egress=fixed[p]?(fixed[p]+(host?'; query='+host:'')):(host||'user-supplied host');}
  else if(isAI)egress=isByok?(aiProv==='anthropic'?'api.anthropic.com (your key)':'api.openai.com (your key)'):'api.cloudflare.com (Workers AI)';
  else if(isRender)egress=RENDER_MAP[p]==='RENDER'?'api.cloudflare.com (Browser Run)':'none';
  out.headers.set('X-Egress',egress);out.headers.set('Access-Control-Expose-Headers','X-Credits-Used,X-Credits-Limit,X-Credits-Cost,X-Free-Daily-Limit,X-Free-Daily-Remaining,Retry-After,X-Egress,RateLimit-Limit,RateLimit-Remaining');
  for(const [k,v] of Object.entries({...C,...headersOut}))out.headers.set(k,v);
  return out;
}};
const gwRoute=p=>(NET_MAP[p]||AI_MAP[p]||RENDER_MAP[p]||FILE_EPS.has(p))?p:null;
export default{async fetch(request,env,ctx){return withEvents('tools-hub-ratelimit',gwRoute,request,env,ctx,async()=>{
 if(request.method==='OPTIONS')return __inner.fetch(request,env);
 const pol=gwRoute(new URL(request.url).pathname)?getQueryPolicy(request,env):null;
 if(pol&&pol.block)return json({title:'Method Not Allowed',status:405,detail:'Send input in a POST body so it is not placed in the request URL.'},405,{Allow:'POST, OPTIONS'});
 return withDeprecation(await __inner.fetch(request,env),pol&&pol.headers);});}};
