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
const PH=(t,s='')=>`<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
const tbl=(h,rows)=>rows.length?`<div class="tbl"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td data-l="${h[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="mut">Belum ada data.</p>';
function render(){
 document.body.className=U?'in':'out';const nav=$('#nav');
 $('#who').innerHTML=U?`<span class="av">${esc((U.nama||'?')[0])}</span><div><b>${esc(U.nama)}</b><small>${esc(U.role)}</small></div><button class="btn ghost sm" data-a="out">Keluar</button>`:'';
 if(!U){nav.innerHTML='';return V(`<div class="auth card"><img class="logo-lg" src="logo.png" alt="Duta Kampus ULBI" onerror="this.style.display='none'"><h1>Masuk</h1><p class="mut">Sistem KPI Duta Kampus</p><form id="lg"><label>NIM<input name="nim" inputmode="numeric" autocomplete="username" required></label><label>PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label><button class="btn">Masuk</button></form></div>`),
  $('#lg').onsubmit=e=>{e.preventDefault();go(async()=>{const d=await api('login',Object.fromEntries(new FormData(e.target)));T=d.token;U={nim:d.nim,nama:d.nama,role:d.role,divisi:d.divisi};localStorage.setItem('t',T);localStorage.setItem('u',JSON.stringify(U));render()})}}
 const tabs=[['home','Beranda'],['scan','Scan'],['laporan','Laporan'],...(isA()?[['admin','Admin']]:[])],h=location.hash.slice(1)||'home';
 nav.innerHTML=tabs.map(([k,n])=>`<a href="#${k}" class="${k===h?'on':''}">${ico(k)}${n}</a>`).join('');
 stopScan();go(()=>({home,scan,laporan,admin}[h]||home)());
}
addEventListener('hashchange',()=>U&&render());

async function home(){
 V('<p class="mut">Memuat…</p>');const d=await api('me'),l=d.latest,st=(k,v,x)=>`<div class="card stat"><small>${k}</small><b>${v}</b><i>${x}</i></div>`;
 V(PH('Halo, '+esc(d.nama.split(' ')[0]),'Ringkasan KPI dan kehadiranmu')
 +(l?`<div class="stats">${st('Skor KPI',l.total,'Bulan '+l.bulan)}${st('Kehadiran',l.hadir+'/'+l.acara,l.pct+'%')}${st('Keaktifan',l.aktif,'dari 100')}${st('Eksekusi',l.eksekusi,'dari 100')}</div>`:'<div class="card mut">Belum ada data KPI.</div>')
 +'<h3 class="sh">Riwayat absensi</h3>'+tbl(['Acara','Waktu','Metode'],d.attendance.map(a=>[esc(a.nama),esc(a.ts),esc(a.metode)])));
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
function admin(){
 if(!isA())return;
 V(`<div class="seg">${[['acara','Acara'],['laporan','Laporan']].map(([k,n])=>`<button class="btn ${k===AT?'':'ghost'}" data-a="atab" data-t="${k}">${n}</button>`).join('')}</div><div id="av"></div>`);
 return AT==='acara'?aAcara():aLaporan()}
async function aAcara(){
 const ev=await api('events'),b=(a,id,t,x='')=>`<button class="btn ${x} sm" data-a="${a}" data-id="${id}"`;
 $('#av').innerHTML=`<div class="cols"><form id="ef" class="card"><h3 class="sh" style="margin-top:0">Acara baru</h3><label>Nama<input name="nama" required></label><label>Tanggal<input type="date" name="tanggal" required></label><button class="btn">Buat acara</button></form><div>`
 +tbl(['Acara','Tanggal','Status','Hadir','Aksi'],ev.slice().reverse().map(e=>[`<b>${esc(e.nama)}</b>`,e.tanggal,`<span class="pill ${e.status}">${e.status}</span>`,e.hadir,
  (e.status==='open'?`<button class="btn sm" data-a="qr" data-id="${e.id}">QR</button> <button class="btn ghost sm" data-a="st" data-id="${e.id}" data-s="closed">Tutup</button>`:`<button class="btn sm" data-a="st" data-id="${e.id}" data-s="open">Buka</button>`)+` <button class="btn ghost sm" data-a="evdel" data-id="${e.id}">Hapus</button>`]))+'</div></div>';
 $('#ef').onsubmit=e=>{e.preventDefault();go(async()=>{await api('createEvent',Object.fromEntries(new FormData(e.target)));aAcara()})}}
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
 else if(a==='atab'){AT=b.dataset.t;admin()}
 else if(a==='st'){await api('setStatus',{id,status:b.dataset.s});aAcara()}
 else if(a==='evdel'){if(confirm('Hapus acara beserta absensinya?')){await api('deleteEvents',{ids:[id]});aAcara()}}
 else if(a==='dldel'){await api('deadlineDelete',{periode:b.dataset.p});aLaporan()}
 else if(a==='qr'){const d=await api('qr',{id}),q=qrcode(0,'M');q.addData(JSON.stringify({e:d.id,s:d.secret}));q.make();
  $('#dlg').innerHTML=q.createSvgTag({scalable:true,margin:2})+'<p class="note">Minta anggota scan QR ini</p><button class="btn" onclick="this.closest(\'dialog\').close()">Tutup</button>';$('#dlg').showModal()}
})});
render();
