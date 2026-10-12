// tools-hub-render: HTML/Markdown -> PDF via Cloudflare Browser Run (Quick Actions). Markdown parser is our own code.
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key'};
const P=(s,t,d)=>new Response(JSON.stringify({type:'about:blank',title:t,status:s,detail:d}),{status:s,headers:{'Content-Type':'application/problem+json',...C}});
const ACC='bfe736ca1eb7ad4f0556c29358a77eda';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function inline(s){let t=esc(s);const codes=[];t=t.replace(/\x60([^\x60]+)\x60/g,(m,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000';});
 t=t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,(m,alt)=>alt?'<span class="img-alt">['+alt+']</span>':'');
 t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g,(m,txt,u)=>'<a href="'+u+'">'+txt+'</a>');
 t=t.replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>').replace(/~~([^~]+)~~/g,'<del>$1</del>');
 return t.replace(/\u0000(\d+)\u0000/g,(m,i)=>'<code>'+codes[+i]+'</code>');}
function mdToHtml(md){const L=String(md).replace(/\r\n?/g,'\n').split('\n');let out=[];let i=0;
 const isTableSep=s=>/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(s);const cells=s=>s.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
 while(i<L.length){const line=L[i];
  if(/^\s*$/.test(line)){i++;continue;}
  let m;
  if((m=line.match(/^\x60\x60\x60\s*([\w-]*)/))){const buf=[];i++;while(i<L.length&&!/^\x60\x60\x60/.test(L[i]))buf.push(L[i++]);i++;out.push('<pre><code>'+esc(buf.join('\n'))+'</code></pre>');continue;}
  if((m=line.match(/^(#{1,6})\s+(.*)$/))){out.push('<h'+m[1].length+'>'+inline(m[2].replace(/\s+#+\s*$/,''))+'</h'+m[1].length+'>');i++;continue;}
  if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)){out.push('<hr>');i++;continue;}
  if(/\|/.test(line)&&i+1<L.length&&isTableSep(L[i+1])){const head=cells(line);i+=2;const rows=[];while(i<L.length&&/\|/.test(L[i])&&!/^\s*$/.test(L[i]))rows.push(cells(L[i++]));out.push('<table><thead><tr>'+head.map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+head.map((_,k)=>'<td>'+inline(r[k]||'')+'</td>').join('')+'</tr>').join('')+'</tbody></table>');continue;}
  if(/^\s*>/.test(line)){const buf=[];while(i<L.length&&/^\s*>/.test(L[i]))buf.push(L[i++].replace(/^\s*>\s?/,''));out.push('<blockquote>'+mdToHtml(buf.join('\n'))+'</blockquote>');continue;}
  if(/^\s*([-*+]|\d+[.)])\s+/.test(line)){const stack=[];const html=[];
   while(i<L.length&&(m=L[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/))){const ind=m[1].replace(/\t/g,'    ').length;const ord=/\d/.test(m[2]);
    while(stack.length&&ind<stack[stack.length-1].ind){html.push('</li></'+stack.pop().tag+'>');}
    const tag=ord?'ol':'ul';if(stack.length&&ind===stack[stack.length-1].ind&&stack[stack.length-1].tag!==tag){html.push('</li></'+stack.pop().tag+'>');}if(!stack.length||ind>stack[stack.length-1].ind){stack.push({ind,tag});html.push('<'+tag+'><li>'+inline(m[3]));}else{html.push('</li><li>'+inline(m[3]));}
    i++;}
   while(stack.length)html.push('</li></'+stack.pop().tag+'>');out.push(html.join(''));continue;}
  const buf=[line];i++;while(i<L.length&&!/^\s*$/.test(L[i])&&!/^(#{1,6}\s|\x60\x60\x60|\s*>|\s*([-*+]|\d+[.)])\s+)/.test(L[i])&&!(/\|/.test(L[i])&&i+1<L.length&&isTableSep(L[i+1])))buf.push(L[i++]);
  out.push('<p>'+buf.map(inline).join('<br>')+'</p>');}
 return out.join('\n');}
const CSS='@page{margin:18mm 16mm}body{font-family:"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;font-size:11pt;line-height:1.65;color:#111}h1{font-size:20pt;margin:0 0 10pt}h2{font-size:15pt;margin:16pt 0 8pt;border-bottom:1px solid #ddd;padding-bottom:3pt}h3{font-size:12.5pt;margin:12pt 0 6pt}p{margin:0 0 8pt}table{border-collapse:collapse;width:100%;margin:8pt 0}th,td{border:1px solid #999;padding:4pt 6pt;text-align:left;vertical-align:top}th{background:#f2f2f2}pre{background:#f6f6f6;padding:8pt;border-radius:4pt;white-space:pre-wrap;font-size:9.5pt}code{font-family:"Noto Sans Mono",Consolas,monospace;background:#f2f2f2;padding:0 2pt}pre code{background:none}blockquote{margin:8pt 0;padding:2pt 10pt;border-left:3pt solid #ccc;color:#444}hr{border:0;border-top:1px solid #ccc;margin:12pt 0}.img-alt{color:#777}a{color:#1a56db}';
async function renderPdf(env,html,b){if(!env.BR_TOKEN)return P(503,'Service Unavailable','PDF rendering is not configured.');
 const fmt=['A4','A3','A5','Letter','Legal'].includes(String(b.format||'A4'))?String(b.format||'A4'):'A4';
 const body={html,rejectRequestPattern:['^https?:','^wss?:','^ftp:','^file:'],gotoOptions:{waitUntil:'load',timeout:20000},pdfOptions:{format:fmt.toLowerCase(),landscape:b.landscape===true,printBackground:true,preferCSSPageSize:true}};
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+ACC+'/browser-run/pdf',{method:'POST',headers:{'Authorization':'Bearer '+env.BR_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok||!(r.headers.get('content-type')||'').includes('pdf')){return P(502,'Bad Gateway','The PDF renderer failed. Try a smaller document.');}
 return new Response(r.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="'+(b.filename||'document').replace(/[^\w.-]+/g,'_').slice(0,60)+'.pdf"','X-Egress':'api.cloudflare.com (Browser Run)','X-Render-Ms':r.headers.get('x-browser-ms-used')||'',...C}});}
export default{async fetch(req,env){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:C});const p=new URL(req.url).pathname;
 if(p!=='/api/html-to-pdf'&&p!=='/api/markdown-to-pdf')return P(404,'Not Found','Unknown endpoint');if(req.method!=='POST')return P(405,'Method Not Allowed','Use POST');
 const t=await req.text();if(t.length>2*1024*1024)return P(413,'Payload Too Large','Max 2 MB.');let b;try{b=JSON.parse(t||'{}');}catch(e){return P(400,'Bad Request','Request body is not valid JSON.');}
 if(p==='/api/html-to-pdf'){if(typeof b.html!=='string'||!b.html.trim())return P(400,'Bad Request','Send {"html":"<h1>Hello</h1>"}');let h=b.html.replace(/<script\b[\s\S]*?<\/script\s*>/gi,'').replace(/<script\b[^>]*>/gi,'').replace(/<(iframe|object|embed|frame|frameset)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi,'').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/(href|src|action|formaction)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi,'$1="#"').replace(/<meta[^>]+http-equiv\s*=\s*["']?refresh[^>]*>/gi,'');if(!/<meta[^>]+charset/i.test(h))h='<meta charset="utf-8">'+h;return renderPdf(env,h,b);}
 if(typeof b.markdown!=='string'||!b.markdown.trim())return P(400,'Bad Request','Send {"markdown":"# Title"}');
 const title=b.title?'<title>'+esc(b.title)+'</title>':'';const html='<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'+title+'<style>'+CSS+'</style></head><body>'+mdToHtml(b.markdown)+'</body></html>';
 return renderPdf(env,html,b);}};
