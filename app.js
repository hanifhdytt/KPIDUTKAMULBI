const API='https://kpi-duta-api.dutakpi.workers.dev';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bln=()=>new Date(Date.now()+7*36e5).toISOString().slice(0,7);
let T=localStorage.getItem('t')||'',U=JSON.parse(localStorage.getItem('u')||'null'),RL,PF=null,AT='dash',AY='',AM='',AM2='',AF='all',ML=[],stream,timer;
const isA=()=>U&&/admin/.test(U.role);
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.i);toast.i=setTimeout(()=>t.hidden=true,3500)};
const go=async f=>{try{await f()}catch(e){toast(e.message||'Terjadi kesalahan')}};
async function api(a,p={}){
 let r;try{r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+T},body:JSON.stringify({action:a,...p})})}catch{throw Error('Tidak ada koneksi internet')}
 const j=await r.json().catch(()=>({error:'Respon server tidak valid'}));
 if(r.status===401&&a!=='login'){out();throw Error(j.error)}
 if(!j.ok)throw Error(j.error);return j.data}
const out=()=>{stopScan();T='';U=null;PF=null;FM=null;AE=null;localStorage.clear();render()};
const V=h=>$('#v').innerHTML=h;
const IC={home:'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',scan:'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16',laporan:'M7 3h8l4 4v14H7zM14 3v5h5M10 13h6M10 17h6',admin:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',profil:'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7'};
const ico=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[k]}"/></svg>`;
const MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],fd=t=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(t||'');return m?`${m[3]} ${MON[+m[2]-1]} ${m[1]}`:esc(t)},ft=t=>fd(t)+(/\d\d:\d\d/.test(t||'')?', '+t.slice(11,16):'');
const PH=(t,s='')=>`<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
const tbl=(h,rows,k='')=>rows.length?`<div class="tbl ${k}"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td data-l="${h[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="mut">Belum ada data.</p>';

/* ---- helper KPI: bulan, tingkat (senior/junior), grafik SVG & batang (tanpa library) ---- */
const bs=k=>MON[+k.slice(5,7)-1],bn=k=>bs(k)+' '+k.slice(0,4),f1=n=>String(Math.round((+n||0)*10)/10);
const TG={atas:'Tingkat Atas (senior)',bawah:'Tingkat Bawah (junior)'},TS={atas:'Atas',bawah:'Bawah'};
const tgPill=t=>t?`<span class="pill tg-${t}">${TS[t]}</span>`:'';
function lineChart(labels,series){const w=320,h=170,L=28,R=8,T=10,B=22,iw=w-L-R,ih=h-T-B,n=labels.length,X=i=>L+(n<2?iw/2:iw*i/(n-1)),Y=v=>T+ih-ih*Math.max(0,Math.min(100,v))/100;
 let s=`<svg viewBox="0 0 ${w} ${h}" class="chart" role="img">`;
 [0,50,100].forEach(g=>s+=`<line class="gl" x1="${L}" x2="${w-R}" y1="${Y(g)}" y2="${Y(g)}"/><text class="ax" x="${L-4}" y="${Y(g)+3}" text-anchor="end">${g}</text>`);
 labels.forEach((l,i)=>s+=`<text class="ax" x="${X(i)}" y="${h-6}" text-anchor="middle">${esc(l)}</text>`);
 series.forEach((se,k)=>{const pts=se.vals.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);
  s+=`<polyline class="ln c${k}" fill="none" points="${pts.map(p=>p.join(',')).join(' ')}"/>`+pts.map(p=>`<circle class="dt c${k}" cx="${p[0]}" cy="${p[1]}" r="3.5"/>`).join('')});
 return s+`</svg><div class="lg">${series.map((se,k)=>`<span><i class="sw c${k}"></i>${esc(se.name)}</span>`).join('')}</div>`}
const bars=rows=>rows.length?`<div class="bars">${rows.map(r=>`<div class="bar"><span class="bl">${esc(r.label)}</span><div class="bt"><div class="bf ${r.tg||''}" style="width:${Math.max(0,Math.min(100,r.val))}%"></div></div><b>${f1(r.val)}</b></div>`).join('')}</div>`:'<p class="mut">Belum ada data.</p>';
const avgOf=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null;
const yearSel=(id,v)=>{const y=+bln().slice(0,4);return`<select id="${id}" style="width:auto;margin:0">${[y,y-1,y-2].map(x=>`<option ${String(x)===String(v)?'selected':''}>${x}</option>`).join('')}</select>`};

