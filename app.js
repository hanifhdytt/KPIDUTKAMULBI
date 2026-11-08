const API='https://kpi-duta-api.dutakpi.workers.dev';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bln=()=>new Date(Date.now()+7*36e5).toISOString().slice(0,7);
let T=localStorage.getItem('t')||'',U=JSON.parse(localStorage.getItem('u')||'null'),RL,AT='acara',stream,timer;
const isA=()=>U&&/admin/.test(U.role);
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.i);toast.i=setTimeout(()=>t.hidden=true,3500)};
const go=async f=>{try{await f()}catch(e){toast(e.message||'Terjadi kesalahan')}};
async function api(a,p={}){
 let r;try{r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+T},body:JSON.stringify({action:a,...p})})}catch{throw Error('Tidak ada koneksi internet')}
 const j=await r.json().catch(()=>({error:'Respon server tidak valid'}));
 if(r.status===401&&a!=='login'){out();throw Error(j.error)}
 if(!j.ok)throw Error(j.error);return j.data}
const out=()=>{stopScan();T='';U=null;localStorage.clear();render()};
const V=h=>$('#v').innerHTML=h;
const IC={home:'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',scan:'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16',laporan:'M7 3h8l4 4v14H7zM14 3v5h5M10 13h6M10 17h6',admin:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'};
const ico=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[k]}"/></svg>`;
const MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],fd=t=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(t||'');return m?`${m[3]} ${MON[+m[2]-1]} ${m[1]}`:esc(t)},ft=t=>fd(t)+(/\d\d:\d\d/.test(t||'')?', '+t.slice(11,16):'');
const PH=(t,s='')=>`<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
const tbl=(h,rows,k='')=>rows.length?`<div class="tbl ${k}"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td data-l="${h[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="mut">Belum ada data.</p>';
function render(){
 document.body.className=U?'in':'out';const nav=$('#nav');
 $('#who').innerHTML=U?`${U.foto?`<img class="av" src="${U.foto}" alt="">`:`<span class="av">${esc(ini(U.nama))}</span>`}<div><b>${esc(U.nama)}</b><small>${esc(U.role)}</small></div><button class="btn ghost sm" data-a="out">Keluar</button>`:'';
 if(!U){nav.innerHTML='';return V(`<div class="auth card"><img class="logo-lg" src="logo.png" alt="Duta Kampus ULBI" onerror="this.style.display='none'"><h1>Masuk</h1><p class="mut">Sistem KPI Duta Kampus</p><form id="lg"><label>NIM<input name="nim" inputmode="numeric" autocomplete="username" required></label><label>PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label><button class="btn">Masuk</button></form></div>`),
  $('#lg').onsubmit=e=>{e.preventDefault();go(async()=>{const d=await api('login',Object.fromEntries(new FormData(e.target)));T=d.token;U={nim:d.nim,nama:d.nama,role:d.role,divisi:d.divisi};localStorage.setItem('t',T);localStorage.setItem('u',JSON.stringify(U));render()})}}
 const tabs=[['home','Beranda'],['scan','Scan'],['laporan','Laporan'],...(isA()?[['admin','Admin']]:[])],h=location.hash.slice(1)||'home';
 nav.innerHTML=tabs.map(([k,n])=>`<a href="#${k}" class="${k===h?'on':''}">${ico(k)}${n}</a>`).join('');
 if(U.foto===undefined)api('profile').then(p=>{U.foto=p.foto||'';render()}).catch(()=>{U.foto=''});
 stopScan();go(()=>({home,scan,laporan,admin}[h]||home)());
}
addEventListener('hashchange',()=>U&&render());

