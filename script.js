/* script.js — Final, Ramping, dan Profesional
   - Fokus pada interaktivitas (Countdown, Animasi, Lightbox, Musik, Copy)
   - Logika populasi konten statis & sapaan sudah ditangani oleh
     skrip inline di index.html untuk performa yang lebih cepat.
*/

(function () {
  'use strict';

  /* -----------------------
     Helpers
  ----------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const safeText = (s) => String(s ?? '');
  
  /* -----------------------
     Configuration (Hanya untuk fallback, data utama ada di inline script)
  ----------------------- */
  const W = window.__WEDDING ?? {
    dateISO: '2026-01-11T09:00:00',
    bank: { account: '1234567890' }
  };

  /* -----------------------
     DOMContentLoaded — run all init after DOM ready
  ----------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // FUNGSI DIHAPUS: populateStaticContent() -> sudah di index.html
    // FUNGSI DIHAPUS: initGreeting() -> sudah di index.html
    
    initCountdown();
    initIntersectionObserver(); // Untuk galeri .animate
    initLightbox();
    initMusicAutoplay();
    initCopyAndQr();
    
    // FUNGSI DIHAPUS: initSmoothAnchors() -> sudah di style.css (scroll-behavior)
  });


  /* -----------------------
     Countdown (updates every second)
  ----------------------- */
  function initCountdown() {
    const display = $('#countdown-display');
    if (!display) return;
    
    let isFirstRender = true;
    let targetTime;
    try {
      targetTime = new Date(safeText(W.dateISO)).getTime();
      if (Number.isNaN(targetTime)) throw new Error('Invalid dateISO');
    } catch (e) {
      targetTime = new Date('2026-01-11T09:00:00').getTime(); // Fallback
    }

    function render() {
      const now = Date.now();
      const diff = targetTime - now;
      
      if (diff <= 0) {
        display.innerHTML = `<div class="count-item"><span>00</span><p>Hari</p></div>
                             <div class="count-item"><span>00</span><p>Jam</p></div>
                             <div class="count-item"><span>00</span><p>Menit</p></div>
                             <div class="count-item"><span>00</span><p>Detik</p></div>`;
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const itemsHtml = [
      `<div class="count-item"><span>${String(days).padStart(2, '0')}</span><p>Hari</p></div>`,
      `<div class="count-item"><span>${String(hours).padStart(2, '0')}</span><p>Jam</p></div>`,
      `<div class="count-item"><span>${String(minutes).padStart(2, '0')}</span><p>Menit</p></div>`,
      `<div class="count-item"><span>${String(seconds).padStart(2, '0')}</span><p>Detik</p></div>`
    ].join('');

    display.innerHTML = itemsHtml;
    
    // Jika ini render pertama, tambahkan kelas animasi "pop-in"
    if (isFirstRender) {
      display.querySelectorAll('.count-item').forEach((item, index) => {
        // Tambahkan delay bertahap untuk animasi pop-in
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('pop-in');
      });
      isFirstRender = false; // Setel agar tidak animasi lagi
    }
    // === AKHIR DARI KODE BARU ===
  }

  render();
    const timerInterval = setInterval(render, 1000);
    
    // Hentikan interval jika hitungan selesai
    setTimeout(() => {
        if (targetTime - Date.now() <= 0) {
            clearInterval(timerInterval);
        }
    }, targetTime - Date.now() + 1000);
  }

  /* -----------------------
     IntersectionObserver for .animate elements
     (Ini benar dan diperlukan untuk galeri)
  ----------------------- */
  function initIntersectionObserver() {
    try {
      const nodes = $$('.animate');
      if (!nodes.length) return;
      
      const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });

      nodes.forEach((n) => obs.observe(n));
    } catch (err) {
      console.warn('IntersectionObserver failed', err);
    }
  }

  /* -----------------------
     Lightbox for gallery images
  ----------------------- */
  function initLightbox() {
    try {
      const imgs = $$('.gallery-item img');
      const lb = $('#lightbox');
      const lbImg = $('#lb-img');
      const lbClose = $('#lb-close');
      if (!lb || !lbImg || !lbClose) return;

      imgs.forEach((img) => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('src') || img.dataset.src;
          if (!src) return;
          lbImg.src = src;
          lb.setAttribute('aria-hidden', 'false');
          document.documentElement.style.overflow = 'hidden';
        });
      });

      function close() {
        lb.setAttribute('aria-hidden', 'true');
        lbImg.src = ''; // Hentikan loading gambar
        document.documentElement.style.overflow = '';
      }

      lbClose.addEventListener('click', close);
      lb.addEventListener('click', (ev) => {
        if (ev.target === lb) close(); // Tutup hanya jika klik di latar belakang
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && lb.getAttribute('aria-hidden') === 'false') {
          close();
        }
      });
    } catch (err) {
      console.warn('initLightbox error', err);
    }
  }

  /* -----------------------
     Music autoplay with graceful fallback
  ----------------------- */
  function initMusicAutoplay() {
    try {
      const audio = $('#bg-music');
      const fallback = $('#music-fallback');
      if (!audio) return;

      audio.volume = 0.6;

      function tryPlay() {
        const p = audio.play();
        if (p !== undefined) {
          p.then(() => {
            if (fallback) fallback.style.display = 'none'; // Sukses
          }).catch(() => {
            if (fallback) fallback.style.display = 'block'; // Gagal, tampilkan tombol
          });
        }
      }

      // Coba putar saat user pertama kali berinteraksi
      function onInteraction() {
        if (audio.paused) {
            tryPlay();
        }
        // Hapus listener setelah interaksi pertama
        document.removeEventListener('click', onInteraction, { passive: true });
        document.removeEventListener('touchstart', onInteraction, { passive: true });
      }
      document.addEventListener('click', onInteraction, { passive: true });
      document.addEventListener('touchstart', onInteraction, { passive: true });
      
      // Beberapa browser mungkin memblokir autoplay sepenuhnya sampai interaksi
      // jadi kita juga coba autoplay saat load (mungkin gagal)
      window.addEventListener('load', tryPlay);

      // Logika untuk tombol fallback
      if (fallback) {
        fallback.addEventListener('click', () => {
          audio.play().then(() => {
            fallback.style.display = 'none';
          }).catch(() => {
            alert('Browser memblokir pemutaran otomatis. Mohon izinkan suara.');
          });
        });
      }
    } catch (err) {
      console.warn('initMusicAutoplay error', err);
    }
  }

  /* -----------------------
     Copy rekening & Toggle QR
     PERUBAHAN: Dipasang ke ID tombol, bukan fungsi global
  ----------------------- */
  function initCopyAndQr() {
    try {
      // 1. Logika Tombol Copy
      const copyBtn = $('#btn-copy-rek'); // ID dari index.html yang diperbarui
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          try {
            const accEl = $('#bankAccount');
            const acc = accEl ? accEl.textContent.trim() : (W.bank?.account || '');
            if (!acc) {
              alert('Nomor rekening belum tersedia.');
              return;
            }
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(acc).then(() => {
                alert('Nomor rekening disalin: ' + acc);
              });
            } else {
              // Fallback untuk browser lama
              window.prompt('Salin nomor rekening berikut:', acc);
            }
          } catch (err) {
            console.warn('copyRekening error', err);
            alert('Gagal menyalin. Silakan salin secara manual.');
          }
        });
      }
      
      // 2. Logika Tombol Toggle QR
      const toggleBtn = $('#toggle-qr');
      const qrImg = $('#bank-qr');
      if (toggleBtn && qrImg) {
        // Sembunyikan QR by default (sesuai style .hidden)
        qrImg.classList.add('hidden');
        toggleBtn.textContent = 'Tampilkan QR';

        toggleBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const isHidden = qrImg.classList.toggle('hidden');
          toggleBtn.textContent = isHidden ? 'Tampilkan QR' : 'Sembunyikan QR';
        });
      }
    } catch (err) {
      console.warn('initCopyAndQr error', err);
    }
  }

  // End of IIFE
})();