const $=i=>document.getElementById(i),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dmy=n=>new Date(+n).toLocaleDateString('vi-VN');
const G=[0,1,2,3,4,5].map(i=>`linear-gradient(135deg,hsl(${i*52+225} 80% 56%),hsl(${i*52+275} 85% 62%))`);
let me=null,ui={},D={tests:[],subs:[],docs:[]},qn=0,rid=0;
try{me=JSON.parse(sessionStorage.getItem('me'))}catch(e){}
const saveMe=()=>{try{me?sessionStorage.setItem('me',JSON.stringify(me)):sessionStorage.removeItem('me')}catch(e){}};
const empty='<div class="empty"><b>🔎</b>Chưa có dữ liệu phù hợp.</div>';
const T=[['tests','📝 Đề kiểm tra'],['graded','✅ Bài đã chấm'],['docs','📁 Tài liệu']],S=[['tests','📝 Làm bài'],['results','🏆 Kết quả'],['docs','📁 Tài liệu']];
const reset=tab=>{ui={tab,view:null,gr:0,q:''}};
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),3000)}
async function run(fn,fin){try{await fn()}catch(e){if(me)toast(e.message);else $('err').textContent=e.message}finally{fin&&fin()}}

async function api(action,p={}){
  if(API.startsWith('DAN_'))throw new Error('Chưa dán link /exec vào biến API ở đầu đoạn <script>.');
  let j;
  try{const r=await fetch(API,{method:'POST',body:JSON.stringify({action,token:me&&me.token,...p})});j=await r.json()}
  catch(e){throw new Error('Không kết nối được máy chủ. Hãy kiểm tra mạng.')}
  if(!j.ok){if(j.auth){me=null;saveMe();render()}throw new Error(j.error||'Có lỗi xảy ra')}
  return j.data;
}

