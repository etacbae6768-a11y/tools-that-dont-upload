
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key'};
const J=(d,s)=>new Response(JSON.stringify(d),{status:s||200,headers:{'Content-Type':'application/json; charset=utf-8','X-Egress':'none',...C}});
const P=(s,t,d)=>new Response(JSON.stringify({type:'about:blank',title:t,status:s,detail:d}),{status:s,headers:{'Content-Type':'application/problem+json',...C}});
const INI=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const MED=['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const FIN=['','k','k','k','n','n','n','t','l','k','m','l','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function romanize(t,cap){let out='';let prevFinal=-1;for(const ch of t){const c=ch.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3){const i=c-0xAC00;const ini=Math.floor(i/588),med=Math.floor((i%588)/28),fin=i%28;let s=INI[ini];if(ini===5&&prevFinal===8)s='l';out+=s+MED[med]+FIN[fin];prevFinal=fin;}else{out+=ch;prevFinal=-1;}}
 if(cap)out=out.replace(/(^|\s)([a-z])/g,(m,a,b)=>a+b.toUpperCase());return out;}
const DIG=['','일','이','삼','사','오','육','칠','팔','구'];
function group4(n,formal){let s='';const u=['천','백','십',''];const d=String(n).padStart(4,'0');for(let i=0;i<4;i++){const x=+d[i];if(!x)continue;if(x===1&&i<3&&!formal)s+=u[i];else s+=DIG[x]+u[i];}return s;}
function amountWords(n,formal){if(n===0)return '영';const big=['','만','억','조','경'];let parts=[];let i=0;let x=BigInt(n);while(x>0n){const g=Number(x%10000n);if(g)parts.unshift((g===1&&i===1&&!formal)?'만':group4(g,formal)+big[i]);x=x/10000n;i++;}return parts.join(formal?'':' ');}
function josa(word,pair){const p={'은/는':['은','는'],'이/가':['이','가'],'을/를':['을','를'],'과/와':['과','와'],'아/야':['아','야'],'이여/여':['이여','여'],'으로/로':['으로','로']}[pair];if(!p)return null;const last=word.trim().slice(-1);const c=last.charCodeAt(0);let has=false,rieul=false;if(c>=0xAC00&&c<=0xD7A3){const f=(c-0xAC00)%28;has=f>0;rieul=f===8;}else if(/[0-9]/.test(last)){has='013678'.includes(last);rieul='178'.includes(last);}else if(/[a-z]/i.test(last)){has=/[lmnbkpt]$/i.test(last);rieul=/l$/i.test(last);}
 if(pair==='으로/로')return word+(has&&!rieul?p[0]:p[1]);return word+(has?p[0]:p[1]);}
function chosung(t){let o='';for(const ch of t){const c=ch.charCodeAt(0);o+=(c>=0xAC00&&c<=0xD7A3)?CHO[Math.floor((c-0xAC00)/588)]:ch;}return o;}
function bizno(v){const d=String(v).replace(/\D/g,'');if(d.length!==10)return{valid:false,reason:'must be 10 digits'};const w=[1,3,7,1,3,7,1,3,5];let s=0;for(let i=0;i<9;i++)s+=(+d[i])*w[i];s+=Math.floor((+d[8])*5/10);const chk=(10-(s%10))%10;return{valid:chk===+d[9],formatted:d.slice(0,3)+'-'+d.slice(3,5)+'-'+d.slice(5),note:'Checksum only. Does not confirm the business is registered or active.'};}
function mask(t){const found={rrn:0,phone:0,email:0,card:0,account:0};let o=t;
 o=o.replace(/\b(\d{6})[-\s]?([1-8])\d{6}\b/g,(m,a,b)=>{found.rrn++;return a+'-'+b+'******';});
 o=o.replace(/\b(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})\b/g,(m,a,b,c,d)=>{found.card++;return '****-****-****-'+d;});
 o=o.replace(/\b(01[016789])[-.\s]?(\d{3,4})[-.\s]?(\d{4})\b/g,(m,a,b,c)=>{found.phone++;return a+'-'+'*'.repeat(b.length)+'-'+c;});
 o=o.replace(/\b(0\d{1,2})[-.\s](\d{3,4})[-.\s](\d{4})\b/g,(m,a,b,c)=>{found.phone++;return a+'-'+'*'.repeat(b.length)+'-'+c;});
 o=o.replace(/([A-Za-z0-9._%+-]{1,2})([A-Za-z0-9._%+-]*)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,(m,a,b,c)=>{found.email++;return a+'*'.repeat(Math.max(b.length,1))+'@'+c;});
 return{masked:o,found};}
