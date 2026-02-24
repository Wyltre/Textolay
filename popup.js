document.addEventListener('DOMContentLoaded', function () {
  const statusEl = document.getElementById('status-message');
  const apiKeyInput = document.getElementById('api-key');
  const saveBtn = document.getElementById('save-api-key');
  const correctBtn = document.getElementById('correct-text');
  const themeToggle = document.getElementById('theme-toggle');
  const iconLight = document.getElementById('theme-icon-light');
  const iconDark = document.getElementById('theme-icon-dark');
  const logoImg = document.getElementById('logo-img');

  /* Tema yönetimi */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      iconLight.style.display = 'none';
      iconDark.style.display = 'block';
      logoImg.src = 'icons/icon-dark-128.png';
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      iconLight.style.display = 'block';
      iconDark.style.display = 'none';
      logoImg.src = 'icons/icon-128.png';
    } else {
      document.documentElement.removeAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      iconLight.style.display = prefersDark ? 'none' : 'block';
      iconDark.style.display = prefersDark ? 'block' : 'none';
      logoImg.src = prefersDark ? 'icons/icon-dark-128.png' : 'icons/icon-128.png';
    }
  }

  chrome.storage.sync.get('theme', function (data) {
    applyTheme(data.theme || 'auto');
  });

  themeToggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme');
    let next;
    if (current === 'dark') next = 'light';
    else if (current === 'light') next = 'auto';
    else next = 'dark';

    chrome.storage.sync.set({ theme: next });
    applyTheme(next);
  });

  /* Durum mesajları */
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status';
    if (type) statusEl.classList.add(type);
  }

  function clearStatus() {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }

  /* API anahtarı yükleme */
  chrome.storage.sync.get('geminiApiKey', function (data) {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
      showStatus('API anahtarı yüklendi', 'success');
    }
  });

  /* Düzeltme sayacı */
  chrome.storage.sync.get('correctionCount', function (data) {
    document.getElementById('counter-value').textContent = data.correctionCount || 0;
  });

  /* API anahtarı kaydetme */
  saveBtn.addEventListener('click', function () {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus('Lütfen geçerli bir API anahtarı girin', 'error');
      return;
    }
    chrome.storage.sync.set({ geminiApiKey: key }, function () {
      showStatus('API anahtarı kaydedildi', 'success');
      setTimeout(clearStatus, 3000);
    });
  });

  /* Sayfa durumu kontrolü */
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0] || !tabs[0].url) return;

    const url = tabs[0].url;
    if (!url.includes('techolay.net')) {
      showStatus('Bu eklenti sadece Techolay sitesinde çalışır', 'warning');
      correctBtn.disabled = true;
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { action: 'checkPageLoaded' }, function (response) {
      if (chrome.runtime.lastError) {
        showStatus('Sayfa ile bağlantı kurulamadı, sayfayı yenileyin', 'warning');
        addRefreshButton(tabs[0].id);
        return;
      }
      if (response && response.loaded) {
        showStatus('Techolay sayfası hazır', 'success');
      }
    });
  });

  /* Metin düzeltme tetikleme */
  correctBtn.addEventListener('click', function () {
    showStatus('Metin düzeltiliyor...', 'warning');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        showStatus('Aktif sekme bulunamadı', 'error');
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'correctText' }, function (response) {
        if (chrome.runtime.lastError) {
          showStatus('Sayfa ile bağlantı kurulamadı. Sayfayı yenileyin.', 'error');
          addRefreshButton(tabs[0].id);
          return;
        }

        if (response && response.status === 'success') {
          showStatus('Metin düzeltildi!', 'success');
          setTimeout(clearStatus, 3000);
        } else {
          const err = response && response.error ? response.error : 'Editör alanı bulunamadı';
          showStatus('Hata: ' + err, 'error');
        }
      });
    });
  });

  /* Yenile butonu ekleme */
  function addRefreshButton(tabId) {
    const parent = statusEl.parentElement;
    if (parent.querySelector('.refresh-btn')) return;

    const btn = document.createElement('button');
    btn.textContent = 'Sayfayı Yenile';
    btn.className = 'action-button refresh-btn';
    btn.style.marginTop = '8px';
    btn.addEventListener('click', function () {
      chrome.tabs.reload(tabId);
      window.close();
    });
    parent.appendChild(btn);
  }

  /* Sayfa yükleme mesajı  */
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'pageLoaded' && request.url && request.url.includes('techolay.net')) {
      showStatus('Techolay sayfası hazır', 'success');
      sendResponse({ status: 'received' });
    }
    return false;
  });
});