function paintWho(){$('#who').innerHTML=U?`${PF&&PF.foto?`<img class="av" src="${esc(PF.foto)}" alt="">`:`<span class="av">${esc((U.nama||'?')[0])}</span>`}<div><b>${esc(U.nama)}</b><small>${esc(U.role)}</small></div><button class="btn ghost sm" data-a="out">Keluar</button>`:''}
function render(){
 document.body.className=U?'in':'out';const nav=$('#nav');
 paintWho();
 if(!U){nav.innerHTML='';return V(`<div class="auth card"><img class="logo-lg" src="logo.png" alt="Duta Kampus ULBI" onerror="this.style.display='none'"><h1>Masuk</h1><p class="mut">Sistem KPI Duta Kampus</p><form id="lg"><label>NIM<input name="nim" inputmode="numeric" autocomplete="username" required></label><label>PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label><button class="btn">Masuk</button></form></div>`),
  $('#lg').onsubmit=e=>{e.preventDefault();go(async()=>{const d=await api('login',Object.fromEntries(new FormData(e.target)));T=d.token;U={nim:d.nim,nama:d.nama,role:d.role,divisi:d.divisi};localStorage.setItem('t',T);localStorage.setItem('u',JSON.stringify(U));render()})}}
 const tabs=[['home','Beranda'],['scan','Scan'],['laporan','Laporan'],['profil','Profil'],...(isA()?[['admin','Admin']]:[])],h=location.hash.slice(1)||'home';
 nav.innerHTML=tabs.map(([k,n])=>`<a href="#${k}" class="${k===h?'on':''}">${ico(k)}${n}</a>`).join('');
 if(!PF)api('profile').then(p=>{PF=p;paintWho()}).catch(()=>{});
 stopScan();go(()=>({home,scan,laporan,profil,admin}[h]||home)());
}
addEventListener('hashchange',()=>U&&render());

/* ---- Beranda anggota: skor, penghargaan MOM/MOY, grafik kinerja pribadi ---- */
async function home(){
 V('<p class="mut">Memuat…</p>');if(!AY)AY=bln().slice(0,4);
 const d=await api('me',{year:AY}),l=d.latest,ms=d.months,st=(k,v,x)=>`<div class="card stat"><small>${k}</small><b>${v}</b><i>${x}</i></div>`;
 V(PH('Halo, '+esc(d.nama.split(' ')[0]),'Ringkasan KPI dan kehadiranmu')
 +`<div class="row" style="margin-bottom:14px"><span>${esc(d.divisi||'')} ${tgPill(d.tingkat)}</span>${yearSel('yr',AY)}</div>`
 +(l?`<div class="stats">${st('Skor KPI',f1(l.total),'Bulan '+bn(l.bulan))}${st('Kehadiran',l.hadir+'/'+l.acara,l.pct+'%')}${st('Keaktifan',f1(l.aktif),'dari 100')}${st('Eksekusi',f1(l.eksekusi),'dari 100')}</div>`:'<div class="card mut">Belum ada data KPI.</div>')
 +(l&&l.catatan?`<div class="card" style="margin-top:12px"><small>Catatan admin · ${bn(l.bulan)}</small><p style="margin:4px 0 0">${esc(l.catatan)}</p></div>`:'')
 +(ms.length?`<h3 class="sh">Grafik kinerja saya</h3><div class="g2c"><div class="card"><small>Skor per bulan</small>${lineChart(ms.map(m=>bs(m.bulan)),[{name:'Skor saya',vals:ms.map(m=>m.total>0?m.total:null)},{name:'Kehadiran %',vals:ms.map(m=>m.acara?m.pct:null)}])}${d.tahun?`<small style="margin-top:8px">Rata-rata skor ${AY}: <b>${f1(d.tahun.avg)}</b></small>`:''}</div>`
  +(l?`<div class="card"><small>Komponen ${bn(l.bulan)}</small>${bars([{label:'Kehadiran',val:l.pct},{label:'Keaktifan',val:l.aktif},{label:'Eksekusi',val:l.eksekusi}])}</div>`:'')+'</div>':'')
 +'<h3 class="sh">Riwayat absensi</h3>'+tbl(['Acara','Waktu','Metode'],d.attendance.map(a=>[esc(a.nama),ft(a.ts),`<span class="pill">${esc(a.metode).toUpperCase()}</span>`])));
}

/* ---- Profil: foto, nama, ganti PIN (butuh persetujuan admin) ---- */
const loadImg=f=>new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=()=>{URL.revokeObjectURL(u);no(Error('Foto tidak bisa dibaca. Coba format JPG atau PNG.'))};i.src=u});
async function pickFoto(file){
 if(!file)return;if(file.size>15*1024*1024)throw Error('Ukuran foto maksimal 15 MB');
 if(file.type&&!/^image\//.test(file.type))throw Error('File harus berupa gambar (JPG, PNG, WebP)');
 const im=await loadImg(file),w=im.naturalWidth,h=im.naturalHeight,m=Math.min(w,h);
 if(!m)throw Error('Foto tidak bisa dibaca. Coba format JPG atau PNG.');
 const sz=512,c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,sz,sz);x.drawImage(im,(w-m)/2,(h-m)/2,m,m,0,0,sz,sz);
 let q=.85,d=c.toDataURL('image/jpeg',q);while(d.length>600000&&q>.4){q-=.1;d=c.toDataURL('image/jpeg',q)}
 PF=await api('profileSave',{foto:d});paintWho();toast('Foto diperbarui');profil()}
