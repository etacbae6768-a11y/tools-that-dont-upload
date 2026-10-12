
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-API-Key','Access-Control-Expose-Headers':'Content-Disposition,X-Egress'};
const P=(s,t,d)=>new Response(JSON.stringify({type:'about:blank',title:t,status:s,detail:d}),{status:s,headers:{'Content-Type':'application/problem+json',...C}});
const enc=new TextEncoder();
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){const parts=[];const central=[];let off=0;
 for(const [name,content] of files){const nb=enc.encode(name);const data=typeof content==='string'?enc.encode(content):content;const crc=crc32(data);
  const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,nb.length,true);lh.setUint16(28,0,true);
  parts.push(new Uint8Array(lh.buffer),nb,data);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
  central.push(new Uint8Array(ch.buffer),nb);off+=30+nb.length+data.length;}
 const cs=central.reduce((a,b)=>a+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 const all=[...parts,...central,new Uint8Array(e.buffer)];const tot=all.reduce((a,b)=>a+b.length,0);const out=new Uint8Array(tot);let p=0;for(const a of all){out.set(a,p);p+=a.length;}return out;}
const X=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
const DIG=['','일','이','삼','사','오','육','칠','팔','구'];
function g4(n){let s='';const u=['천','백','십',''];const d=String(n).padStart(4,'0');for(let i=0;i<4;i++){const x=+d[i];if(x)s+=DIG[x]+u[i];}return s;}
function won(n){if(!n)return '영';const big=['','만','억','조'];let r=[];let i=0;while(n>0){const g=n%10000;if(g)r.unshift(g4(g)+big[i]);n=Math.floor(n/10000);i++;}return r.join('');}
const fmt=n=>Number(n).toLocaleString('ko-KR');
// ---------- XLSX ----------
function col(i){let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
function xlsx(title,rows,widths,merges){
 const sheetRows=rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>{if(v===null||v===undefined||v==='')return '';const ref=col(ci)+(ri+1);let s=0;let val=v;if(typeof v==='object'){s=v.s||0;val=v.v;}
   if(typeof val==='number')return '<c r="'+ref+'" s="'+(s||2)+'"><v>'+val+'</v></c>';return '<c r="'+ref+'" t="inlineStr" s="'+s+'"><is><t xml:space="preserve">'+X(val)+'</t></is></c>';}).join('')+'</row>').join('');
 const cols='<cols>'+widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols>';
 const mg=merges&&merges.length?'<mergeCells count="'+merges.length+'">'+merges.map(m=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>':'';
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+cols+'<sheetData>'+sheetRows+'</sheetData>'+mg+'<pageSetup paperSize="9" orientation="portrait"/></worksheet>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="3"><font><sz val="10"/><name val="맑은 고딕"/></font><font><b/><sz val="18"/><name val="맑은 고딕"/></font><font><b/><sz val="10"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf fontId="0" borderId="0"/><xf fontId="1" applyFont="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf fontId="0" borderId="1" numFmtId="164" applyBorder="1" applyNumberFormat="1"/><xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf fontId="0" borderId="1" applyBorder="1"/></cellXfs></styleSheet>';
 return zip([
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+X(title).slice(0,31)+'" sheetId="1" r:id="rId1"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/worksheets/sheet1.xml',sheet],['xl/styles.xml',styles]]);}
// ---------- DOCX ----------
function para(text,o){o=o||{};const rp='<w:rPr><w:rFonts w:ascii="Malgun Gothic" w:eastAsia="맑은 고딕" w:hAnsi="Malgun Gothic"/>'+(o.b?'<w:b/>':'')+'<w:sz w:val="'+(o.sz||21)+'"/></w:rPr>';const pp='<w:pPr>'+(o.center?'<w:jc w:val="center"/>':o.right?'<w:jc w:val="right"/>':'')+'<w:spacing w:after="'+(o.after??120)+'"/></w:pPr>';
 return '<w:p>'+pp+String(text).split('\n').map((t,i)=>(i?'<w:r><w:br/></w:r>':'')+'<w:r>'+rp+'<w:t xml:space="preserve">'+X(t)+'</w:t></w:r>').join('')+'</w:p>';}
