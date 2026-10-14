/**
 * GRECJA OLIMPIJSKA 2026 - GŁÓWNY SKRYPT APLIKACJI
 * Kompleksowa obsługa galerii, licznika "Odwiedziny bogów", pogody online i interakcji
 * Język: 100% Język Polski
 */

// ===================================================================
// 1. STAN APLIKACJI I ZMIENNE GLOBALNE
// ===================================================================

let allPhotos = [];
let filteredPhotos = [];
let currentIndex = 0;
let currentFilter = 'all';
let slideshowInterval = null;
let isSlideshowPlaying = false;
let currentFrameTheme = 'theme-gold-vector'; // 'theme-gold-vector' lub 'theme-classic-frame'

// Domyślne dane pogodowe (fallback na wypadek braku połączenia)
const WEATHER_FALLBACK = {
  airTemp: 21.4,
  apparentTemp: 20.8,
  seaTemp: 22.5,
  windSpeed: 6.2,
  windDirection: 'Południowo-wschodni (ESE) • Bryza z Zatoki Termajskiej',
  cloudCover: 15,
  weatherDesc: 'Słonecznie nad Riwierą Olimpijską'
};

// ===================================================================
// 2. INICJALIZACJA PO ZAŁADOWANIU DOKUMENTU
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicjalizacja bazy zdjęć
  if (typeof GALLERY_PHOTOS !== 'undefined' && Array.isArray(GALLERY_PHOTOS)) {
    allPhotos = GALLERY_PHOTOS;
  } else {
    console.error('Błąd: Zmienna GALLERY_PHOTOS nie została załadowana!');
    allPhotos = [];
  }

  filteredPhotos = [...allPhotos];

  // Inicjalizacja modułów aplikacji
  initGreekClock();
  initVisitorCounter();
  initLiveWeather();
  initGallery();
  initThemeSwitcher();
  initKeyboardAndTouch();
});

// ===================================================================
// 3. GRECKI ZEGAR LOKALNY (CZAS W GRECJI - EEST / UTC+3)
// ===================================================================

function initGreekClock() {
  const clockEl = document.getElementById('greek-clock');
  if (!clockEl) return;

  function updateClock() {
    try {
      const now = new Date();
      // Grecja leży w strefie Europe/Athens
      const greekTime = new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Athens',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);

      clockEl.textContent = `${greekTime} (czas w Grecji)`;
    } catch (e) {
      const local = new Date().toLocaleTimeString('pl-PL');
      clockEl.textContent = `${local} (czas w Grecji)`;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ===================================================================
// 4. LICZNIK "ODWIEDZINY BOGÓW" (Z TŁEM 5 WAZ GRECKICH)
// ===================================================================

function initVisitorCounter() {
  const STORAGE_KEY = 'grecja2026_gods_visits_v2'; // Nowy klucz – reset do zera
  const BASE_VISITS = 0; // Wyzerowany licznik

  let visits = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  if (isNaN(visits) || visits < BASE_VISITS) {
    visits = BASE_VISITS;
  }

  // Zliczamy wejście na stronę (zwiększamy przy otwarciu sesji)
  if (!sessionStorage.getItem('grecja2026_session_counted_v2')) {
    visits++;
    localStorage.setItem(STORAGE_KEY, visits);
    sessionStorage.setItem('grecja2026_session_counted_v2', 'true');
  }

  // Wyświetlamy cyfry na 5 wazach
  displayVisitsOnVases(visits, false);

  // Obsługa przycisku składania daru Zeusowi (+1)
  const sacrificeBtn = document.getElementById('sacrifice-btn');
  const hintText = document.getElementById('counter-hint-text');

  if (sacrificeBtn) {
    sacrificeBtn.addEventListener('click', () => {
      visits++;
      localStorage.setItem(STORAGE_KEY, visits);
      displayVisitsOnVases(visits, true);
      playLyreChime();

      if (hintText) {
        hintText.innerHTML = `⚡ <strong>Zeus przyjął Twój dar!</strong> Bóstwa Olimpu zesłały swoje błogosławieństwo. Łączna liczba odwiedzin: <strong>${visits}</strong>.`;
        hintText.style.color = '#fae8a4';
      }
    });
  }
}

function displayVisitsOnVases(num, triggerAnimation) {
  // Formatujemy liczbę do 5 cyfr (np. 01249)
  const numStr = String(num).padStart(5, '0');
  const digits = numStr.slice(-5).split('');

  digits.forEach((digit, idx) => {
    const el = document.getElementById(`digit-${idx + 1}`);
    if (el) {
      el.textContent = digit;
      if (triggerAnimation) {
        const parentMedallion = el.closest('.digit-medallion');
        if (parentMedallion) {
          parentMedallion.classList.remove('flip');
          void parentMedallion.offsetWidth; // Restart animacji CSS
          parentMedallion.classList.add('flip');
          setTimeout(() => parentMedallion.classList.remove('flip'), 650);
        }
      }
    }
  });
}

/**
 * Synteza dźwięku starożytnej liry greckiej za pomocą Web Audio API
 * Generuje harmoniczny akord w skali doryckiej
 */
function playLyreChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Akord liry: A4 (440Hz), C#5 (554Hz), E5 (659Hz), A5 (880Hz)
    const notes = [440.0, 554.37, 659.25, 880.0];
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Barwa przypominająca struny liry
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.3);
    });
  } catch (err) {
    console.warn('Web Audio API niedostępne lub wyłączone:', err);
  }
}