async function profil(){
 V('<p class="mut">Memuat…</p>');
 try{PF=await api('profile')}catch(e){return V(PH('Profil','Kelola foto, nama, dan PIN akunmu')+`<div class="card"><b>Profil belum bisa dimuat</b><p style="margin:6px 0 12px">${esc(e.message)}</p><button class="btn" data-a="retry">Coba lagi</button></div>`)}
 paintWho();
 const p=PF,r=p.pinRequest,rs={pending:['open','Menunggu persetujuan admin'],approved:['closed','Disetujui'],rejected:['','Ditolak']};
 V(PH('Profil','Kelola foto, nama, dan PIN akunmu')
 +`<div class="cols"><div><div class="card" style="text-align:center">${p.foto?`<img class="pf" src="${esc(p.foto)}" alt="Foto profil">`:`<span class="pf">${esc((p.nama||'?')[0])}</span>`}<h3 style="margin:10px 0 2px">${esc(p.nama)}</h3><small>NIM ${esc(p.nim)} · ${esc(p.divisi||'-')}</small><div style="margin:8px 0 14px">${tgPill(p.tingkat)} <span class="pill">${esc(p.role)}</span></div><label class="btn" style="margin-bottom:8px;cursor:pointer">Pilih foto<input type="file" accept="image/*" id="pfile" hidden></label>${p.foto?'<button class="btn ghost" data-a="pfdel">Hapus foto</button>':''}<p class="mut" style="font-size:.8rem;margin:10px 0 0">Ukuran foto maks. 15 MB (JPG, PNG, WebP). Foto otomatis dipotong persegi dan diperkecil.</p></div></div><div>`
 +`<form id="nf" class="card"><h3 class="sh" style="margin-top:0">Nama</h3><label>Nama lengkap<input name="nama" value="${esc(p.nama)}" minlength="2" maxlength="80" required></label><button class="btn">Simpan nama</button></form>`
 +`<div class="card"><h3 class="sh" style="margin-top:0">Ganti PIN</h3>`
 +(r?`<div class="row" style="margin-bottom:12px"><span class="pill ${rs[r.status][0]}">${rs[r.status][1]}</span><small>${ft(r.status==='pending'?r.created_at:(r.decided_at||r.created_at))}</small></div>`+(r.status==='rejected'&&r.note?`<p style="margin:0 0 12px">Alasan: ${esc(r.note)}</p>`:''):'')
 +(r&&r.status==='pending'?'<p class="mut" style="margin:0 0 12px">PIN lama tetap berlaku sampai admin menyetujui. Mengajukan lagi akan menggantikan permintaan ini.</p><button class="btn ghost" data-a="pcancel" style="margin-bottom:14px">Batalkan permintaan</button>':'')
 +`<form id="pf2"><label>PIN saat ini<input name="currentPin" type="password" inputmode="numeric" autocomplete="current-password" required></label><label>PIN baru (4-20 karakter)<input name="newPin" type="password" inputmode="numeric" autocomplete="new-password" minlength="4" maxlength="20" required></label><label>Ulangi PIN baru<input name="again" type="password" inputmode="numeric" autocomplete="new-password" required></label><button class="btn">Ajukan penggantian PIN</button><p class="mut" style="font-size:.8rem;margin:10px 0 0">PIN baru baru aktif setelah disetujui admin. Setelah disetujui, kamu perlu masuk lagi dengan PIN baru.</p></form></div></div></div>`);
 $('#nf').onsubmit=e=>{e.preventDefault();go(async()=>{PF=await api('profileSave',{nama:e.target.nama.value});U.nama=PF.nama;localStorage.setItem('u',JSON.stringify(U));paintWho();toast('Nama diperbarui');profil()})};
 $('#pf2').onsubmit=e=>{e.preventDefault();go(async()=>{const f=e.target;if(f.newPin.value!==f.again.value)throw Error('Ulangi PIN baru tidak sama');await api('pinRequest',{currentPin:f.currentPin.value,newPin:f.newPin.value});toast('Permintaan dikirim ke admin');profil()})}}

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
const ATABS=()=>[['dash','Dashboard'],['nilai','Penilaian'],['anggota','Anggota'],['acara','Acara'],['laporan','Laporan'],['pin','Verifikasi PIN'],...(U.role==='superadmin'?[['follow','Tindak lanjut']]:[])];
function admin(){
 if(!isA())return;
 V(PH('Admin','Dashboard KPI, penilaian, anggota, acara, dan laporan')+`<div class="seg">${ATABS().map(([k,n])=>`<button class="btn ${k===AT?'':'ghost'}" data-a="atab" data-t="${k}">${n}</button>`).join('')}</div><div id="av"></div>`);
 pinBadge();
 return({dash:aDash,nilai:aNilai,anggota:aAnggota,acara:aAcara,laporan:aLaporan,pin:aPin,follow:aFollow}[AT]||aDash)()}