async function render(){
  $('viewLogin').classList.toggle('hidden',!!me);$('viewApp').classList.toggle('hidden',!me);if(!me)return;
  const u=me.user,tc=u.role==='teacher',k=++rid,v=ui.view;
  $('av').textContent=u.name.split(' ').pop()[0];$('wn').textContent=u.name;$('wr').textContent=u.info;
  $('nav').innerHTML=(tc?T:S).map(t=>`<button class="tab${ui.tab===t[0]?' on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('');
  $('pg').innerHTML='<div class="empty">⏳ Đang tải…</div>';
  try{
    if(v&&v.take)D.cur=await api('getTest',{id:v.take});
    else if(v&&(v.res||v.sub))D.sub=await api('getSub',{id:v.res||v.sub});
    else if(ui.tab==='docs')D.docs=await api('listDocs');
    else if(ui.tab==='tests')[D.tests,D.subs]=await Promise.all([api('listTests'),api('listSubs')]);
    else D.subs=await api('listSubs');
  }catch(e){if(me&&k===rid)$('pg').innerHTML=`<div class="empty"><b>⚠️</b>${esc(e.message)}<br><br><button class="btn grad s" data-retry>Thử lại</button></div>`;return}
  if(k===rid){paint();scrollTo(0,0)}
}
function paint(){
  const tc=me.user.role==='teacher';
  $('pg').innerHTML=(tc?{tests:pTT,graded:pTG,docs:pDocs}:{tests:pST,results:pSR,docs:pDocs})[ui.tab]();
  if(tc&&ui.tab==='tests'){qn=0;addQ('mc');addQ('es')}
}
const filters=()=>`<div class="bar"><input class="inp" id="q" placeholder="Tìm kiếm…" value="${esc(ui.q)}"><div class="chips">${[0,1,2,3,4,5].map(g=>`<button class="chip${ui.gr===g?' on':''}" data-gr="${g}">${g?'Lớp '+g:'Tất cả'}</button>`).join('')}</div></div>`;

// ----- Học sinh
const listTests=()=>{const q=ui.q.toLowerCase(),r=D.tests.filter(t=>(!ui.gr||t.grade==ui.gr)&&(!q||(t.title+' lớp '+t.grade).toLowerCase().includes(q)));
  return r.length?r.map(t=>{const s=D.subs.find(x=>x.testId==t.id);
  return `<article class="card"><div class="cover" style="background:${G[t.grade]}"><span class="em">🧮</span><span class="tag">Lớp ${t.grade}</span></div><div class="body"><h4>${esc(t.title)}</h4><p>${t.count} câu hỏi</p><div class="foot">${s?`<span class="score">${s.score}/${s.total} điểm</span><button class="btn grad s" data-res="${s.id}">Xem kết quả</button>`:`<span></span><button class="btn grad s" data-take="${t.id}">Làm bài</button>`}</div></div></article>`}).join(''):empty};
const pST=()=>ui.view?(ui.view.take?take():res(0)):`<h3>Làm bài kiểm tra</h3><p class="lead">Chọn đề phù hợp rồi bấm “Làm bài”. Nộp xong hệ thống chấm ngay.</p>${filters()}<div class="grid" id="list">${listTests()}</div>`;
function take(){const t=D.cur;
  return `<button class="back" data-back>← Quay lại</button><h3>${esc(t.title)}</h3><p class="lead">Lớp ${t.grade} · ${t.qs.length} câu</p><form id="tk">${t.qs.map((q,i)=>`<div class="panel"><b>Câu ${i+1}.</b> ${esc(q.q)}${q.t==='mc'?q.o.map((o,j)=>`<label class="opt"><input type="radio" name="q${i}" value="${j}"><span>${'ABCD'[j]}. ${esc(o)}</span></label>`).join(''):`<label>Đáp án cuối</label><input class="inp" name="f${i}" placeholder="Ví dụ: 12"><label>Lời giải</label><textarea class="inp" name="w${i}" rows="3" placeholder="Em viết cách làm vào đây…"></textarea>`}</div>`).join('')}<button class="btn grad full">Nộp bài</button></form>`}
const row=(s,k)=>`<div class="trow" data-${k}="${s.id}"><div class="mini" style="background:${G[s.grade]||G[0]}">L${s.grade}</div><div><h5>${k==='sub'?esc(s.student)+' — ':''}${esc(s.title)}</h5><small>${dmy(s.date)}${s.hasNote?' · 💬 Có ghi chú':''}</small></div><span class="score">${s.score}/${s.total}</span></div>`;
const pSR=()=>ui.view?res(0):`<h3>Kết quả của em</h3><p class="lead">Bấm vào bài để xem đáp án và lời nhắn của giáo viên.</p><div class="panel">${D.subs.map(s=>row(s,'res')).join('')||empty}</div>`;

// ----- Kết quả chi tiết (dùng chung)
function res(tm){const s=D.sub;
  return `<button class="back" data-back>← Quay lại</button><div class="panel sc"><div class="big">${s.score}/${s.total}</div><div><h3 style="font-size:22px">${esc(s.title)}</h3><p style="margin:0;color:var(--mute)">${tm?esc(s.student)+' · ':''}Nộp ngày ${dmy(s.date)} · ${Math.round(s.score/s.total*100)}%</p></div></div>`+
  s.qs.map((q,i)=>{const a=s.answers[i],ok=s.results[i];return `<div class="panel ${ok?'ok':'bad'}"><b>Câu ${i+1}.</b> ${esc(q.q)}<span class="pill">${ok?'Đúng':'Sai'}</span>`+
  (q.t==='mc'?`<p>Đã chọn: <b>${a.c>=0?esc(q.o[a.c]):'(bỏ trống)'}</b>${ok?'':` · Đáp án đúng: <b>${esc(q.o[q.a])}</b>`}</p>`:`<p>Đáp án cuối: <b>${esc(a.f)||'(bỏ trống)'}</b>${ok?'':` · Đáp án đúng: <b>${esc(q.a)}</b>`}</p><div class="work">${esc(a.w)||'(Chưa có lời giải)'}</div>`)+
  (tm?`<label>Ghi chú sửa bài cho học sinh</label><textarea class="inp" data-note="${i}" rows="2" placeholder="Ví dụ: Con quên nhân với 2 nhé…">${esc(s.notes[i]||'')}</textarea>`:s.notes[i]?`<div class="note">💬 Giáo viên: ${esc(s.notes[i])}</div>`:'')+`</div>`}).join('')+
  (tm?`<button class="btn grad full" data-save="${s.id}">Lưu ghi chú</button>`:'')}

// ----- Giáo viên
const pTG=()=>ui.view?res(1):`<h3>Bài đã chấm</h3><p class="lead">Hệ thống đã chấm tự động. Bấm vào bài để xem lời giải và ghi chú sửa lỗi.</p><div class="panel">${D.subs.map(s=>row(s,'sub')).join('')||empty}</div>`;
const pTT=()=>`<h3>Tạo đề kiểm tra Toán</h3><p class="lead">Lớp 1 đến lớp 5. Mỗi câu 1 điểm, hệ thống tự chấm khi học sinh nộp bài.</p>
<form id="tf" class="panel"><div class="row2"><div><label style="margin-top:0">Tên đề</label><input class="inp" id="tt" required placeholder="Ví dụ: Ôn tập phép nhân"></div><div><label style="margin-top:0">Lớp</label><select class="inp" id="tg">${[1,2,3,4,5].map(g=>`<option value="${g}">Lớp ${g}</option>`).join('')}</select></div></div>
<div id="qb"></div><div class="acts"><button type="button" class="chip" data-add="mc">＋ Câu trắc nghiệm</button><button type="button" class="chip" data-add="es">＋ Câu tự luận</button></div><button class="btn grad full">Lưu đề kiểm tra</button></form>
<h3 style="font-size:20px;margin:26px 0 12px">Đề đã tạo</h3><div class="panel">${D.tests.map(t=>`<div class="trow"><div class="mini" style="background:${G[t.grade]}">L${t.grade}</div><div><h5>${esc(t.title)}</h5><small>${t.count} câu · ${D.subs.filter(s=>s.testId==t.id).length} bài nộp</small></div><button class="x" data-dt="${t.id}">Xóa</button></div>`).join('')||empty}</div>`;
function addQ(t){const n=qn++;$('qb').insertAdjacentHTML('beforeend',`<div class="qblk" data-t="${t}"><div class="qh"><b>${t==='mc'?'Câu trắc nghiệm':'Câu tự luận'}</b><button type="button" class="x" data-rm>Xóa câu</button></div><input class="inp" data-q placeholder="Nội dung câu hỏi" required>`+
  (t==='mc'?[0,1,2,3].map(i=>`<label class="opt"><input type="radio" name="r${n}" value="${i}"${i?'':' checked'}><input class="inp" data-o placeholder="Đáp án ${'ABCD'[i]}" required></label>`).join('')+`<small style="color:var(--mute)">Chọn nút tròn bên cạnh đáp án đúng.</small>`:`<input class="inp" data-a placeholder="Đáp án cuối đúng (dùng để tự chấm)" required style="margin-top:8px"><small style="color:var(--mute)">Học sinh sẽ có ô điền đáp án cuối và ô nhập lời giải.</small>`)+`</div>`)}

// ----- Tài liệu
const listDocs=()=>{const q=ui.q.toLowerCase(),tc=me.user.role==='teacher',r=D.docs.filter(x=>(!ui.gr||x.grade==ui.gr)&&(!q||(x.title+' '+x.desc).toLowerCase().includes(q)));
  return r.length?r.map(x=>`<article class="card"><div class="cover" data-ext="${esc(x.ext)}" style="background:${G[x.grade]||G[0]}"><span class="em">📄</span><span class="tag">Lớp ${x.grade}</span></div><div class="body"><h4>${esc(x.title)}</h4><p>${esc(x.desc)}</p><div class="foot"><small>⬇ ${x.downloads} · ${esc(x.size)}</small>${tc?`<button class="x" data-dd="${x.id}">Xóa</button>`:`<button class="btn grad s" data-dl="${x.id}">Tải xuống</button>`}</div></div></article>`).join(''):empty};
const pDocs=()=>`<h3>Tài liệu học tập</h3><p class="lead">${me.user.role==='teacher'?'Đăng tài liệu cho học sinh tải về (tối đa 5 MB mỗi tệp).':'Tài liệu giáo viên chia sẻ cho em.'}</p>`+
  (me.user.role==='teacher'?`<form id="uf" class="panel"><div class="row2"><div><label style="margin-top:0">Tên tài liệu</label><input class="inp" id="dtt" required></div><div><label style="margin-top:0">Lớp</label><select class="inp" id="dg">${[1,2,3,4,5].map(g=>`<option value="${g}">Lớp ${g}</option>`).join('')}</select></div></div><label>Mô tả ngắn</label><input class="inp" id="dds"><label>Tệp tài liệu</label><input class="inp" type="file" id="df" required><button class="btn grad full">Đăng tài liệu</button></form>`:'')+filters()+`<div class="grid" id="list">${listDocs()}</div>`;

// ----- Sự kiện
$('lf').onsubmit=e=>{e.preventDefault();const b=e.target.querySelector('button.btn');b.disabled=true;b.textContent='Đang đăng nhập…';
  run(async()=>{me=await api('login',{username:$('u').value.trim(),password:$('p').value});saveMe();$('err').textContent='';reset('tests');await render()},()=>{b.disabled=false;b.textContent='Đăng nhập'});
  };
$('logout').onclick=()=>{me=null;saveMe();$('lf').reset();render()};
document.addEventListener('input',e=>{if(e.target.id==='q'){ui.q=e.target.value;$('list').innerHTML=(ui.tab==='docs'?listDocs:listTests)()}});
document.addEventListener('submit',e=>{const f=e.target;
  if(f.id==='tk'){e.preventDefault();const t=D.cur,x=new FormData(f),b=f.querySelector('button.btn');
    const answers=t.qs.map((q,i)=>q.t==='mc'?{c:x.has('q'+i)?+x.get('q'+i):-1}:{f:x.get('f'+i)||'',w:x.get('w'+i)||''});
    b.disabled=true;b.textContent='Đang chấm bài…';
    run(async()=>{const r=await api('submit',{testId:t.id,answers});ui.view={res:r.id};await render();toast(`Đã chấm xong: ${r.score}/${r.total} điểm`)},()=>{b.disabled=false;b.textContent='Nộp bài'})}
  if(f.id==='tf'){e.preventDefault();const qs=[...f.querySelectorAll('.qblk')].map(b=>{const q=b.querySelector('[data-q]').value.trim();return b.dataset.t==='mc'?{t:'mc',q,o:[...b.querySelectorAll('[data-o]')].map(i=>i.value.trim()),a:+b.querySelector('input[type=radio]:checked').value}:{t:'es',q,a:b.querySelector('[data-a]').value.trim()}});
    if(!qs.length){toast('Hãy thêm ít nhất một câu hỏi.');return}
    const b=f.querySelector('button.btn.full');b.disabled=true;b.textContent='Đang lưu…';
    run(async()=>{await api('createTest',{title:$('tt').value.trim(),grade:+$('tg').value,qs});await render();toast('Đã tạo đề! Học sinh có thể làm ngay.')},()=>{b.disabled=false;b.textContent='Lưu đề kiểm tra'})}
  if(f.id==='uf'){e.preventDefault();const fl=$('df').files[0];if(fl.size>5*1048576){toast('Tệp quá lớn (tối đa 5 MB).');return}
    const b=f.querySelector('button.btn.full');b.disabled=true;b.textContent='Đang tải lên…';
    run(async()=>{const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(fl)});
      await api('uploadDoc',{title:$('dtt').value.trim(),grade:+$('dg').value,desc:$('dds').value.trim(),name:fl.name,mime:fl.type,data});await render();toast('Đã đăng tài liệu.')},()=>{b.disabled=false;b.textContent='Đăng tài liệu'})}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab],[data-gr],[data-take],[data-res],[data-sub],[data-back],[data-save],[data-add],[data-rm],[data-dt],[data-dd],[data-dl],[data-retry]');if(!t)return;const s=t.dataset,has=k=>k in s;
  if(has('tab')){reset(s.tab);render()}
  else if(has('gr')){ui.gr=+s.gr;paint()}
  else if(has('take')){ui.view={take:+s.take};render()}
  else if(has('res')){ui.view={res:+s.res};render()}
  else if(has('sub')){ui.view={sub:+s.sub};render()}
  else if(has('back')||has('retry')){if(has('back'))ui.view=null;render()}
  else if(has('save'))run(async()=>{const notes={};document.querySelectorAll('[data-note]').forEach(n=>notes[n.dataset.note]=n.value.trim());await api('saveNotes',{id:s.save,notes});toast('Đã lưu ghi chú. Học sinh sẽ thấy khi xem lại bài.')});
  else if(has('add'))addQ(s.add);
  else if(has('rm'))t.closest('.qblk').remove();
  else if(has('dt')){if(confirm('Xóa đề này và tất cả bài đã nộp của đề?'))run(async()=>{await api('deleteTest',{id:s.dt});await render();toast('Đã xóa đề.')})}
  else if(has('dd')){if(confirm('Xóa tài liệu này?'))run(async()=>{await api('deleteDoc',{id:s.dd});await render();toast('Đã xóa tài liệu.')})}
  else if(has('dl'))run(async()=>{const r=await api('downloadDoc',{id:s.dl}),x=D.docs.find(v=>v.id==s.dl);if(x)x.downloads++;$('list').innerHTML=listDocs();const a=document.createElement('a');a.href=r.url;a.click();toast('Đang tải tài liệu…')})});
if(me)reset('tests');
render();