// ===================================================================
// 5. POGODA NA ŻYWO NA RIWERZE OLIMPIJSKIEJ (OPEN-METEO)
// ===================================================================

function initLiveWeather() {
  const refreshBtn = document.getElementById('refresh-weather-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchOlympicRivieraWeather(true);
    });
  }

  fetchOlympicRivieraWeather(false);

  // Automatyczne odświeżanie co 5 minut
  setInterval(() => {
    fetchOlympicRivieraWeather(false);
  }, 5 * 60 * 1000);
}

async function fetchOlympicRivieraWeather(isManual) {
  const refreshIcon = document.querySelector('.refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('spin');

  // Koordynaty Riwiery Olimpijskiej (Paralia Katerinis / Morze Egejskie)
  const lat = 40.27;
  const lon = 22.51;
  const seaLon = 22.60;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=auto`;
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${seaLon}&current=sea_surface_temperature,wave_height&timezone=auto`;

  try {
    const [wRes, mRes] = await Promise.all([
      fetch(weatherUrl, { cache: 'no-store' }),
      fetch(marineUrl, { cache: 'no-store' })
    ]);

    let weatherData = null;
    let marineData = null;

    if (wRes.ok) weatherData = await wRes.json();
    if (mRes.ok) marineData = await mRes.json();

    if (weatherData && weatherData.current) {
      const cur = weatherData.current;
      const airTemp = cur.temperature_2m;
      const appTemp = cur.apparent_temperature;
      const windSpeed = cur.wind_speed_10m;
      const windDirDeg = cur.wind_direction_10m;
      const clouds = cur.cloud_cover;
      const code = cur.weather_code;

      let seaTemp = WEATHER_FALLBACK.seaTemp;
      if (marineData && marineData.current && marineData.current.sea_surface_temperature != null) {
        seaTemp = marineData.current.sea_surface_temperature;
      }

      updateWeatherUI({
        airTemp: airTemp,
        apparentTemp: appTemp,
        seaTemp: seaTemp,
        windSpeed: windSpeed,
        windDirection: formatWindDirection(windDirDeg),
        cloudCover: clouds,
        weatherCode: code
      });
    } else {
      updateWeatherUI(WEATHER_FALLBACK);
    }
  } catch (error) {
    console.warn('Błąd pobierania danych z Open-Meteo, użycie danych buforowych:', error);
    updateWeatherUI(WEATHER_FALLBACK);
  } finally {
    if (refreshIcon) {
      setTimeout(() => refreshIcon.classList.remove('spin'), 600);
    }
  }
}

function formatWindDirection(deg) {
  if (deg == null) return 'Zatoka Termajska • Wiatr łagodny';
  const dirs = [
    'Północny (N)',
    'Północno-północno-wschodni (NNE)',
    'Północno-wschodni (NE)',
    'Wschodnio-północno-wschodni (ENE)',
    'Wschodni (E)',
    'Wschodnio-południowo-wschodni (ESE)',
    'Południowo-wschodni (SE)',
    'Południowo-południowo-wschodni (SSE)',
    'Południowy (S)',
    'Południowo-południowo-zachodni (SSW)',
    'Południowo-zachodni (SW)',
    'Zachodnio-południowo-zachodni (WSW)',
    'Zachodni (W)',
    'Zachodnio-północno-zachodni (WNW)',
    'Północno-zachodni (NW)',
    'Północno-północno-zachodni (NNW)'
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return `${dirs[idx]} • Wiatr od morza`;
}

function getWeatherDescription(code, clouds) {
  if (code === 0) return { text: 'Bezchmurnie • Słonecznie', icon: '☀️' };
  if (code === 1 || code === 2) return { text: 'Niewielkie zachmurzenie', icon: '🌤️' };
  if (code === 3) return { text: 'Umiarkowane zachmurzenie nad wybrzeżem i masywem Olimpu', icon: '⛅' };
  if (code >= 45 && code <= 48) return { text: 'Poranne mgły nad Zatoką Termajską', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { text: 'Ciepły przelotny deszcz', icon: '🌧️' };
  if (code >= 80 && code <= 82) return { text: 'Lekki deszcz przelotny', icon: '🌦️' };
  if (code >= 95) return { text: 'Burza nad masywem Olimpu z piorunami', icon: '⛈️' };
  
  if (clouds < 20) return { text: 'Słonecznie nad Riwierą Olimpijską', icon: '☀️' };
  if (clouds < 60) return { text: 'Częściowe zachmurzenie', icon: '⛅' };
  return { text: 'Pochmurnie', icon: '☁️' };
}

function updateWeatherUI(data) {
  // 1. Temperatura powietrza
  const valAir = document.getElementById('val-air-temp');
  const subAir = document.getElementById('sub-air-feels');
  if (valAir) valAir.textContent = `${Math.round(data.airTemp * 10) / 10}°C`;
  if (subAir) subAir.textContent = `Odczuwalna: ${Math.round(data.apparentTemp * 10) / 10}°C`;

  // 2. Temperatura wody w Morzu Egejskim
  const valSea = document.getElementById('val-sea-temp');
  const subSea = document.getElementById('sub-sea-desc');
  if (valSea) valSea.textContent = `${Math.round(data.seaTemp * 10) / 10}°C`;
  if (subSea) {
    if (data.seaTemp >= 21) {
      subSea.textContent = 'Morze Egejskie • Ciepła woda, idealna do kąpieli';
    } else {
      subSea.textContent = 'Zatoka Termajska • Krystaliczna, przyjemnie orzeźwiająca';
    }
  }

  // 3. Wiatr
  const valWind = document.getElementById('val-wind');
  const subWind = document.getElementById('sub-wind-dir');
  if (valWind) valWind.textContent = `${Math.round(data.windSpeed * 10) / 10} km/h`;
  if (subWind) subWind.textContent = data.windDirection || 'Bryza morska';

  // 4. Zachmurzenie
  const valClouds = document.getElementById('val-clouds');
  const subClouds = document.getElementById('sub-cloud-desc');
  const iconClouds = document.getElementById('symbol-clouds');

  const weatherMeta = getWeatherDescription(data.weatherCode, data.cloudCover);
  if (valClouds) valClouds.textContent = `${data.cloudCover}%`;
  if (subClouds) subClouds.textContent = weatherMeta.text;
  if (iconClouds) iconClouds.textContent = weatherMeta.icon;
}

// ===================================================================
// 6. GŁÓWNA GALERIA FOTOGRAFICZNA (NAWIGACJA ALFA & OMEGA, RAMKA)
// ===================================================================

function initGallery() {
  if (allPhotos.length === 0) return;

  // Przyciski nawigacji Alfa (Α) i Omega (Ω)
  const btnPrevAlpha = document.getElementById('btn-prev-alpha');
  const btnNextOmega = document.getElementById('btn-next-omega');

  if (btnPrevAlpha) {
    btnPrevAlpha.addEventListener('click', (e) => {
      e.preventDefault();
      navigateGallery(-1);
    });
  }

  if (btnNextOmega) {
    btnNextOmega.addEventListener('click', (e) => {
      e.preventDefault();
      navigateGallery(1);
    });
  }

  // Filtry kategorii
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyFilter(tab.dataset.category);
    });
  });

  // Skok do kadru
  const jumpBtn = document.getElementById('jump-btn');
  const jumpInput = document.getElementById('jump-input');
  if (jumpBtn && jumpInput) {
    jumpBtn.addEventListener('click', () => {
      jumpToPhotoNumber(parseInt(jumpInput.value, 10));
    });
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        jumpToPhotoNumber(parseInt(jumpInput.value, 10));
      }
    });
  }

  // Pokaz slajdów
  const slideshowBtn = document.getElementById('slideshow-btn');
  if (slideshowBtn) {
    slideshowBtn.addEventListener('click', toggleSlideshow);
  }

  // Pełny ekran
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', toggleFullscreen);
  }

  // Kliknięcie na zdjęcie włącza tryb pełnoekranowy
  const photoFrame = document.getElementById('main-frame-element');
  if (photoFrame) {
    photoFrame.addEventListener('click', toggleFullscreen);
  }

  // Przyciski przewijania taśmy miniatur
  const scrollLeftBtn = document.getElementById('filmstrip-scroll-left');
  const scrollRightBtn = document.getElementById('filmstrip-scroll-right');
  const filmstripContainer = document.getElementById('filmstrip-container');

  if (scrollLeftBtn && filmstripContainer) {
    scrollLeftBtn.addEventListener('click', () => {
      filmstripContainer.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }

  if (scrollRightBtn && filmstripContainer) {
    scrollRightBtn.addEventListener('click', () => {
      filmstripContainer.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }

  // Renderowanie początkowego stanu
  renderFilmstrip();
  renderActivePhoto();
}

function applyFilter(category) {
  currentFilter = category;
  if (category === 'all') {
    filteredPhotos = [...allPhotos];
  } else {
    filteredPhotos = allPhotos.filter(p => p.category === category);
  }

  currentIndex = 0;
  renderFilmstrip();
  renderActivePhoto();
}

window.filterAndJump = function(category) {
  const tab = document.querySelector(`.filter-tab[data-category="${category}"]`);
  if (tab) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  }
  applyFilter(category);
  const gallerySection = document.getElementById('gallery-section');
  if (gallerySection) {
    gallerySection.scrollIntoView({ behavior: 'smooth' });
  }
};

function navigateGallery(direction) {
  if (filteredPhotos.length === 0) return;

  currentIndex += direction;
  if (currentIndex < 0) {
    currentIndex = filteredPhotos.length - 1;
  } else if (currentIndex >= filteredPhotos.length) {
    currentIndex = 0;
  }

  renderActivePhoto();
}

function jumpToPhotoNumber(photoId) {
  if (isNaN(photoId)) return;
  const foundIdx = filteredPhotos.findIndex(p => p.id === photoId);
  if (foundIdx !== -1) {
    currentIndex = foundIdx;
    renderActivePhoto();
  } else {
    // Sprawdzamy w całej bazie
    const globalIdx = allPhotos.findIndex(p => p.id === photoId);
    if (globalIdx !== -1) {
      applyFilter('all');
      const allTab = document.querySelector('.filter-tab[data-category="all"]');
      if (allTab) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
      }
      currentIndex = globalIdx;
      renderActivePhoto();
    }
  }
}

function renderActivePhoto() {
  if (filteredPhotos.length === 0) return;
  const photo = filteredPhotos[currentIndex];
  if (!photo) return;

  const imgEl = document.getElementById('active-gallery-image');
  const spinnerEl = document.getElementById('photo-loading-spinner');
  const titleEl = document.getElementById('photo-title-text');
  const indexEl = document.getElementById('photo-index-display');
  const dateEl = document.getElementById('photo-date-badge');
  const catEl = document.getElementById('photo-category-badge');
  const locEl = document.getElementById('photo-location-badge');
  const descEl = document.getElementById('photo-desc-text');
  const mapsBtn = document.getElementById('google-maps-btn');
  const coordsEl = document.getElementById('photo-coords-display');
  const jumpInput = document.getElementById('jump-input');

  // Aktualizacja danych tekstowych w języku polskim
  if (titleEl) titleEl.textContent = photo.title;
  if (indexEl) indexEl.textContent = `Zdjęcie ${photo.id} z ${allPhotos.length} (${currentIndex + 1} z ${filteredPhotos.length} w wybranej kategorii)`;
  if (dateEl) dateEl.textContent = `📅 ${photo.date}, ${photo.time}`;
  if (catEl) catEl.textContent = `🏷️ ${photo.categoryName}`;
  if (locEl) locEl.textContent = `📍 ${photo.location}`;
  if (coordsEl) coordsEl.textContent = `(${photo.lat.toFixed(4)}° N, ${photo.lng.toFixed(4)}° E)`;
  if (jumpInput) jumpInput.value = photo.id;

  // Obsługa edytowalnego opisu per-zdjęcie
  if (descEl) {
    // Odłącz stary listener przed zmianą
    if (descEl._saveListener) {
      descEl.removeEventListener('input', descEl._saveListener);
    }

    // Załaduj zapisany opis lub użyj domyślnego z danych
    const descKey = `grecja2026_desc_${photo.id}`;
    const savedDesc = localStorage.getItem(descKey);
    descEl.value = (savedDesc !== null) ? savedDesc : (photo.description || '');

    // Nowy listener – zapisuje każdą edycję
    descEl._saveListener = () => {
      localStorage.setItem(descKey, descEl.value);
    };
    descEl.addEventListener('input', descEl._saveListener);
  }

  // Przycisk Google Maps
  if (mapsBtn) {
    mapsBtn.href = photo.mapsUrl;
  }

  // Płynna zmiana zdjęcia z efektem fade – BEZ przewijania strony
  if (imgEl) {
    imgEl.classList.add('fade-out');
    if (spinnerEl) spinnerEl.classList.add('visible');

    const tempImg = new Image();
    tempImg.src = photo.filename;

    tempImg.onload = () => {
      imgEl.src = photo.filename;
      imgEl.alt = `${photo.title} - ${photo.location}`;
      imgEl.classList.remove('fade-out');
      if (spinnerEl) spinnerEl.classList.remove('visible');
    };

    tempImg.onerror = () => {
      imgEl.src = photo.filename;
      imgEl.classList.remove('fade-out');
      if (spinnerEl) spinnerEl.classList.remove('visible');
    };
  }

  // Podświetlenie aktywnej miniaturki – BEZ przewijania całej strony
  highlightActiveThumbnail();
}

function renderFilmstrip() {
  const track = document.getElementById('filmstrip-track');
  if (!track) return;
  track.innerHTML = '';

  filteredPhotos.forEach((photo, idx) => {
    const item = document.createElement('div');
    item.className = 'thumb-item';
    item.dataset.index = idx;
    item.title = `${photo.title} (Zdjęcie nr ${photo.id})`;

    const img = document.createElement('img');
    img.src = photo.filename;
    img.alt = photo.title;
    img.loading = 'lazy';

    item.appendChild(img);
    item.addEventListener('click', () => {
      currentIndex = idx;
      renderActivePhoto();
    });

    track.appendChild(item);
  });

  highlightActiveThumbnail();
}

function highlightActiveThumbnail() {
  const thumbs = document.querySelectorAll('.thumb-item');
  const filmstripContainer = document.getElementById('filmstrip-container');

  thumbs.forEach((th, idx) => {
    if (idx === currentIndex) {
      th.classList.add('active');
      // Przewijamy tylko poziomo wewnątrz paska miniatur, NIE całą stronę
      if (filmstripContainer) {
        const thumbLeft = th.offsetLeft;
        const thumbWidth = th.offsetWidth;
        const containerWidth = filmstripContainer.offsetWidth;
        const scrollTarget = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
        filmstripContainer.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    } else {
      th.classList.remove('active');
    }
  });
}

// ===================================================================
// 7. PRZEŁĄCZNIK MOTYWU RAMKI MEANDROWEJ
// ===================================================================

function initThemeSwitcher() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const frameEl = document.getElementById('main-frame-element');

  const savedTheme = localStorage.getItem('grecja2026_frame_theme');
  if (savedTheme) {
    currentFrameTheme = savedTheme;
  }

  if (frameEl) {
    frameEl.classList.remove('theme-gold-vector', 'theme-classic-frame');
    frameEl.classList.add(currentFrameTheme);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (currentFrameTheme === 'theme-gold-vector') {
        currentFrameTheme = 'theme-classic-frame';
        showToast('Zmieniono motyw ramki: Antyczna kamienna ramka (a-ramkaa3)');
      } else {
        currentFrameTheme = 'theme-gold-vector';
        showToast('Zmieniono motyw ramki: Złoty meander olimpijski (powiększony)');
      }

      localStorage.setItem('grecja2026_frame_theme', currentFrameTheme);

      if (frameEl) {
        frameEl.classList.remove('theme-gold-vector', 'theme-classic-frame');
        frameEl.classList.add(currentFrameTheme);
      }
    });
  }
}