const pinBadge=()=>api('pinRequests').then(r=>{const b=document.querySelector('[data-t=pin]');if(b&&r.pending)b.textContent='Verifikasi PIN ('+r.pending+')'}).catch(()=>{});

/* -- Dashboard: MOM/MOY per tingkat + grafik seluruh anggota -- */
function awCard(jenis,periode,aw,t){const w=aw[t];let b;
 if(!w)b='<small>Belum ada skor di tingkat ini</small>';
 else if(w.seri)b=`<small style="margin-bottom:6px">Seri penuh (skor, kehadiran, eksekusi sama). Pilih pemenang:</small><select data-pick="${jenis}|${periode}|${t}"><option value="">Pilih…</option>${w.kandidat.map(c=>`<option value="${esc(c.nim)}">${esc(c.nama)}</option>`).join('')}</select>`;
 else b=`<b class="wn">${esc(w.nama)}</b><small>${esc(w.divisi)} · skor ${f1(w.total)} · hadir ${w.pct}% · eksekusi ${f1(w.eksekusi)}${w.manual?' · dipilih admin':''}</small>`+(w.manual?`<button class="btn ghost sm" style="margin-top:8px" data-a="unpick" data-k="${jenis}|${periode}|${t}">Batalkan pilihan</button>`:'');
 return `<div class="card aw ${t}"><small>${TG[t]}</small>${b}</div>`}
const awBlock=(title,jenis,periode,aw)=>`<div class="row"><h3 class="sh">${title}</h3><span class="pill ${aw.final?'open':''}">${aw.final?'Resmi':'Sementara'}</span></div><div class="g2c">${awCard(jenis,periode,aw,'atas')}${awCard(jenis,periode,aw,'bawah')}</div>`;
async function aDash(){
 if(!AY)AY=bln().slice(0,4);
 const d=await api('dashboard',{year:AY}),keys=Object.keys(d.stats).sort();
 if(!keys.includes(AM))AM=keys.includes(bln())?bln():(keys[keys.length-1]||'');
 const ok=r=>r.tingkat&&(AF==='all'||r.tingkat===AF),list=(d.stats[AM]||[]).filter(ok),yl=d.yearly.filter(ok);
 const tr=t=>keys.map(k=>{const a=avgOf((d.stats[k]||[]).filter(r=>r.tingkat===t&&r.total>0).map(r=>r.total));return a==null?null:+a.toFixed(1)});
 $('#av').innerHTML=`<div class="row" style="gap:12px;justify-content:flex-start"><label style="margin:0">Tahun${yearSel('ay',AY)}</label><label style="margin:0">Bulan<select id="am" style="width:auto">${keys.map(k=>`<option value="${k}" ${k===AM?'selected':''}>${bn(k)}</option>`).join('')||'<option value="">-</option>'}</select></label></div>`
 +(AM&&d.mom[AM]?awBlock('Member of the Month · '+bn(AM),'mom',AM,d.mom[AM]):'<p class="mut">Belum ada data bulan ini.</p>')
 +awBlock('Member of the Year · '+AY,'moy',AY,d.moy)
 +`<h3 class="sh">Grafik seluruh anggota</h3><div class="seg">${[['all','Semua'],['atas','Atas'],['bawah','Bawah']].map(([k,n])=>`<button class="btn ${k===AF?'':'ghost'}" data-a="af" data-f="${k}">${n}</button>`).join('')}</div>`
 +`<div class="g2c"><div class="card"><small>Skor KPI ${AM?bn(AM):''}</small>${bars(list.map(r=>({label:r.nama,val:r.total,tg:r.tingkat})))}</div>`
 +`<div class="card"><small>Rata-rata skor ${AY} (dasar MOY)</small>${bars(yl.map(r=>({label:r.nama,val:r.avg,tg:r.tingkat})))}</div></div>`
 +(keys.length?`<div class="card"><small>Tren rata-rata skor per bulan</small>${lineChart(keys.map(bs),[{name:'Tingkat atas',vals:tr('atas')},{name:'Tingkat bawah',vals:tr('bawah')}])}</div>`:'')
 +`<button class="btn ghost" style="width:auto" data-a="csv">Unduh rekap ${AY} (CSV)</button>`}