function rnd(n){const a=new Uint32Array(1);const lim=Math.floor(0xFFFFFFFF/n)*n;let x;do{crypto.getRandomValues(a);x=a[0];}while(x>=lim);return x%n;}
function passwordGen(b){const len=Math.min(Math.max(parseInt(b.length??16)||16,4),128);const cnt=Math.min(Math.max(parseInt(b.count??1)||1,1),20);
 const sets=[];if(b.lowercase!==false)sets.push('abcdefghijklmnopqrstuvwxyz');if(b.uppercase!==false)sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');if(b.numbers!==false)sets.push('0123456789');if(b.symbols!==false)sets.push('!@#$%^&*()-_=+[]{};:,.?');
 if(!sets.length)return null;const all=sets.join('');const out=[];for(let k=0;k<cnt;k++){const chars=sets.map(s=>s[rnd(s.length)]);while(chars.length<len)chars.push(all[rnd(all.length)]);for(let i=chars.length-1;i>0;i--){const j=rnd(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}out.push(chars.slice(0,len).join(''));}return{passwords:out,length:len,count:cnt,charsets:sets.length};}
function words(t){return String(t).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').split(/[^A-Za-z0-9\u00C0-\uFFFF]+/).filter(Boolean);}
function textCase(t,cs){const w=words(t);const lw=w.map(x=>x.toLowerCase());const cap=x=>x.charAt(0).toUpperCase()+x.slice(1);
 switch(cs){case'upper':return String(t).toUpperCase();case'lower':return String(t).toLowerCase();case'title':return lw.map(cap).join(' ');case'sentence':{const s=lw.join(' ');return cap(s);}
 case'camel':return lw.map((x,i)=>i?cap(x):x).join('');case'pascal':return lw.map(cap).join('');case'snake':return lw.join('_');case'kebab':return lw.join('-');case'constant':return lw.join('_').toUpperCase();case'dot':return lw.join('.');default:return null;}}
const ROUTES={
 '/api/ko-romanize':b=>{if(typeof b.text!=='string'||!b.text)return P(400,'Bad Request','Send {"text":"박지훈"}');return J({romanized:romanize(b.text,b.capitalize!==false),system:'Revised Romanization, syllable by syllable (as used for personal names); sound-change rules between syllables are not applied',original:b.text});},
 '/api/ko-amount-words':b=>{const n=Number(String(b.amount??'').replace(/[,\s원]/g,''));if(!Number.isFinite(n)||n<0||!Number.isInteger(n)||n>=1e20)return P(400,'Bad Request','Send {"amount":1234000} (non-negative integer)');return J({amount:n,formal:'일금 '+amountWords(n,true)+'원정',plain:amountWords(n,false)+' 원',hangul:amountWords(n,true)});},
 '/api/ko-josa':b=>{if(typeof b.word!=='string'||!b.word)return P(400,'Bad Request','Send {"word":"사과","pair":"을/를"}');const pair=b.pair||'은/는';const r=josa(b.word,pair);if(r===null)return P(400,'Bad Request','pair must be one of 은/는, 이/가, 을/를, 과/와, 아/야, 이여/여, 으로/로');return J({result:r,word:b.word,pair});},
 '/api/ko-chosung':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"대한민국"}');return J({chosung:chosung(b.text),original:b.text});},
 '/api/kr-business-number':b=>{if(!b.number)return P(400,'Bad Request','Send {"number":"220-81-62517"}');return J({number:String(b.number),...bizno(b.number)});},
 '/api/ko-pii-mask':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"연락처 010-1234-5678"}');return J(mask(b.text));},
 '/api/password-gen':b=>{const r=passwordGen(b||{});if(!r)return P(400,'Bad Request','At least one character set must be enabled');return J(r);},
 '/api/text-case':b=>{if(typeof b.text!=='string')return P(400,'Bad Request','Send {"text":"helloWorld","case":"snake"}');const cs=String(b.case||b.to||'').toLowerCase();const r=textCase(b.text,cs);if(r===null)return P(400,'Bad Request','case must be one of upper, lower, title, sentence, camel, pascal, snake, kebab, constant, dot');return J({result:r,case:cs});},
};
export default{async fetch(req){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:C});const u=new URL(req.url);const h=ROUTES[u.pathname];if(!h)return P(404,'Not Found','Unknown endpoint');
 if(req.method!=='GET'&&req.method!=='POST')return P(405,'Method Not Allowed','Use GET or POST');let b={};if(req.method==='POST'){const t=await req.text();if(t.trim()){try{b=JSON.parse(t);}catch(e){return P(400,'Bad Request','Request body is not valid JSON.');}}}else{u.searchParams.forEach((v,k)=>b[k]=v);}
 if(b===null||typeof b!=='object'||Array.isArray(b))return P(400,'Bad Request','Body must be a JSON object');try{return h(b);}catch(e){return P(400,'Bad Request','Could not process input');}}};