async function home(){
 V('<p class="mut">Memuat…</p>');const d=await api('me'),l=d.latest,st=(k,v,x)=>`<div class="card stat"><small>${k}</small><b>${v}</b><i>${x}</i></div>`;
 V(PH('Halo, '+esc(d.nama.split(' ')[0]),'Ringkasan KPI dan kehadiranmu')
 +`<div class="card row"><div class="who">${avt({nama:d.nama,foto:U.foto})}<div><b>${esc(d.nama)}</b><small>${esc(U.nim)} · ${esc(U.divisi||U.role)}</small></div></div><label class="btn ghost sm" style="margin:0">Ubah foto<input type="file" accept="image/*" id="pf" hidden></label></div>`
 +(l?`<div class="stats">${st('Skor KPI',l.total,'Bulan '+l.bulan)}${st('Kehadiran',l.hadir+'/'+l.acara,l.pct+'%')}${st('Keaktifan',l.aktif,'dari 100')}${st('Eksekusi',l.eksekusi,'dari 100')}</div>`:'<div class="card mut">Belum ada data KPI.</div>')
 +'<h3 class="sh">Riwayat absensi</h3>'+tbl(['Acara','Waktu','Metode'],d.attendance.map(a=>[esc(a.nama),ft(a.ts),`<span class="pill">${esc(a.metode).toUpperCase()}</span>`])));
}

/* ---- Scanner (iOS-safe: tombol memulai kamera, playsinline+muted, jsQR sebagai cadangan) ---- */
function scan(){V(''+PH('Scan absensi','Arahkan kamera ke QR acara')+'<video id="cam" playsinline muted autoplay hidden></video><button class="btn" data-a="cam">Buka kamera</button><p class="note" style="margin:12px 0">Kamera tidak jalan? Ambil foto QR:</p><label class="btn ghost" style="display:flex;align-items:center;justify-content:center">Foto QR<input type="file" accept="image/*" capture="environment" id="qf" hidden></label>');
 $('#qf').onchange=e=>go(async()=>{const f=e.target.files[0];if(!f)return;const im=await createImageBitmap(f),c=document.createElement('canvas'),s=Math.min(1,900/Math.max(im.width,im.height));c.width=im.width*s;c.height=im.height*s;const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);const r=jsQR(x.getImageData(0,0,c.width,c.height).data,c.width,c.height);if(!r)throw Error('QR tidak terbaca, coba lagi lebih dekat');await submitScan(r.data)})}
async function startScan(){
 const v=$('#cam');
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})}catch{return toast('Izin kamera ditolak. Gunakan tombol Foto QR.')}
 v.hidden=false;v.srcObject=stream;await v.play().catch(()=>{});
 const det='BarcodeDetector' in window?new BarcodeDetector({formats:['qr_code']}):null,c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true});
 const tick=async()=>{if(!stream)return;let t='';
  if(v.videoWidth){try{if(det){t=(await det.detect(v))[0]?.rawValue||''}else{c.width=Math.min(480,v.videoWidth);c.height=c.width*v.videoHeight/v.videoWidth;x.drawImage(v,0,0,c.width,c.height);t=jsQR(x.getImageData(0,0,c.width,c.height).data,c.width,c.height)?.data||''}}catch{}}
  if(t){stopScan();return go(()=>submitScan(t))}timer=setTimeout(tick,200)};tick()}
function stopScan(){clearTimeout(timer);stream&&stream.getTracks().forEach(t=>t.stop());stream=null}
async function submitScan(raw){
 let q;try{q=JSON.parse(raw)}catch{throw Error('QR bukan QR absensi KPI')}
 if(!q.e||!q.s)throw Error('QR bukan QR absensi KPI');
 const d=await api('scan',{eventId:q.e,secret:q.s});toast(d.sudah?'Kamu sudah tercatat hadir di '+d.acara:'Hadir tercatat: '+d.acara);location.hash='home'}

