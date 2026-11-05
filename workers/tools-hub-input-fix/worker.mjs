// tools-hub-input-fix: Validate input for hub endpoints
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};

// Endpoints that need input validation (hub Pages Function returns 200 on empty)
const REQUIRE_BODY = {
  '/api/hash': ['text'],
  '/api/base64': ['text'],
  '/api/diff': ['text1','text2'],
  '/api/json-format': ['json'],
  '/api/csv-to-json': ['csv'],
  '/api/json-to-csv': ['data'],
  '/api/yaml-to-json': ['yaml'],
  '/api/url-encode': ['text'],
  '/api/markdown': ['markdown'],
  '/api/text-count': ['text'],
  '/api/aes-encrypt': ['text','password'],
  '/api/aes-decrypt': ['encrypted','password'],
  '/api/pdf-extract': ['file'],
};


function __b64enc(s){const u=new TextEncoder().encode(s);let bin='';for(let i=0;i<u.length;i+=0x8000)bin+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(bin);}
function __b64dec(s){const clean=String(s).replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');const pad=clean+'==='.slice((clean.length+3)%4);const bin=atob(pad);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder('utf-8',{fatal:false}).decode(u);}
async function __base64(request){let b={};if(request.method==='POST'){try{b=await request.json();}catch(e){}}else{const q=new URL(request.url).searchParams;b={text:q.get('text'),mode:q.get('mode')};}
const mode=(b.mode||'encode')==='decode'?'decode':'encode';if(typeof b.text!=='string'||!b.text)return new Response(JSON.stringify({error:'Missing required fields: text'}),{status:400,headers:{'Content-Type':'application/json',...C}});
let result;try{result=mode==='encode'?__b64enc(b.text):__b64dec(b.text);}catch(e){return new Response(JSON.stringify({error:'Input is not valid Base64.'}),{status:400,headers:{'Content-Type':'application/json',...C}});}
return new Response(JSON.stringify({result,mode,encoding:'utf-8'}),{headers:{'Content-Type':'application/json',...C}});}
const __ttduInner = {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: C });
    }
    
    var url = new URL(request.url);
    var p = url.pathname;
    if (p === '/api/base64') return __base64(request);
    var required = REQUIRE_BODY[p];
    
    if (required && request.method === 'POST') {
      try {
        var ct = request.headers.get('content-type') || '';
        if (ct.includes('json')) {
          var body = await request.clone().json();
          var missing = required.filter(function(k) { return !body[k] && body[k] !== 0; });
          if (missing.length > 0) {
            return new Response(JSON.stringify({ error: 'Missing required fields: ' + missing.join(', ') }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...C }
            });
          }
        }
      } catch(e) {
        // If body parsing fails for multipart, let it through
      }
    }
    
    // Pass through to origin
    return fetch(request);
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