/* -- Penilaian anggota -- */
const calcTot=(pct,acara,k,e)=>acara>0?pct*.4+k*.3+e*.3:(k*.3+e*.3)/.6;
async function aNilai(){
 if(!AM2)AM2=bln();
 const [ml,sc,d]=await Promise.all([api('memberList'),api('scores',{bulan:AM2}),api('dashboard',{year:AM2.slice(0,4)})]);
 const st={},sm={};(d.stats[AM2]||[]).forEach(r=>st[r.nim]=r);sc.forEach(r=>sm[r.nim]=r);
 $('#av').innerHTML=`<div class="card"><div class="cols" style="gap:12px"><label style="margin:0">Bulan penilaian<input type="month" id="nm" value="${AM2}"></label><label style="margin:0">Cari anggota<input id="nq" placeholder="Nama anggota…"></label></div><p class="mut" style="margin:10px 0 0">Skor = kehadiran 40% + keaktifan 30% + eksekusi 30%. Kehadiran dihitung otomatis dari absensi.</p></div>`
 +'<div class="g3c">'+ml.filter(m=>m.nim!=='00000000').map(m=>{const s=st[m.nim]||{pct:0,hadir:0,acara:0},v=sm[m.nim]||{keaktifan:'',eksekusi:'',catatan:''};
  const t=calcTot(s.pct,s.acara,+v.keaktifan||0,+v.eksekusi||0);
  return `<div class="card nr" data-nim="${esc(m.nim)}" data-pct="${s.pct}" data-acara="${s.acara}" data-q="${esc(m.nama.toLowerCase())}"><div class="row"><b>${esc(m.nama)}</b>${tgPill(m.tingkat)}</div><small>${esc(m.divisi)} · hadir ${s.hadir}/${s.acara} (${s.pct}%)</small>`
  +`<div class="g2" style="margin-top:10px"><label>Keaktifan<input type="number" inputmode="decimal" min="0" max="100" name="k" value="${v.keaktifan}"></label><label>Eksekusi<input type="number" inputmode="decimal" min="0" max="100" name="e" value="${v.eksekusi}"></label></div><label>Catatan<input name="c" maxlength="300" value="${esc(v.catatan)}"></label>`
  +`<div class="row"><span>Skor: <b class="tot">${f1(t)}</b></span><button class="btn sm" data-a="sc">Simpan</button></div></div>`}).join('')+'</div>'}

/* -- Anggota: tambah / ubah / hapus -- */
const tgPreview=(nim,list)=>{const a=String(nim).slice(2,4);if(!/^\d{4,}$/.test(nim)||!/^\d\d$/.test(a)||a==='00')return'Tingkat ditentukan dari angkatan di NIM (contoh 0325xxxx = angkatan 25).';
 const mn=list.map(m=>String(m.nim).slice(2,4)).filter(x=>/^\d\d$/.test(x)&&x!=='00').sort()[0];return`Angkatan ${a} → ${a===mn?TG.atas:TG.bawah}`};
const roleOpts=cur=>['member','admin',...(U.role==='superadmin'?['superadmin']:[])].map(r=>`<option ${r===cur?'selected':''}>${r}</option>`).join('');
async function aAnggota(){
 ML=await api('memberList');
 $('#av').innerHTML=`<div class="cols"><form id="mf" class="card"><h3 class="sh" style="margin-top:0">Tambah anggota</h3><label>NIM<input name="target" inputmode="numeric" pattern="\\d{4,20}" required></label><p id="tgh" class="mut" style="margin:-6px 0 14px;font-size:.82rem">${tgPreview('',ML)}</p><label>Nama<input name="nama" required></label><label>Divisi<input name="divisi"></label><label>Role<select name="role">${roleOpts('member')}</select></label><label>PIN awal<input name="newPin" inputmode="numeric" minlength="4" required></label><button class="btn">Tambah anggota</button></form>`
 +`<div><input id="mq" placeholder="Cari nama / NIM…" style="margin:0 0 12px"><p class="mut" style="margin:0 0 8px">${ML.length} anggota</p><div id="ml">`
 +tbl(['Nama','NIM','Divisi','Tingkat','Role','Aksi'],ML.map(m=>[`<div class="who">${acAva(m)}<b>${esc(m.nama)}</b></div>`,esc(m.nim),esc(m.divisi),tgPill(m.tingkat)||'-',`<span class="pill">${esc(m.role)}</span>`,`<button class="btn ghost sm" data-a="medit" data-n="${esc(m.nim)}">Ubah</button> <button class="btn ghost sm" data-a="mdel" data-n="${esc(m.nim)}">Hapus</button>`]),'c')+'</div></div></div>';
 paintAva();
 $('#mf').onsubmit=e=>{e.preventDefault();go(async()=>{await api('memberSave',{...Object.fromEntries(new FormData(e.target)),isNew:true});toast('Anggota ditambahkan');aAnggota()})}}