/* ---- Laporan ---- */
async function laporan(){
 RL=await api('laporanMine');
 V(`${PH('Laporan','Kirim laporan divisi atau mentoring')}<div class="cols"><form id="lf" class="card"><label>Jenis laporan<select name="jenis"><option value="divisi">Laporan Divisi</option><option value="mentoring">Laporan Mentoring</option></select></label><label>Periode<input type="month" name="periode" value="${bln()}" required></label><p id="dl" class="note" style="margin-bottom:12px"></p><label>Judul<input name="judul" maxlength="150" required></label><label>Isi<textarea name="isi" rows="8" maxlength="8000" required></textarea></label><button class="btn">Kirim laporan</button></form><div><h3 class="sh" style="margin-top:0">Laporan saya</h3>`
 +(RL.reports.map(r=>`<div class="card"><b>${esc(r.judul)}</b><small>${r.jenis} · ${r.periode}</small><p>${esc(r.isi.slice(0,160))}</p><button class="btn ghost sm" data-a="edit" data-id="${r.id}">Ubah</button> <button class="btn ghost sm" data-a="delr" data-id="${r.id}">Hapus</button></div>`).join('')||'<p class="mut">Belum ada laporan.</p>')+'</div></div>');
 const f=$('#lf'),upd=()=>{const m=f.jenis.value==='mentoring',d=RL.deadlines.find(x=>x.periode===f.periode.value);
  $('#dl').textContent=m?(d?(d.terbuka?'Batas pengumpulan: ':'Sudah ditutup. Batas: ')+d.deadline+' WIB':'Admin belum membuka laporan mentoring periode ini'):'';
  f.querySelector('.btn').disabled=m&&!(d&&d.terbuka)};
 f.onchange=upd;upd();
 f.onsubmit=e=>{e.preventDefault();go(async()=>{await api('laporanSave',Object.fromEntries(new FormData(f)));toast('Laporan tersimpan');laporan()})}}

/* ---- Admin ---- */
const ini=n=>(String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('')||'?').toUpperCase();
const avt=m=>m.foto?`<img class="ava" src="${m.foto}" alt="">`:`<span class="ava">${esc(ini(m.nama))}</span>`;
const who=m=>`<div class="who">${avt(m)}<div><b>${esc(m.nama)}</b><small>${esc(m.nim)}</small></div></div>`;
const getMembers=async()=>MC||(MC=await api('memberList'));
const ST={hadir:'Hadir',izin:'Izin',sakit:'Sakit',belum:'Belum'};
const pill=s=>`<span class="pill dot ${s}">${ST[s]||s}</span>`;
function admin(){
 if(!isA())return;
 V(PH('Admin','Kelola acara, anggota, dan laporan')+`<div class="seg">${[['acara','Acara'],['anggota','Anggota'],['laporan','Laporan']].map(([k,n])=>`<button class="btn ${k===AT?'':'ghost'}" data-a="atab" data-t="${k}">${n}</button>`).join('')}</div><div id="av"></div>`);
 return AT==='acara'?(AE?aDetail():aAcara()):AT==='anggota'?aAnggota():aLaporan()}
async function aAcara(){
 const ev=await api('events');
 $('#av').innerHTML=`<div class="cols"><form id="ef" class="card"><h3 class="sh" style="margin-top:0">Acara baru</h3><label>Nama<input name="nama" required></label><label>Tanggal<input type="date" name="tanggal" required></label><button class="btn">Buat acara</button></form><div>`
 +tbl(['Acara','Tanggal','Status','Hadir','Aksi'],ev.slice().reverse().map(e=>[`<button class="lnk" data-a="evopen" data-id="${e.id}">${esc(e.nama)}</button>`,fd(e.tanggal),`<span class="pill ${e.status}">${e.status}</span>`,e.hadir+' hadir',
  `<button class="btn sm" data-a="evopen" data-id="${e.id}">Kelola</button> `+(e.status==='open'?`<button class="btn ghost sm" data-a="st" data-id="${e.id}" data-s="closed">Tutup</button>`:`<button class="btn ghost sm" data-a="st" data-id="${e.id}" data-s="open">Buka</button>`)+` <button class="btn ghost sm" data-a="evdel" data-id="${e.id}">Hapus</button>`]),'c')+'</div></div>';
 $('#ef').onsubmit=e=>{e.preventDefault();go(async()=>{await api('createEvent',Object.fromEntries(new FormData(e.target)));aAcara()})}}