function table(rows){const b='<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>'<w:'+s+' w:val="single" w:sz="4" w:color="000000"/>').join('')+'</w:tblBorders>';
 return '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>'+b+'</w:tblPr>'+rows.map(r=>'<w:tr>'+r.map((c,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+(i===0?1400:3600)+'" w:type="dxa"/>'+(i===0?'<w:shd w:val="clear" w:fill="EFEFEF"/>':'')+'</w:tcPr>'+para(c,{b:i===0,after:40})+'</w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';}
function docx(body){const doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1200" w:bottom="1440" w:left="1200"/></w:sectPr></w:body></w:document>';
 return zip([['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
  ['word/document.xml',doc]]);}
// ---------- templates ----------
function needItems(b){if(!Array.isArray(b.items)||!b.items.length)throw new Error('items must be a non-empty array of {name, qty, unit_price}');return b.items.map((it,i)=>{const q=Number(it.qty??it.quantity??1),u=Number(it.unit_price??it.price??0);if(!it.name||!Number.isFinite(q)||!Number.isFinite(u))throw new Error('item '+(i+1)+' needs name, qty, unit_price');const amt=Math.round(q*u);return{name:String(it.name),spec:String(it.spec||''),qty:q,unit:u,amt,note:String(it.note||'')};});}
function totals(items,b){const supply=items.reduce((a,x)=>a+x.amt,0);const vatIncluded=b.vat==='included';const vat=b.vat==='none'?0:vatIncluded?Math.round(supply-supply/1.1):Math.round(supply*0.1);const s=vatIncluded?supply-vat:supply;return{supply:s,vat,total:s+vat};}
function party(o){o=o||{};return [o.name||'',o.business_number?'사업자번호 '+o.business_number:'',o.representative?'대표 '+o.representative:'',o.address||'',o.phone||''].filter(Boolean).join(' / ');}
function quoteRows(kind,b){const items=needItems(b);const t=totals(items,b);const H={s:3};
 const rows=[[{v:kind,s:1}],[],['작성일',b.date||new Date().toISOString().slice(0,10)],[kind==='견적서'?'수신':'공급받는자',party(b.to)],['공급자',party(b.from)],[],
  ['합계금액 (부가세 '+(b.vat==='none'?'없음':'포함')+')','일금 '+won(t.total)+'원정 (₩'+fmt(t.total)+')'],[],
  [{v:'No',s:3},{v:'품목',s:3},{v:'규격',s:3},{v:'수량',s:3},{v:'단가',s:3},{v:'금액',s:3},{v:'비고',s:3}]];
 items.forEach((x,i)=>rows.push([{v:i+1,s:4},{v:x.name,s:4},{v:x.spec,s:4},{v:x.qty,s:2},{v:x.unit,s:2},{v:x.amt,s:2},{v:x.note,s:4}]));
 rows.push([],['','','','','공급가액',{v:t.supply,s:2}],['','','','','부가세',{v:t.vat,s:2}],['','','','','합계',{v:t.total,s:2}]);
 if(b.memo)rows.push([],['비고',String(b.memo)]);if(kind==='견적서')rows.push([],['유효기간',b.valid_until||'발행일로부터 30일']);
 return{rows,t};}

// ---- kr-tax-invoice-upload: builds the HomeTax "전자(세금)계산서 일괄발급" upload sheet (data from row 7). Our own code. ----
const TU_HDR=["전자(세금)계산서 종류\n(01:일반, 02:영세율)","작성일자","공급자 등록번호\n(\"-\" 없이 입력)","공급자\n 종사업장번호","공급자 상호","공급자 성명","공급자 사업장주소","공급자 업태","공급자 종목","공급자 이메일","공급받는자 등록번호\n(\"-\" 없이 입력)","공급받는자 \n종사업장번호","공급받는자 상호 ","공급받는자 성명","공급받는자 사업장주소","공급받는자 업태","공급받는자 종목","공급받는자 이메일1","공급받는자 이메일2","공급가액\n합계","세액\n합계","비고","일자1\n(2자리, 작성년월 제외)","품목1","규격1","수량1","단가1","공급가액1","세액1","품목비고1","일자2\n(2자리, 작성년월 제외)","품목2","규격2","수량2","단가2","공급가액2","세액2","품목비고2","일자3\n(2자리, 작성년월 제외)","품목3","규격3","수량3","단가3","공급가액3","세액3","품목비고3","일자4\n(2자리, 작성년월 제외)","품목4","규격4","수량4","단가4","공급가액4","세액4","품목비고4","현금","수표","어음","외상미수금","영수(01),\n청구(02)"];
function tuBytes(s){let n=0;for(const ch of String(s??''))n+=ch.charCodeAt(0)>127?2:1;return n;}
function tuDigits(s){return String(s??'').replace(/\D/g,'');}
function tuBizOk(n){const d=tuDigits(n).split('').map(Number);if(d.length!==10)return false;const w=[1,3,7,1,3,7,1,3,5];let s=0;for(let i=0;i<9;i++)s+=d[i]*w[i];s+=Math.floor(d[8]*5/10);return (10-s%10)%10===d[9];}
function tuNum(v){if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)?n:NaN;}
function taxInvoiceUpload(b){const inv=Array.isArray(b.invoices)?b.invoices:null;if(!inv||!inv.length)throw new Error('invoices must be a non-empty array.');if(inv.length>100)throw new Error('HomeTax accepts at most 100 invoices per upload file.');
 const errors=[],warnings=[],rows=[];let sumSupply=0,sumTax=0;
 inv.forEach((v,ix)=>{const E=m=>errors.push('invoice '+(ix+1)+': '+m),W=m=>warnings.push('invoice '+(ix+1)+': '+m);const s=v.supplier||{},r=v.buyer||{};
  const type=String(v.type??'01').padStart(2,'0');if(!['01','02'].includes(type))E('type must be "01" (일반) or "02" (영세율)');
  const date=tuDigits(v.date);const dt=new Date(date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+'T00:00:00Z');if(date.length!==8||isNaN(dt)||dt.toISOString().slice(0,10).replace(/-/g,'')!==date)E('date must be a valid YYYY-MM-DD or YYYYMMDD');
  const sb=tuDigits(s.business_number);if(sb.length!==10)E('supplier.business_number must have 10 digits');else if(!tuBizOk(sb))E('supplier.business_number checksum is invalid');
  const rb=tuDigits(r.business_number);if(!(rb.length===10||rb.length===13))E('buyer.business_number must be 10 digits (business), 13 digits (resident) or 9999999999999 (foreigner)');else if(rb.length===10&&!tuBizOk(rb))E('buyer.business_number checksum is invalid');
  if(rb==='9999999999999'&&!v.note)E('foreign buyer: put the alien registration or passport number in note');
  const req=[['supplier.name',s.name],['supplier.representative',s.representative],['buyer.name',r.name],['buyer.representative',r.representative]];req.forEach(([k,x])=>{if(!x||!String(x).trim())E(k+' is required');});
  const lim=[['supplier.name',s.name,70],['supplier.representative',s.representative,30],['supplier.address',s.address,150],['supplier.business_type',s.business_type,40],['supplier.business_item',s.business_item,60],['supplier.email',s.email,40],['buyer.name',r.name,70],['buyer.representative',r.representative,30],['buyer.address',r.address,150],['buyer.business_type',r.business_type,40],['buyer.business_item',r.business_item,60],['buyer.email',r.email,40],['buyer.email2',r.email2,40],['note',v.note,150]];
  lim.forEach(([k,x,m])=>{if(x&&tuBytes(x)>m)E(k+' is '+tuBytes(x)+' bytes; HomeTax allows '+m+' (Korean characters count as 2)');});
  if(s.branch_id&&!/^\d{4}$/.test(String(s.branch_id)))E('supplier.branch_id must be 4 digits');if(r.branch_id&&!/^\d{4}$/.test(String(r.branch_id)))E('buyer.branch_id must be 4 digits');
  const items=Array.isArray(v.items)?v.items:[];if(items.length<1||items.length>4)E('items must have 1 to 4 lines (HomeTax upload limit)');
  let ts=0,tt=0;const itemCells=[];
  items.slice(0,4).forEach((it,k)=>{const q=tuNum(it.quantity),up=tuNum(it.unit_price);let sa=tuNum(it.supply_amount);let ta=tuNum(it.tax_amount);
   if(!it.name||!String(it.name).trim())E('item '+(k+1)+': name is required');if(it.name&&tuBytes(it.name)>100)E('item '+(k+1)+': name exceeds 100 bytes');if(it.spec&&tuBytes(it.spec)>60)E('item '+(k+1)+': spec exceeds 60 bytes');
   if(sa===null&&q!==null&&up!==null&&!isNaN(q)&&!isNaN(up)){sa=Math.round(q*up);W('item '+(k+1)+': supply_amount computed as quantity × unit_price = '+sa);}
   if(sa===null||isNaN(sa))E('item '+(k+1)+': supply_amount is required (or quantity and unit_price)');
   if(ta===null){ta=type==='02'?0:Math.floor((sa||0)*0.1);W('item '+(k+1)+': tax_amount computed as '+(type==='02'?'0 (영세율)':'10% rounded down = '+ta));}
   if(isNaN(ta))E('item '+(k+1)+': tax_amount must be a number');if(type==='02'&&ta)E('item '+(k+1)+': 영세율 (02) invoices must have tax_amount 0');
   if(q!==null&&!isNaN(q)&&!/^\d{1,10}(\.\d{1,2})?$/.test(String(Math.abs(q))))E('item '+(k+1)+': quantity allows 10 digits and 2 decimals');
   if(up!==null&&!isNaN(up)&&!/^\d{1,13}(\.\d{1,2})?$/.test(String(Math.abs(up))))E('item '+(k+1)+': unit_price allows 13 digits and 2 decimals');
   if(q!==null&&up!==null&&sa!==null&&!isNaN(q*up)&&Math.abs(q*up-sa)>1)W('item '+(k+1)+': quantity × unit_price ('+(q*up)+') differs from supply_amount ('+sa+')');
   let day=it.day!==undefined&&it.day!==null&&it.day!==''?String(it.day).padStart(2,'0'):date.slice(6,8);if(!/^\d{2}$/.test(day)||+day<1||+day>31)E('item '+(k+1)+': day must be 01-31');
   ts+=sa||0;tt+=ta||0;itemCells.push(day,String(it.name??''),String(it.spec??''),q===null?'':String(q),up===null?'':String(up),String(sa??''),String(ta??''),String(it.note??''));});
  while(itemCells.length<32)itemCells.push('');
  const pay=v.payment||{};const pv=k=>{const x=tuNum(pay[k]);return x===null||isNaN(x)?'':String(x);};
  const purpose=String(v.purpose??'').padStart(2,'0');if(!['01','02'].includes(purpose))E('purpose is required: "01" 영수 (paid) or "02" 청구 (not yet paid)');
  const paySum=['cash','check','bill','receivable'].reduce((a,k)=>a+(tuNum(pay[k])||0),0);if(paySum&&paySum!==ts+tt)W('payment amounts ('+paySum+') do not add up to the total ('+(ts+tt)+')');
  sumSupply+=ts;sumTax+=tt;
  rows.push([type,date,sb,String(s.branch_id??''),String(s.name??''),String(s.representative??''),String(s.address??''),String(s.business_type??''),String(s.business_item??''),String(s.email??''),rb,String(r.branch_id??''),String(r.name??''),String(r.representative??''),String(r.address??''),String(r.business_type??''),String(r.business_item??''),String(r.email??''),String(r.email2??''),String(ts),String(tt),String(v.note??''),...itemCells,pv('cash'),pv('check'),pv('bill'),pv('receivable'),purpose]);});
 return {errors,warnings,rows,totals:{invoices:inv.length,supply_amount:sumSupply,tax_amount:sumTax,total:sumSupply+sumTax}};}

const ROUTES={
 '/api/kr-tax-invoice-upload':b=>{const r=taxInvoiceUpload(b);if(r.errors.length)throw new Error('Validation failed: '+r.errors.join(' | '));
  const rows=[['엑셀 업로드 양식(전자세금계산서-일반(영세율)) - 100건 이하'],['○ 홈택스 > 전자(세금)계산서 일괄발급(엑셀 업로드)용 파일입니다. 실제 DATA는 7행부터 들어 있습니다.'],['○ 업로드 전에 공급자·공급받는자 정보, 금액, 영수/청구 구분을 확인하세요. 홈택스 검증 결과가 최종 기준입니다.'],['○ Tools That Don\'t Upload에서 생성 (홈택스 공식 양식의 열 구성과 동일).'],[''],TU_HDR,...r.rows];
  return{bytes:xlsx('엑셀업로드양식',rows,new Array(59).fill(14),[]),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',name:'hometax-upload.xlsx',meta:Object.assign({},r.totals,{warnings:r.warnings.length})};},
 '/api/kr-quote':b=>{const{rows,t}=quoteRows('견적서',b);return{bytes:xlsx('견적서',rows,[8,26,14,8,12,14,16],['A1:G1']),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',name:'quote.xlsx',meta:t};},
 '/api/kr-transaction-statement':b=>{const{rows,t}=quoteRows('거래명세서',b);return{bytes:xlsx('거래명세서',rows,[8,26,14,8,12,14,16],['A1:G1']),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',name:'transaction-statement.xlsx',meta:t};},
 '/api/kr-loan-agreement':b=>{const a=Number(b.amount);if(!b.lender||!b.borrower||!Number.isFinite(a)||a<=0)throw new Error('lender, borrower and amount are required');const L=b.lender,B=b.borrower;
  const body=para('차 용 증',{b:true,sz:40,center:true,after:300})+para('금 일금 '+won(a)+'원정 (₩'+fmt(a)+')',{b:true,sz:24,center:true,after:300})+
   para('위 금액을 아래 조건으로 차용하였음을 확인합니다.',{after:200})+
   table([['차용일',b.loan_date||''],['변제기일',b.due_date||''],['이자',b.interest_rate!=null?('연 '+b.interest_rate+'%'):'무이자'],['이자 지급일',b.interest_day||'-'],['변제 방법',b.repayment||'채권자 지정 계좌로 송금'],['특약',b.special_terms||'-']])+
   para('',{after:200})+para('1. 채무자는 변제기일까지 원금(및 약정 이자)을 채권자에게 지급한다.\n2. 변제기일까지 변제하지 아니한 때에는 지연 기간에 대하여 법정 이율 범위 내에서 지연손해금을 지급한다.\n3. 이 증서에 관한 분쟁은 채권자 주소지 관할 법원으로 한다.',{after:300})+
   para(b.date||new Date().toISOString().slice(0,10),{center:true,after:300})+
   table([['채권자',[L.name,L.birth||L.id_hint||'',L.address||'',L.phone||''].filter(Boolean).join(' / ')+'   (인)'],['채무자',[B.name,B.birth||B.id_hint||'',B.address||'',B.phone||''].filter(Boolean).join(' / ')+'   (인)']])+
   para('',{after:100})+para('※ 일반 서식 예시이며 법률 자문이 아닙니다. 중요한 거래는 전문가와 확인하세요.',{sz:16});
  return{bytes:docx(body),type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',name:'loan-agreement.docx',meta:{amount:a}};},
 '/api/kr-employment-contract':b=>{const E=b.employer||{},W=b.employee||{};if(!E.name||!W.name||!b.start_date||!b.wage)throw new Error('employer.name, employee.name, start_date and wage are required');
  const body=para('표준근로계약서',{b:true,sz:36,center:true,after:300})+
   para((E.name)+' (이하 "사업주"라 함)과(와) '+W.name+' (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.',{after:200})+
   table([['1. 근로계약기간',b.start_date+' 부터 '+(b.end_date?b.end_date+' 까지':'(기간의 정함이 없음)')],['2. 근무 장소',b.workplace||''],['3. 업무의 내용',b.job||''],['4. 소정근로시간',(b.work_start||'09:00')+' ~ '+(b.work_end||'18:00')+' (휴게시간 '+(b.break||'12:00 ~ 13:00')+')'],['5. 근무일/휴일','매주 '+(b.workdays||'5')+'일 근무, 주휴일 매주 '+(b.weekly_holiday||'일요일')],
    ['6. 임금',(b.wage_type||'월급')+' '+fmt(Number(b.wage))+'원'+(b.bonus?(' / 상여금 '+b.bonus):'')+(b.allowances?(' / 제수당 '+b.allowances):'')],['  임금지급일','매월 '+(b.pay_day||'10')+'일 (휴일의 경우 전일 지급)'],['  지급방법',b.pay_method||'근로자 명의 예금통장에 입금'],
    ['7. 연차유급휴가','근로기준법에서 정하는 바에 따라 부여함'],['8. 사회보험 적용',b.insurance||'고용보험, 산재보험, 국민연금, 건강보험'],['9. 근로계약서 교부','사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자의 교부요구와 관계없이 근로자에게 교부함'],['10. 기타','이 계약에 정함이 없는 사항은 근로기준법령에 의함']])+
   para('',{after:200})+para(b.date||new Date().toISOString().slice(0,10),{center:true,after:300})+
   table([['사업주','사업체명: '+E.name+(E.phone?' / 전화: '+E.phone:'')+'\n주소: '+(E.address||'')+'\n대표자: '+(E.representative||'')+'   (서명)'],['근로자','성명: '+W.name+(W.phone?' / 연락처: '+W.phone:'')+'\n주소: '+(W.address||'')+'   (서명)']])+
   para('',{after:100})+para('※ 고용노동부 표준근로계약서 항목을 따른 서식입니다. 법률 자문이 아니며, 최저임금·근로시간 등 법정 기준 준수 여부는 직접 확인하세요.',{sz:16});
  return{bytes:docx(body),type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',name:'employment-contract.docx',meta:{}};},
};
export default{async fetch(req){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:C});const u=new URL(req.url);const h=ROUTES[u.pathname];if(!h)return P(404,'Not Found','Unknown endpoint');if(req.method!=='POST')return P(405,'Method Not Allowed','Use POST');
 let b;try{b=JSON.parse(await req.text()||'{}');}catch(e){return P(400,'Bad Request','Request body is not valid JSON.');}if(!b||typeof b!=='object'||Array.isArray(b))return P(400,'Bad Request','Body must be a JSON object');
 let r;try{r=h(b);}catch(e){return P(400,'Bad Request',e.message);}
 return new Response(r.bytes,{headers:{'Content-Type':r.type,'Content-Disposition':'attachment; filename="'+r.name+'"','X-Egress':'none','X-Document-Totals':JSON.stringify(r.meta),...C}});}};