function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '25px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(6, 17, 31, 0.95)';
    toast.style.color = '#fae8a4';
    toast.style.padding = '0.7rem 1.6rem';
    toast.style.borderRadius = '30px';
    toast.style.border = '1px solid #d4af37';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6), 0 0 15px rgba(212,175,55,0.4)';
    toast.style.fontFamily = 'Montserrat, sans-serif';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.transition = 'all 0.3s ease';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
  }, 2500);
}

// ===================================================================
// 8. POKAZ SLAJDÓW I TRYB PEŁNOEKRANOWY
// ===================================================================

function toggleSlideshow() {
  const icon = document.getElementById('slideshow-icon');
  const text = document.getElementById('slideshow-text');
  const btn = document.getElementById('slideshow-btn');

  if (isSlideshowPlaying) {
    clearInterval(slideshowInterval);
    isSlideshowPlaying = false;
    if (icon) icon.textContent = '▶️';
    if (text) text.textContent = 'Pokaz slajdów';
    if (btn) btn.classList.remove('active');
    showToast('Zatrzymano pokaz slajdów');
  } else {
    isSlideshowPlaying = true;
    if (icon) icon.textContent = '⏸️';
    if (text) text.textContent = 'Zatrzymaj';
    if (btn) btn.classList.add('active');
    showToast('Uruchomiono automatyczny pokaz slajdów');

    slideshowInterval = setInterval(() => {
      navigateGallery(1);
    }, 4500);
  }
}