/* -- Tindak lanjut (Super Admin) -- */
async function aFollow(){
 if(!AM2)AM2=bln();const d=await api('followups',{bulan:AM2});
 $('#av').innerHTML=`<div class="card"><label style="margin:0">Bulan<input type="month" id="fm" value="${AM2}"></label><p class="mut" style="margin:10px 0 0">Anggota dengan rata-rata keaktifan dan eksekusi di bawah ${d.threshold} · ${d.total} anggota</p></div>`
 +tbl(['Nama','Divisi','Keaktifan','Eksekusi','Rata-rata','Catatan'],d.rows.map(r=>[esc(r.nama),esc(r.divisi),f1(r.keaktifan),f1(r.eksekusi),`<span class="pill open">${r.avg}</span>`,esc(r.catatan||'-')]))}

/* -- Verifikasi permintaan ganti PIN -- */
async function aPin(){
 const d=await api('pinRequests'),st={pending:['open','Menunggu'],approved:['closed','Disetujui'],rejected:['','Ditolak']};
 $('#av').innerHTML=`<p class="mut" style="margin-top:0">${d.pending} permintaan menunggu. PIN baru hanya berlaku setelah kamu setujui, pastikan peminta benar-benar pemilik akun. Permintaan milik admin hanya bisa diproses Super Admin atau admin lain.</p>`
 +tbl(['Anggota','Divisi','Diajukan','Status','Aksi'],d.rows.map(r=>[esc(r.nama)+`<small>${esc(r.nim)}${r.role!=='member'?' · '+esc(r.role):''}</small>`,esc(r.divisi||'-'),ft(r.created_at),`<span class="pill ${st[r.status][0]}">${st[r.status][1]}</span>`+(r.status==='rejected'&&r.note?`<small>${esc(r.note)}</small>`:''),
  r.canDecide?`<button class="btn sm" data-a="pdec" data-id="${r.id}" data-d="approve">Setujui</button> <button class="btn ghost sm" data-a="pdec" data-id="${r.id}" data-d="reject">Tolak</button>`:(r.status==='pending'?'<small>Perlu admin lain</small>':'-')]))}

/* -- Acara -- */
/* ---- Acara: daftar + halaman pengelolaan absensi di tab yang sama; QR tampil sebagai popup ---- */
let AE=null,AD,FM=null;
const acIni=n=>(String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('')||'?').toUpperCase();
const acAva=m=>`<span class="ava" data-n="${esc(m.nim)}">${esc(acIni(m.nama))}</span>`;
const acWho=m=>`<div class="who">${acAva(m)}<div><b>${esc(m.nama)}</b><small>${esc(m.nim)}</small></div></div>`;
const AST={hadir:'Hadir',izin:'Izin',sakit:'Sakit',belum:'Belum'},acPill=s=>`<span class="pill dot ${s}">${AST[s]||s}</span>`;
async function paintAva(){try{FM=FM||await api('memberFotos')}catch{return}document.querySelectorAll('.ava[data-n]').forEach(el=>{const f=FM[el.dataset.n];if(f){el.style.backgroundImage=`url("${f}")`;el.textContent=''}})}
async function aAcara(){
 if(AE)return aAcDetail();
 const ev=await api('events');
 $('#av').innerHTML=`<div class="cols"><form id="ef" class="card"><h3 class="sh" style="margin-top:0">Acara baru</h3><label>Nama<input name="nama" required></label><label>Tanggal<input type="date" name="tanggal" required></label><button class="btn">Buat acara</button></form><div>`
 +tbl(['Acara','Tanggal','Status','Hadir','Aksi'],ev.slice().reverse().map(e=>[`<button class="lnk" data-a="evopen" data-id="${e.id}">${esc(e.nama)}</button>`,fd(e.tanggal),`<span class="pill ${e.status}">${e.status}</span>`,e.hadir+' hadir',
  `<button class="btn sm" data-a="evopen" data-id="${e.id}">Kelola</button> `+(e.status==='open'?`<button class="btn ghost sm" data-a="st" data-id="${e.id}" data-s="closed">Tutup</button>`:`<button class="btn ghost sm" data-a="st" data-id="${e.id}" data-s="open">Buka</button>`)+` <button class="btn ghost sm" data-a="evdel" data-id="${e.id}">Hapus</button>`]),'c')+'</div></div>';
 $('#ef').onsubmit=e=>{e.preventDefault();go(async()=>{await api('createEvent',Object.fromEntries(new FormData(e.target)));aAcara()})}}
async function aAcDetail(){
 const [ev,rows]=await Promise.all([api('events'),api('attendanceManage',{id:AE})]),e=ev.find(x=>x.id===AE);
 if(!e){AE=null;return aAcara()}
 AD={e,rows:rows.filter(x=>x.nim!=='00000000'),q:'',f:''};
 $('#av').innerHTML=`<div class="hd"><div><button class="lnk back" data-a="evback">← Semua acara</button><h2 class="evt">${esc(e.nama)}</h2><small>${fd(e.tanggal)} · <span class="pill ${e.status}">${e.status}</span></small></div><div class="acts"><button class="btn ghost sm" data-a="qr">Tampilkan QR</button><button class="btn sm" data-a="st" data-id="${e.id}" data-s="${e.status==='open'?'closed':'open'}">${e.status==='open'?'Tutup absensi':'Buka absensi'}</button></div></div>`
 +`<div class="mini" id="mn"></div><div class="tb"><input id="ac_q" type="search" placeholder="Cari nama, NIM, divisi…"><select id="ac_f"><option value="">Semua status</option>${Object.entries(AST).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div><div id="at"></div>`;
 drawAtt()}
