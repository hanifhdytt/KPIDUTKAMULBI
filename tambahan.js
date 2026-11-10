/* Tambahan v5.8.0 — (1) scan QR dari galeri/file, (2) pendaftaran akun dengan persetujuan admin.
   Dimuat SETELAH app.js dan memakai fungsi/variabel milik app.js (api, go, toast, V, PH, $, esc, U, T, loadImg, submitScan, render). */
(function () {

  /* ---------- 1. Scan QR dari galeri / penyimpanan ---------- */
  async function qrFromFile(f) {
    if (f.size > 15 * 1024 * 1024) throw Error('Ukuran gambar maksimal 15 MB');
    if (f.type && !/^image\//.test(f.type)) throw Error('File harus berupa gambar (JPG, PNG, WebP)');
    let im; try { im = await createImageBitmap(f); } catch (e) { im = await loadImg(f); }
    const w = im.width || im.naturalWidth, h = im.height || im.naturalHeight;
    if (!w || !h) throw Error('Gambar tidak bisa dibaca. Coba format JPG atau PNG.');
    if ('BarcodeDetector' in window) {
      try { const r = await new BarcodeDetector({ formats: ['qr_code'] }).detect(im); if (r[0] && r[0].rawValue) return r[0].rawValue; } catch (e) {}
    }
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    for (const max of [1000, 640, 1600, 420]) {
      const s = Math.min(4, max / Math.max(w, h)), iw = Math.round(w * s), ih = Math.round(h * s), pad = Math.round(Math.max(iw, ih) * .08);
      c.width = iw + pad * 2; c.height = ih + pad * 2;
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, pad, pad, iw, ih);
      const r = jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'attemptBoth' });
      if (r && r.data) return r.data;
    }
    throw Error('QR tidak terbaca. Pastikan seluruh QR terlihat jelas, lalu coba lagi.');
  }
  scan = function () {
    V(PH('Scan absensi', 'Pindai QR dengan kamera, atau pilih gambar QR dari galeri')
      + '<div class="sc-wrap"><video id="cam" playsinline muted autoplay hidden></video><button class="btn" data-a="cam">Buka kamera</button>'
      + '<div class="sc-or"><span>atau</span></div>'
      + '<label class="btn ghost sc-pick">Pilih gambar dari galeri / file<input type="file" accept="image/*" id="qf" hidden></label>'
      + '<p class="note" style="margin:10px 0 0">Pakai ini bila QR sudah tersimpan di HP atau komputermu, misalnya screenshot dari grup.</p></div>');
    $('#qf').onchange = e => go(async () => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; toast('Membaca QR…'); await submitScan(await qrFromFile(f)); });
  };

  /* ---------- 2. Pendaftaran akun baru (menunggu persetujuan admin) ---------- */
  const box = () => document.querySelector('.lg-box');
  const getRg = () => { try { return JSON.parse(localStorage.getItem('rg') || 'null'); } catch (e) { return null; } };
  const setRg = v => v ? localStorage.setItem('rg', JSON.stringify(v)) : localStorage.removeItem('rg');

  function addRegisterLink() {
    const b = box(); if (!b || b.querySelector('[data-reg]')) return;
    b.insertAdjacentHTML('beforeend', '<p class="lg-help lg-reg">Belum punya akun? <button type="button" class="lnk" data-reg>Daftar di sini</button></p>');
    if (getRg()) b.insertAdjacentHTML('beforeend', '<p class="lg-help lg-reg">Sudah mendaftar? <button type="button" class="lnk" data-rgcheck>Cek status pendaftaran</button></p>');
  }
  const baseRender = render;
  render = function () { const r = baseRender.apply(this, arguments); if (!U) addRegisterLink(); return r; };

  async function openRegister() {
    const b = box(); if (!b) return;
    b.innerHTML = '<p class="mut">Memuat…</p>';
    let info = { org: '', tahun: new Date().getFullYear(), min: 2024, max: new Date().getFullYear() };
    try { info = await api('registerInfo'); } catch (e) {}
    b.innerHTML = '<h2>Daftar akun baru</h2><p class="mut">Pendaftaranmu akan diperiksa admin. NIM dibuat otomatis setelah disetujui.</p>'
      + '<form id="rg" autocomplete="off">'
      + '<label>Nama lengkap<input name="nama" placeholder="Nama lengkap" minlength="2" maxlength="80" autocomplete="name" required></label>'
      + '<label>Angkatan (tahun masuk)<input name="angkatan" placeholder="' + info.tahun + '" inputmode="numeric" pattern="\\d{4}" maxlength="4" required></label>'
      + '<p class="rg-hint" id="rgh"></p>'
      + '<label>Jabatan / divisi<input name="jabatan" placeholder="Contoh: Staf Humas" maxlength="60" required></label>'
      + '<label>PIN (4-20 karakter)<input name="pin" type="password" minlength="4" maxlength="20" autocomplete="new-password" required></label>'
      + '<label>Ulangi PIN<input name="again" type="password" minlength="4" maxlength="20" autocomplete="new-password" required></label>'
      + '<button class="btn">Daftar</button></form>'
      + '<p class="lg-help">Sudah punya akun? <button type="button" class="lnk" data-login>Masuk</button></p>';
    const f = $('#rg'), hint = () => {
      const a = f.angkatan.value.replace(/\D/g, '');
      $('#rgh').textContent = a.length === 4 ? 'NIM-mu akan berbentuk ' + info.org + a.slice(2) + 'xxxx (diberikan setelah disetujui)' : 'NIM = tahun organisasi + angkatan + nomor urut. Angkatan ' + info.min + '–' + info.max + '.';
    };
    f.angkatan.oninput = hint; hint();
    f.onsubmit = e => {
      e.preventDefault();
      go(async () => {
        if (f.pin.value !== f.again.value) throw Error('Ulangi PIN tidak sama');
        const btn = f.querySelector('.btn'); btn.disabled = true;
        try {
          const d = await api('register', { nama: f.nama.value, angkatan: f.angkatan.value, jabatan: f.jabatan.value, pin: f.pin.value });
          setRg({ id: d.id, ticket: d.ticket, nama: f.nama.value.trim() });
          waiting();
        } finally { btn.disabled = false; }
      });
    };
  }

  // halaman "menunggu konfirmasi" setelah mengirim pendaftaran
  function waiting() {
    const r = getRg() || {};
    box().innerHTML = '<div class="rg-ok"><span class="rg-check wait">⏳</span><h2>Menunggu konfirmasi admin</h2>'
      + '<p class="mut">Terima kasih' + (r.nama ? ', ' + esc(r.nama.split(' ')[0]) : '') + '. Pendaftaranmu sudah terkirim dan sedang diperiksa admin. '
      + 'Setelah disetujui, kamu mendapat NIM untuk masuk bersama PIN yang kamu buat tadi.</p>'
      + '<p class="note">Cek statusnya kapan saja lewat tombol “Cek status pendaftaran” di halaman login (pada perangkat ini).</p>'
      + '<button type="button" class="btn" data-login>Ke halaman login</button></div>';
  }

  // hasil cek status: menunggu / disetujui (tampilkan NIM) / ditolak
  async function checkStatus() {
    const r = getRg(); if (!r) { toast('Tidak ada pendaftaran di perangkat ini'); return render(); }
    const d = await api('registerStatus', { id: r.id, ticket: r.ticket });
    if (d.status === 'approved') {
      box().innerHTML = '<div class="rg-ok"><span class="rg-check">✓</span><h2>Pendaftaran disetujui</h2>'
        + '<p class="mut">Ini NIM kamu. Catat dan simpan; NIM dipakai untuk masuk bersama PIN yang kamu buat saat mendaftar.</p>'
        + '<div class="rg-nim">' + esc(d.nim) + '</div>'
        + '<button type="button" class="btn ghost" data-copy="' + esc(d.nim) + '">Salin NIM</button>'
        + '<button type="button" class="btn" data-login data-clear>Masuk sekarang</button></div>';
    } else if (d.status === 'rejected') {
      box().innerHTML = '<div class="rg-ok"><span class="rg-check no">✕</span><h2>Pendaftaran ditolak</h2>'
        + '<p class="mut">' + (d.note ? 'Alasan: ' + esc(d.note) : 'Hubungi admin Duta Kampus untuk informasi lebih lanjut.') + '</p>'
        + '<button type="button" class="btn" data-reg data-clear>Daftar ulang</button>'
        + '<button type="button" class="btn ghost" data-login data-clear>Ke halaman login</button></div>';
    } else {
      waiting(); toast('Masih menunggu konfirmasi admin');
    }
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-reg],[data-login],[data-copy],[data-rgcheck]'); if (!b) return;
    if (b.hasAttribute('data-clear')) setRg(null);                // pendaftaran sudah selesai diproses
    if (b.hasAttribute('data-reg')) go(openRegister);
    else if (b.hasAttribute('data-login')) render();
    else if (b.hasAttribute('data-rgcheck')) go(checkStatus);
    else if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(() => toast('NIM disalin'), () => toast('Salin manual: ' + b.dataset.copy));
    else toast('Salin manual: ' + b.dataset.copy);
  });

  if (!U || location.hash === '#scan') render();
})();
