
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-API-Key,Authorization'};
const J=(d,s)=>new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json',...C}});
const LIMITS={free:1000,dev:100000,business:500000};
async function sha(k){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(k));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function gen(){const a=new Uint8Array(24);crypto.getRandomValues(a);const cs='abcdefghijklmnopqrstuvwxyz0123456789';return 'ttdu_free_'+[...a].map(x=>cs[x%36]).join('');}
async function find(env,k){const h=await sha(k);let raw=await env.KEYS_KV.get('kh:'+h);if(!raw){raw=await env.KEYS_KV.get('key:'+k);if(raw){const o=JSON.parse(raw);delete o.key;o.keyHint=k.slice(0,10)+'…'+k.slice(-4);await env.KEYS_KV.put('kh:'+h,JSON.stringify(o));await env.KEYS_KV.delete('key:'+k);if(o.email)await env.KEYS_KV.put('email:'+o.email,'kh:'+h);raw=JSON.stringify(o);}}return raw?{h,d:JSON.parse(raw)}:null;}
const keyOf=r=>r.headers.get('x-api-key')||(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
export default{async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:C});
  const p=new URL(request.url).pathname;
  if(p==='/api/keys/free'&&request.method==='POST'){
    let b;try{b=await request.json();}catch(e){return J({error:'Send JSON {"email":"you@example.com"}'},400);}
    const email=String(b.email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return J({error:'Valid email required'},400);
    if(await env.KEYS_KV.get('email:'+email))return J({error:'A key already exists for this email. Keys are shown only once. If you lost it, email privacy@toolsthatdontupload.com from this address to reset it.'},409);
    const key=gen();const h=await sha(key);
    await env.KEYS_KV.put('kh:'+h,JSON.stringify({email,tier:'free',createdAt:new Date().toISOString(),keyHint:key.slice(0,10)+'…'+key.slice(-4)}));
    await env.KEYS_KV.put('email:'+email,'kh:'+h);
    return J({key,tier:'free',credits:1000,period:'monthly',message:'Save this key now; it will not be shown again. Send it in the X-API-Key header.',revoke:'POST /api/keys/revoke with the key in X-API-Key'},201);
  }
  if(p==='/api/keys/usage'&&request.method==='GET'){
    const k=keyOf(request);if(!k)return J({error:'X-API-Key header required'},401);
    const f=await find(env,k);if(!f)return J({error:'Invalid key'},401);
    const tier=f.d.cancelled_at?'free':(f.d.tier||'free');const limit=LIMITS[tier]||1000;const month=new Date().toISOString().slice(0,7);
    const acct=f.d.account?String(f.d.account).replace(/^kh:|^oa:/,''):f.h;const used=parseInt(await env.RATE_KV.get('cr:'+acct+':'+month)||'0');const prepaid=parseInt(await env.RATE_KV.get('prepaid:'+acct)||'0');
    return J({tier,monthlyCredits:limit,used,remaining:Math.max(0,limit-used)+prepaid,prepaidBalance:prepaid,period:month,keyHint:f.d.keyHint});
  }
  if(p==='/api/keys/revoke'&&request.method==='POST'){
    const k=keyOf(request);if(!k)return J({error:'X-API-Key header required'},401);
    const f=await find(env,k);if(!f)return J({error:'Invalid key'},401);
    await env.KEYS_KV.delete('kh:'+f.h);if(f.d.email){const cur=await env.KEYS_KV.get('email:'+f.d.email);if(cur==='kh:'+f.h)await env.KEYS_KV.delete('email:'+f.d.email);}
    return J({revoked:true});
  }
  return J({error:'Not found'},404);
}};