function drawAtt(){
 const {rows,q,f}=AD,n=s=>rows.filter(r=>r.status===s).length,qq=q.toLowerCase();
 $('#mn').innerHTML=Object.entries(AST).map(([k,v])=>`<div><b>${n(k)}</b><small>${v}</small></div>`).join('');
 const list=rows.filter(r=>(!f||r.status===f)&&(!qq||(r.nama+r.nim+(r.divisi||'')).toLowerCase().includes(qq)));
 $('#at').innerHTML=tbl(['Anggota','Divisi','Status','Waktu','Ubah'],list.map(r=>[acWho(r),esc(r.divisi||'-'),acPill(r.status),r.ts?ft(r.ts):'-',
  `<select class="sel" data-att="${esc(AE)}|${esc(r.nim)}">${Object.entries(AST).map(([k,v])=>`<option value="${k}"${k===r.status?' selected':''}>${v}</option>`).join('')}</select>`]),'c')+`<p class="mut" style="margin:8px 4px">Menampilkan ${list.length} dari ${rows.length} anggota</p>`;
 paintAva()}
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
const csvCell=v=>{let t=String(v??'');if(/^[=+\-@]/.test(t))t="'"+t;return /[",\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t};
async function exportCsv(){
 const d=await api('exportData',{bulan:'all',year:AY}),h=['Bulan','Peringkat','Nama','Divisi','Tingkat','Hadir','Acara','Kehadiran %','Keaktifan','Eksekusi','Skor','MOM','Catatan'];
 const lines=[h,...d.rows.map(r=>[r.bulan,r.rank,r.nama,r.divisi,r.tingkat,r.hadir,r.acara,r.pct,r.aktif,r.eksekusi,r.total,r.mom?'MOM':'',r.catatan])];
 lines.push([],['MOY '+d.year+' Tingkat Atas',d.moy.atas||'-'],['MOY '+d.year+' Tingkat Bawah',d.moy.bawah||'-']);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.map(l=>l.map(csvCell).join(',')).join('\n')],{type:'text/csv'}));a.download='rekap-kpi-'+d.year+'.csv';document.body.appendChild(a);a.click();a.remove()}