function toggleFullscreen() {
  const isFs = document.body.classList.toggle('fullscreen-active');
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    fsBtn.innerHTML = isFs ? '<span>✕</span> Zamknij' : '<span>⛶</span> Pełny ekran';
  }
  showToast(isFs ? 'Włączono tryb pełnoekranowy (Naciśnij Esc lub F, aby wyjść)' : 'Wyłączono tryb pełnoekranowy');
}

// ===================================================================
// 9. OBSŁUGA KLAWIATURY I GESTÓW DOTYKOWYCH
// ===================================================================

function initKeyboardAndTouch() {
  window.addEventListener('keydown', (e) => {
    // Ignoruj gdy użytkownik pisze w polu formularza
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Lewy przycisk: Alfa (A) lub Strzałka w lewo
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateGallery(-1);
    }
    // Prawy przycisk: Omega (O, w) lub Strzałka w prawo
    else if (e.key === 'o' || e.key === 'O' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowRight') {
      e.preventDefault();
      navigateGallery(1);
    }
    // Spacja: Pokaz slajdów
    else if (e.key === ' ') {
      e.preventDefault();
      toggleSlideshow();
    }
    // F: Pełny ekran
    else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
    // Escape: Wyjście z pełnego ekranu
    else if (e.key === 'Escape' && document.body.classList.contains('fullscreen-active')) {
      toggleFullscreen();
    }
  });

  // Obsługa gestów dotykowych (Swipe) na urządzeniach mobilnych
  const stage = document.getElementById('photo-viewport');
  if (stage) {
    let touchStartX = 0;
    let touchEndX = 0;

    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe w prawo -> Poprzednie (Alfa)
          navigateGallery(-1);
        } else {
          // Swipe w lewo -> Następne (Omega)
          navigateGallery(1);
        }
      }
    }
  }
}
