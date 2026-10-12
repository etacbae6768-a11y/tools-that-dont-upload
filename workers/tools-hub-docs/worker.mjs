
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
const ROUTES={
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
