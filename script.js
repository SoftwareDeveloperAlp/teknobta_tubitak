document.addEventListener('DOMContentLoaded', () => {
  const msgEl = document.getElementById('msg');
  const btn   = document.getElementById('start-drive-btn');

  if ('NDEFReader' in window) {
    startNFC().catch(err => {
      console.warn('NFC başlatılamadı:', err);
      showFallback();
    });
  } else {
    console.warn('Tarayıcıda NFC API yok.');
    showFallback();
  }

  btn.addEventListener('click', () => {
    window.location.href = 'drive.html';
  });

  function showFallback() {
    msgEl.textContent = 'NFC desteklenmiyor veya hata oluştu.';
    btn.classList.remove('hidden');
  }
});

async function startNFC() {
  const ndef = new NDEFReader();
  await ndef.scan();
  ndef.onreadingerror = () => {
    console.error('NFC okunamadı.');
    document.getElementById('start-drive-btn').classList.remove('hidden');
  };
  ndef.onreading = () => {
    window.location.href = 'drive.html';
  };
}