/* ---- detail acara: pengelolaan absensi (satu tab, tanpa popup) ---- */
let AD;
async function aDetail(){
 const [ev,rows,ml]=await Promise.all([api('events'),api('attendanceManage',{id:AE}),getMembers()]),e=ev.find(x=>x.id===AE);
 if(!e){AE=null;return aAcara()}
 const ft=Object.fromEntries(ml.map(m=>[m.nim,m.foto]));
 AD={e,rows:rows.map(r=>({...r,foto:ft[r.nim]||''})),q:'',f:''};
 $('#av').innerHTML=`<div class="hd"><div><button class="lnk back" data-a="evback">← Semua acara</button><h2 class="dt">${esc(e.nama)}</h2><small>${fd(e.tanggal)} · <span class="pill ${e.status}">${e.status}</span></small></div><div class="acts"><button class="btn ghost sm" data-a="qr">Tampilkan QR</button><button class="btn sm" data-a="st" data-id="${e.id}" data-s="${e.status==='open'?'closed':'open'}">${e.status==='open'?'Tutup absensi':'Buka absensi'}</button></div></div>
 <div id="qp" class="card qp" hidden></div><div class="mini" id="mn"></div>
 <div class="bar"><input id="aq" type="search" placeholder="Cari nama, NIM, divisi…"><select id="af"><option value="">Semua status</option>${Object.entries(ST).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div><div id="at"></div>`;
 drawAtt()}
function drawAtt(){
 const {rows,q,f}=AD,n=s=>rows.filter(r=>r.status===s).length,qq=q.toLowerCase();
 $('#mn').innerHTML=Object.entries(ST).map(([k,v])=>`<div><b>${n(k)}</b><small>${v}</small></div>`).join('');
 const list=rows.filter(r=>(!f||r.status===f)&&(!qq||(r.nama+r.nim+r.divisi).toLowerCase().includes(qq)));
 $('#at').innerHTML=tbl(['Anggota','Divisi','Status','Waktu','Ubah'],list.map(r=>[who(r),esc(r.divisi||'-'),pill(r.status),r.ts?ft(r.ts):'-',
  `<select class="sel" data-a="setst" data-n="${esc(r.nim)}">${Object.entries(ST).map(([k,v])=>`<option value="${k}"${k===r.status?' selected':''}>${v}</option>`).join('')}</select>`]),'c')+`<p class="mut" style="margin:8px 4px">Menampilkan ${list.length} dari ${rows.length} anggota</p>`}
async function aAnggota(){
 const ml=await getMembers();AM={ml,q:''};
 $('#av').innerHTML=`<div class="bar"><input id="mq" type="search" placeholder="Cari nama, NIM, divisi…"><small style="white-space:nowrap">${ml.length} anggota</small></div><div id="mt"></div>`;drawMem()}
let AM,MC,AE=null;
function drawMem(){
 const qq=AM.q.toLowerCase(),l=AM.ml.filter(m=>!qq||(m.nama+m.nim+m.divisi).toLowerCase().includes(qq));
 $('#mt').innerHTML=tbl(['Anggota','Divisi','Role','Tingkat'],l.map(m=>[who(m),esc(m.divisi||'-'),`<span class="pill">${esc(m.role)}</span>`,m.tingkat?`<span class="pill ${m.tingkat==='atas'?'open':''}">${m.tingkat==='atas'?'Atas':'Bawah'}</span>`:'-']),'c')}
async function setFoto(f){
 const im=await createImageBitmap(f),s=192,c=document.createElement('canvas');c.width=c.height=s;
 const x=c.getContext('2d'),k=Math.max(s/im.width,s/im.height),w=im.width*k,h=im.height*k;x.drawImage(im,(s-w)/2,(s-h)/2,w,h);
 const d=await api('profileSave',{foto:c.toDataURL('image/jpeg',.82)});U.foto=d.foto;MC=null;toast('Foto diperbarui');render()}
