document.addEventListener('DOMContentLoaded', () => {
    // --- 7. Otomatik Gece Modu ---
    const hour = new Date().getHours();
    if (hour >= 19 || hour < 6) document.body.classList.add('dark');
  
    // --- Tema Değiştirici ---
    const themeBtn = document.getElementById('theme-btn');
    updateThemeButton();
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      updateThemeButton();
    });
    function updateThemeButton() {
      themeBtn.textContent = document.body.classList.contains('dark') ? '🌙' : '🌞';
    }

    document.getElementById('emergency-btn').addEventListener('click', () => {
      // Yüksek sesli uyarı sesi çal
      const alarm = new Audio('assets/alarm.mp3');
      alarm.volume = 1.0;
      alarm.play();
    
      // Sesli uyarı ver
      speak("Acil durum algılandı. Yardım çağırılıyor.");
    
      // Android'de 112'yi aramaya çalış
      try {
        window.location.href = 'tel:112';
      } catch {
        alert("112 araması başlatılamadı.");
      }
    });
  
    // --- 4. Sürüş / Dinlenme Modu & Ses Ayarları ---
    document.getElementById('mute-btn').addEventListener('click', () => {
      try {
        window.location.href = 'intent:#Intent;action=android.settings.SOUND_SETTINGS;end';
      } catch {
        alert('Bu cihazda desteklenmiyor.');
      }
    });
    document.getElementById('dnd-btn').addEventListener('click', () => {
      try {
        window.location.href = 'intent:#Intent;action=android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS;end';
      } catch {
        alert('Bu cihazda desteklenmiyor.');
      }
    });
  
    // --- Değişkenler & Elementler ---
    const speedEl    = document.getElementById('speed');
    const batteryEl  = document.getElementById('battery');
    const weatherEl  = document.getElementById('weather');
    const distanceEl = document.getElementById('distance');
    const ecoEl      = document.getElementById('eco-feedback');
    const voiceEl    = document.getElementById('voice-cmd');
    let lastTime     = Date.now();
    let lastSpeed    = 0;
    let distanceM    = 0;
    let currentLat, currentLon;
    const speedLimit  = 120;    // km/saat
    const highAccel   = 5;      // m/s²
    const highDecel   = -5;     // m/s²
  
    // --- 3. GPS / Hız & Mesafe Takibi & 2. Hız Uyarısı & 5. Eko Sürüş ---
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(pos => {
        const now     = Date.now();
        const dt      = (now - lastTime) / 1000;  // saniye
        const sMps    = pos.coords.speed || 0;     // m/s
        const sKmh    = sMps * 3.6;                // km/saat
        currentLat    = pos.coords.latitude;
        currentLon    = pos.coords.longitude;
  
        // Hız
        speedEl.textContent = `Hız: ${sKmh.toFixed(1)} km/saat`;
        if (sKmh > speedLimit) alert('Hız limitini aştınız!');
  
        // Mesafe
        distanceM   += sMps * dt;
        distanceEl.textContent = `Mesafe: ${(distanceM/1000).toFixed(2)} km`;
  
        // İvme (Eko Sürüş)
        const accel = dt ? (sMps - lastSpeed) / dt : 0;
        if (accel > highAccel)        ecoEl.textContent = 'Eko Sürüş: Hızlı Kalkış!';
        else if (accel < highDecel)    ecoEl.textContent = 'Eko Sürüş: Ani Fren!';
        else                           ecoEl.textContent = 'Eko Sürüş: İyi';
  
        lastTime  = now;
        lastSpeed = sMps;
      }, _=> {
        speedEl.textContent = 'Hız: Kullanılamıyor';
      }, { enableHighAccuracy: true });
    } else {
      speedEl.textContent = 'Hız: Desteklenmiyor';
    }
  
    // --- 6. Hava Durumu & Uyarılar ---
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then(r => r.json())
          .then(d => {
            const code = d.current_weather.weathercode;
            const tmp  = d.current_weather.temperature;
            const desc = getWeatherDesc(code);
            weatherEl.textContent = `Hava Durumu: ${desc}, ${tmp}°C`;
            if (desc.includes('Yağmur') || desc.includes('Kar')) 
              alert('Dikkat! Kötü hava koşulları.');
          })
          .catch(_ => weatherEl.textContent = 'Hava Durumu: Alınamadı');
      }, _ => {
        weatherEl.textContent = 'Hava Durumu: Konum Gerekli';
      });
    }
  
    function getWeatherDesc(c) {
      switch(c) {
        case 0: return 'Açık'; case 1: return 'Hafif Bulutlu';
        case 2: return 'Bulutlu'; case 3: return 'Çok Bulutlu';
        case 4: return 'Yağmur';  case 5: return 'Kar';
        default: return 'Bilinmiyor';
      }
    }
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
          updateBattery(battery);
          battery.addEventListener('levelchange', () => updateBattery(battery));
      });
    }
    function updateBattery(battery) {
      document.getElementById('battery').textContent =
          'Batarya: ' + Math.round(battery.level * 100) + '%';
    }
  
    // --- 8. Sesli Komutlar (Voice Assistant) ---

    function speak(text) {
        // Tarayıcıda speechSynthesis desteği var mı?
        if (!('speechSynthesis' in window)) {
          console.log("speechSynthesis API desteği yok.");
          return;
        }
      
        // Mevcut sesli oynatmaları iptal et (gereksiz çakışmaları önlemek için)
        window.speechSynthesis.cancel();
      
        // Yeni bir konuşma isteği oluştur
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        
        // Olay dinleyicileriyle durumu logla (isteğe bağlı)
        utterance.onstart = () => console.log("🗣️ Konuşma başladı:", text);
        utterance.onend   = () => console.log("✅ Konuşma bitti");
    
        // Konuşma hatası durumunda
        utterance.onerror = (e) => {
            console.error("❌ Konuşma hatası:", e.error);
            alert(`Ses sentez hatası: ${e.error}`);
        };
      
        // Konuşmayı başlat
        window.speechSynthesis.speak(utterance);
    }         
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'tr-TR';
      recog.continuous = true;
      recog.onresult = e => {
        const cmd = e.results[e.results.length-1][0].transcript.toLowerCase();
        voiceEl.textContent = `Sesli Komut: ${cmd}`;
  
        if (cmd.includes('hız')) {
            const txt = speedEl.textContent;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('mesafe')) {
            const txt = distanceEl.textContent;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('batarya')) {
            const txt = batteryEl.textContent;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('hava')) {
            const txt = weatherEl.textContent;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('eko')) {
            const txt = ecoEl.textContent;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('tema')) {
            themeBtn.click();
            const mode = document.body.classList.contains('dark') ? 'Karanlık' : 'Aydınlık';
            const txt = `${mode} tema etkinleştirildi.`;
            speak(txt);
            alert(txt);
          
          } else if (cmd.includes('trafik')) {
            mapsBtn.click();  // mapsBtn, script'te document.getElementById('maps-btn')
            const txt = 'Google Maps trafik bilgisiyle açılıyor.';
            speak(txt);
          
          } else if (cmd.includes('durdur') || cmd.includes('bitir')) {
            recog.stop();
            const txt = 'Sesli komut dinleme durduruldu.';
            speak(txt);
            alert(txt);
            voiceEl.textContent = 'Komut Dinleme: Durdu';
          
          } else {
            const txt = 'Üzgünüm, bu komutu anlayamadım.';
            speak(txt);
            alert(txt);
          }
      };
      recog.start();
    } else {
      voiceEl.textContent = 'Ses Tanıma: Desteklenmiyor';
    }

    document.getElementById('vhcl-help').addEventListener('click', () => {
      window.location.href = 'ikaz.html';
    });

    // --- 3. GPS ile Trafik Durumu & Google Maps ---
    document.getElementById('maps-btn').addEventListener('click', () => {
      const dest = prompt('Nereye gitmek istersiniz?');
      if (!dest) return;
      if (!currentLat || !currentLon) {
        alert('Önce konum izni verin.');
        return;
      }
      const url = `https://www.google.com/maps/dir/?api=1`
                + `&origin=${currentLat},${currentLon}`
                + `&destination=${encodeURIComponent(dest)}`
                + `&traffic_model=pessimistic`;
      window.open(url, '_blank');
    });
    
  });
  