const dlgOpen=h=>{$('#dlg').innerHTML=h;$('#dlg').showModal()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;go(async()=>{
 if(a==='out'){await api('logout').catch(()=>{});out()}
 else if(a==='cam')await startScan();
 else if(a==='edit'){const r=RL.reports.find(x=>x.id==id),f=$('#lf');f.jenis.value=r.jenis;f.periode.value=r.periode;f.judul.value=r.judul;f.isi.value=r.isi;f.onchange();f.scrollIntoView()}
 else if(a==='delr'){if(confirm('Hapus laporan ini?')){await api('laporanDelete',{id});laporan()}}
 else if(a==='atab'){AT=b.dataset.t;AE=null;admin()}
 else if(a==='af'){AF=b.dataset.f;aDash()}
 else if(a==='csv')await exportCsv();
 else if(a==='unpick'){const[j,p,t]=b.dataset.k.split('|');await api('awardPick',{jenis:j,periode:p,tingkat:t,target:''});aDash()}
 else if(a==='sc'){const r=b.closest('.nr');await api('score',{bulan:AM2,target:r.dataset.nim,keaktifan:r.querySelector('[name=k]').value||0,eksekusi:r.querySelector('[name=e]').value||0,catatan:r.querySelector('[name=c]').value});toast('Nilai tersimpan')}
 else if(a==='medit'){const m=ML.find(x=>x.nim===b.dataset.n);dlgOpen(`<h3 class="sh" style="margin-top:0">Ubah anggota</h3><form id="ef2"><p class="mut" style="margin:0 0 12px">NIM ${esc(m.nim)} · ${m.tingkat?TG[m.tingkat]:'tanpa tingkat'}</p><label>Nama<input name="nama" value="${esc(m.nama)}" required></label><label>Divisi<input name="divisi" value="${esc(m.divisi)}"></label><label>Role<select name="role">${roleOpts(m.role)}</select></label><label>PIN baru (kosongkan jika tidak diganti)<input name="newPin" inputmode="numeric" minlength="4"></label><button class="btn">Simpan</button></form><button class="btn ghost" style="margin-top:8px" onclick="this.closest('dialog').close()">Batal</button>`);
  $('#ef2').onsubmit=ev=>{ev.preventDefault();go(async()=>{await api('memberSave',{...Object.fromEntries(new FormData(ev.target)),target:m.nim});$('#dlg').close();toast('Anggota diperbarui');aAnggota()})}}
 else if(a==='mdel'){const m=ML.find(x=>x.nim===b.dataset.n);if(confirm('Hapus '+m.nama+'? Absensi, nilai, dan laporannya ikut terhapus permanen.')){await api('memberDelete',{target:m.nim});toast('Anggota dihapus');aAnggota()}}
 else if(a==='evopen'){AE=id;aAcara()}
 else if(a==='evback'){AE=null;aAcara()}
 else if(a==='retry')profil();
 else if(a==='pfdel'){if(confirm('Hapus foto profil?')){PF=await api('profileSave',{removeFoto:true});paintWho();toast('Foto dihapus');profil()}}
 else if(a==='pcancel'){PF=await api('pinRequestCancel');toast('Permintaan dibatalkan');profil()}
 else if(a==='pdec'){const ap=b.dataset.d==='approve';let note='';if(ap){if(!confirm('Setujui penggantian PIN? Anggota harus masuk lagi dengan PIN baru.'))return}else{note=prompt('Alasan penolakan (opsional)');if(note===null)return}
  await api('pinRequestDecide',{id,decision:b.dataset.d,note});toast(ap?'PIN disetujui':'Permintaan ditolak');aPin();pinBadge()}
 else if(a==='st'){await api('setStatus',{id,status:b.dataset.s});aAcara()}
 else if(a==='evdel'){if(confirm('Hapus acara beserta absensinya?')){await api('deleteEvents',{ids:[id]});aAcara()}}
 else if(a==='dldel'){await api('deadlineDelete',{periode:b.dataset.p});aLaporan()}
 else if(a==='qr'){const d=await api('qr',{id:AE}),q=qrcode(0,'M');q.addData(JSON.stringify({e:d.id,s:d.secret}));q.make();
  dlgOpen(`<div class="qrbox"><div class="qr-badge">${ico('scan')}</div><h3>Scan QR absensi</h3><p class="mut">Arahkan kamera dari tab Scan ke kode ini untuk mencatat kehadiran.</p><div class="qr-frame">${q.createSvgTag({scalable:true,margin:2})}</div><div class="qr-sep"><span>acara</span></div><div class="qr-info"><b>${esc(AD.e.nama)}</b><small>${fd(AD.e.tanggal)}</small></div><div class="qr-foot"><button class="btn" onclick="this.closest('dialog').close()">Tutup</button></div></div>`)}
})});
document.addEventListener('change',e=>{const t=e.target;go(async()=>{
 if(t.id==='pfile'){const f=t.files[0];t.value='';await pickFoto(f)}
 else if(t.id==='yr'){AY=t.value;home()}
 else if(t.id==='ay'){AY=t.value;AM='';aDash()}
 else if(t.id==='am'){AM=t.value;aDash()}
 else if(t.id==='nm'&&t.value){AM2=t.value;aNilai()}
 else if(t.id==='fm'&&t.value){AM2=t.value;aFollow()}
 else if(t.dataset.pick){if(!t.value)return;const[j,p,g]=t.dataset.pick.split('|');await api('awardPick',{jenis:j,periode:p,tingkat:g,target:t.value});toast('Pemenang dipilih');aDash()}
 else if(t.id==='ac_f'){AD.f=t.value;drawAtt()}
 else if(t.dataset.att){const[ev,nim]=t.dataset.att.split('|');await api('setAttendanceStatus',{id:ev,target:nim,status:t.value});toast('Absensi diperbarui');if(AE&&AD){const r=await api('attendanceManage',{id:AE});AD.rows=r.filter(x=>x.nim!=='00000000');drawAtt()}}
})});
document.addEventListener('input',e=>{const t=e.target;
 if(t.closest('.nr')&&(t.name==='k'||t.name==='e')){const r=t.closest('.nr'),v=n=>Math.max(0,Math.min(100,+r.querySelector('[name='+n+']').value||0));r.querySelector('.tot').textContent=f1(calcTot(+r.dataset.pct,+r.dataset.acara,v('k'),v('e')))}
 else if(t.id==='nq'){const q=t.value.toLowerCase().trim();document.querySelectorAll('.nr').forEach(c=>c.hidden=!!q&&!c.dataset.q.includes(q))}
 else if(t.id==='ac_q'){AD.q=t.value;drawAtt()}
 else if(t.id==='mq'){const q=t.value.toLowerCase().trim();document.querySelectorAll('#ml tbody tr').forEach(r=>r.hidden=!!q&&!r.textContent.toLowerCase().includes(q))}
 else if(t.form&&t.form.id==='mf'&&t.name==='target'){$('#tgh').textContent=tgPreview(t.value.trim(),ML)}});
$('#dlg').addEventListener('close',()=>{if(U&&isA()&&AT==='acara'&&location.hash==='#admin'&&$('#av'))go(aAcara)});
render();