async function aLaporan(){
 const dls=(await api('laporanMine')).deadlines,opt='<option value="divisi">Laporan Divisi</option><option value="mentoring">Laporan Mentoring</option>';
 $('#av').innerHTML=`<form id="df" class="card"><h3 style="margin-top:0">Batas waktu laporan mentoring</h3><label>Periode<input type="month" name="periode" value="${bln()}" required></label><label>Batas (WIB)<input type="datetime-local" name="deadline" required></label><label>Catatan<input name="catatan"></label><button class="btn">Simpan batas waktu</button>`
 +dls.map(d=>`<div class="row" style="margin-top:10px"><span>${d.periode} → ${d.deadline}</span><button type="button" class="btn ghost sm" data-a="dldel" data-p="${d.periode}">Hapus</button></div>`).join('')
 +`</form><form id="rf" class="card"><h3 style="margin-top:0">Lihat laporan masuk</h3><label>Jenis<select name="jenis">${opt}</select></label><label>Periode<input type="month" name="periode" value="${bln()}" required></label><button class="btn">Tampilkan</button></form><div id="rr"></div>`;
 $('#df').onsubmit=e=>{e.preventDefault();go(async()=>{await api('deadlineSet',Object.fromEntries(new FormData(e.target)));toast('Batas waktu disimpan');aLaporan()})};
 $('#rf').onsubmit=e=>{e.preventDefault();go(async()=>{const d=await api('laporanAdmin',Object.fromEntries(new FormData(e.target)));
  $('#rr').innerHTML=`<p class="mut">${d.rows.length} masuk · ${d.belum.length} belum${d.deadline?' · batas '+d.deadline:''}</p>`
  +d.rows.map(r=>`<details class="card"><summary><b>${esc(r.nama)}</b> · ${esc(r.judul)}</summary><small>${esc(r.divisi)} · ${esc(r.updated_at)}</small><p style="white-space:pre-wrap">${esc(r.isi)}</p></details>`).join('')
  +(d.belum.length?`<div class="card"><b>Belum mengumpulkan</b><small>${d.belum.map(b=>esc(b.nama)).join(', ')}</small></div>`:'')})}}

/* ---- aksi klik ---- */
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;go(async()=>{
 if(a==='out'){await api('logout').catch(()=>{});out()}
 else if(a==='cam')await startScan();
 else if(a==='edit'){const r=RL.reports.find(x=>x.id==id),f=$('#lf');f.jenis.value=r.jenis;f.periode.value=r.periode;f.judul.value=r.judul;f.isi.value=r.isi;f.onchange();f.scrollIntoView()}
 else if(a==='delr'){if(confirm('Hapus laporan ini?')){await api('laporanDelete',{id});laporan()}}
 else if(a==='atab'){AT=b.dataset.t;AE=null;admin()}
 else if(a==='st'){await api('setStatus',{id,status:b.dataset.s});AE?aDetail():aAcara()}
 else if(a==='evdel'){if(confirm('Hapus acara beserta absensinya?')){await api('deleteEvents',{ids:[id]});aAcara()}}
 else if(a==='dldel'){await api('deadlineDelete',{periode:b.dataset.p});aLaporan()}
 else if(a==='qr'){const p=$('#qp');if(!p.hidden){p.hidden=true;return}const d=await api('qr',{id:AE}),q=qrcode(0,'M');q.addData(JSON.stringify({e:d.id,s:d.secret}));q.make();p.innerHTML=q.createSvgTag({scalable:true,margin:2})+'<div><b>QR absensi</b><p class="mut">Minta anggota membuka tab Scan lalu mengarahkan kamera ke QR ini.</p></div>';p.hidden=false}
 else if(a==='evopen'){AE=id;admin()}
 else if(a==='evback'){AE=null;admin()}
})});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='aq'){AD.q=t.value;drawAtt()}else if(t.id==='mq'){AM.q=t.value;drawMem()}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='af'){AD.f=t.value;drawAtt()}
 else if(t.id==='pf'&&t.files[0])go(()=>setFoto(t.files[0]))
 else if(t.dataset.a==='setst')go(async()=>{await api('setAttendanceStatus',{id:AE,target:t.dataset.n,status:t.value});const r=await api('attendanceManage',{id:AE}),ft=Object.fromEntries(AD.rows.map(x=>[x.nim,x.foto]));AD.rows=r.map(x=>({...x,foto:ft[x.nim]||''}));drawAtt()})});
render();
