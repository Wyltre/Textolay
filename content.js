(function () {
  let lastCorrectedText = null;
  let originalTextBeforeCorrection = null;
  let cachedApiKey = null;

  chrome.storage.sync.get('geminiApiKey', function (data) {
    if (data.geminiApiKey) cachedApiKey = data.geminiApiKey;
  });
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.geminiApiKey) cachedApiKey = changes.geminiApiKey.newValue;
  });

  /* DOM elementlerinde olay tetikleme */
  function dispatchEvents(element, eventNames) {
    eventNames.forEach(name => {
      element.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
    });
  }

  /* Metin -> HTML dönüşümü */
  function convertTextToHtml(text) {
    if (!text || text.trim() === '') return '<p></p>';
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map(p => {
      if (!p.trim()) return '';
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  /* Editör bulma */
  function findEditorElement() {
    const selectors = [
      '.fr-element.fr-view',
      'div[contenteditable="true"].fr-element',
      'textarea.input.js-editor[data-xf-init="editor"]',
      '.fr-box textarea',
      '.fr-box .fr-element',
      '.message-editorWrapper textarea',
      '[contenteditable="true"]',
      'textarea.input'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getEditorText(editor) {
    if (!editor) return '';
    return editor.tagName === 'TEXTAREA' ? editor.value : (editor.innerText || editor.textContent);
  }

  function getFroalaInstance() {
    try {
      if (typeof FroalaEditor !== 'undefined' && FroalaEditor.INSTANCES && FroalaEditor.INSTANCES.length > 0)
        return FroalaEditor.INSTANCES[0];
      if (typeof XF !== 'undefined' && XF.FroalaEditor && XF.FroalaEditor.INSTANCES && XF.FroalaEditor.INSTANCES.length > 0)
        return XF.FroalaEditor.INSTANCES[0];
      if (typeof $ !== 'undefined' && $.FroalaEditor && $.FroalaEditor.INSTANCES && $.FroalaEditor.INSTANCES.length > 0)
        return $.FroalaEditor.INSTANCES[0];
    } catch (e) { }
    return null;
  }

  /* Editör güncelleme */
  function updateEditorContent(editor, text) {
    if (!editor) return;
    const htmlContent = convertTextToHtml(text);

    const froala = getFroalaInstance();
    if (froala && froala.html && typeof froala.html.set === 'function') {
      froala.html.set(htmlContent);
      if (froala.undo && typeof froala.undo.saveStep === 'function') froala.undo.saveStep();
      if (froala.events && typeof froala.events.trigger === 'function') {
        froala.events.trigger('contentChanged');
        froala.events.trigger('input');
      }
    }

    if (editor.tagName === 'TEXTAREA') {
      editor.value = text;
      dispatchEvents(editor, ['input', 'change', 'keyup']);
    } else {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      editor.replaceChildren(...doc.body.childNodes);
      dispatchEvents(editor, ['input', 'change']);
    }

    updateAllTextareas(text);
    updateDraftStorage(text);
  }

  function updateAllTextareas(text) {
    document.querySelectorAll('textarea[name="message"], textarea.js-editor').forEach(ta => {
      ta.value = text;
      dispatchEvents(ta, ['input', 'change']);
    });
  }

  function updateDraftStorage(text) {
    try {
      if (typeof localStorage === 'undefined') return;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('draft') || key.includes('editor'))) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.message) {
              data.message = text;
              localStorage.setItem(key, JSON.stringify(data));
            }
          } catch (e) { }
        }
      }
    } catch (e) { }
  }

  /* API çağrısı */
  function sendToGeminiAPI(text, apiKey) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          { action: 'callGeminiAPI', text: text, apiKey: apiKey },
          function (response) {
            if (chrome.runtime.lastError) {
              reject(new Error('Eklenti bağlantısı kopuk: ' + chrome.runtime.lastError.message + ' — Sayfayı yenileyin'));
              return;
            }
            if (!response) {
              reject(new Error('Background worker yanıt vermedi — Eklentiyi yeniden yükleyin'));
              return;
            }
            if (response.status === 'success') {
              resolve(response.correctedText);
            } else {
              reject(new Error(response.error || 'API yanıt hatası'));
            }
          }
        );
      } catch (e) {
        reject(new Error('Eklenti bağlantısı kurulamadı — Sayfayı yenileyin'));
      }
    });
  }

  /* Bildirim sistemi */
  function removeNotifications() {
    document.querySelectorAll('.textolay-notification').forEach(n => n.remove());
  }

  function showNotification(message, type, options = {}) {
    removeNotifications();
    const el = document.createElement('div');
    el.className = `textolay-notification ${type}`;

    const colors = { success: '#10b981', error: '#ef4444', info: '#4f46e5', warning: '#f59e0b' };
    Object.assign(el.style, {
      padding: '12px 16px', position: 'fixed', bottom: '24px', right: '24px',
      zIndex: '99999', borderRadius: '10px', color: 'white', fontSize: '14px',
      fontWeight: '500', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center',
      gap: '10px', maxWidth: '360px', opacity: '0', transform: 'translateY(10px)',
      transition: 'opacity 0.3s, transform 0.3s',
      backgroundColor: colors[type] || colors.info
    });

    if (options.spinner) {
      const spin = document.createElement('span');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83');
      svg.appendChild(path); spin.appendChild(svg);
      spin.style.animation = 'textolay-spin 1s linear infinite';
      spin.style.display = 'flex';
      el.appendChild(spin);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    textSpan.style.flex = '1';
    el.appendChild(textSpan);

    if (options.undoCallback) {
      const undoBtn = document.createElement('button');
      undoBtn.textContent = 'Geri Al';
      Object.assign(undoBtn.style, {
        background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)',
        color: 'white', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontWeight: '600', transition: 'background 0.2s'
      });
      undoBtn.addEventListener('click', () => { options.undoCallback(); el.remove(); });
      undoBtn.addEventListener('mouseover', () => { undoBtn.style.background = 'rgba(255,255,255,0.4)'; });
      undoBtn.addEventListener('mouseout', () => { undoBtn.style.background = 'rgba(255,255,255,0.25)'; });
      el.appendChild(undoBtn);
    }

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, { cursor: 'pointer', opacity: '0.7', fontSize: '12px' });
    closeBtn.addEventListener('click', () => el.remove());
    el.appendChild(closeBtn);

    if (!document.getElementById('textolay-spin-style')) {
      const style = document.createElement('style');
      style.id = 'textolay-spin-style';
      style.textContent = '@keyframes textolay-spin { to { transform: rotate(360deg) } }';
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });

    if (!options.persistent) {
      const timeout = options.undoCallback ? 8000 : 4000;
      setTimeout(() => {
        if (document.body.contains(el)) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(10px)';
          setTimeout(() => el.remove(), 300);
        }
      }, timeout);
    }
  }

  /* Ana düzeltme fonksiyonu */
  async function correctText(editor) {
    const text = getEditorText(editor);
    if (!text || text.trim() === '') {
      showNotification('Düzeltilecek metin bulunamadı', 'error');
      return { status: 'error', error: 'Metin bulunamadı' };
    }

    if (!cachedApiKey) {
      const apiData = await new Promise(r => chrome.storage.sync.get('geminiApiKey', r));
      cachedApiKey = apiData.geminiApiKey;
    }
    if (!cachedApiKey) {
      showNotification('Lütfen önce Gemini API anahtarınızı girin', 'warning');
      return { status: 'error', error: 'API anahtarı bulunamadı' };
    }

    originalTextBeforeCorrection = text;
    showNotification('Metin düzeltiliyor...', 'info', { spinner: true, persistent: true });

    try {
      const corrected = await sendToGeminiAPI(text, cachedApiKey);
      if (!corrected || corrected.trim() === '') throw new Error('Düzeltilmiş metin boş döndü');

      lastCorrectedText = corrected;
      updateEditorContent(editor, corrected);

      chrome.storage.sync.get('correctionCount', function (data) {
        chrome.storage.sync.set({ correctionCount: (data.correctionCount || 0) + 1 });
      });

      showNotification('Metin düzeltildi!', 'success', {
        undoCallback: () => {
          if (originalTextBeforeCorrection) {
            updateEditorContent(editor, originalTextBeforeCorrection);
            lastCorrectedText = null;
            showNotification('Düzeltme geri alındı', 'info');
          }
        }
      });
      return { status: 'success' };
    } catch (error) {
      showNotification('Hata: ' + error.message, 'error');
      return { status: 'error', error: error.message };
    }
  }

  /* Seçili metin düzeltme */
  async function correctSelectedText(selectedText) {
    const editor = findEditorElement();
    if (!editor) {
      showNotification('Düzeltilecek bir metin alanı bulunamadı', 'error');
      return;
    }

    if (!cachedApiKey) {
      const apiData = await new Promise(r => chrome.storage.sync.get('geminiApiKey', r));
      cachedApiKey = apiData.geminiApiKey;
    }
    if (!cachedApiKey) {
      showNotification('Lütfen önce Gemini API anahtarınızı girin', 'warning');
      return;
    }

    showNotification('Seçili metin düzeltiliyor...', 'info', { spinner: true, persistent: true });
    try {
      const corrected = await sendToGeminiAPI(selectedText, cachedApiKey);
      const currentText = getEditorText(editor);
      originalTextBeforeCorrection = currentText;
      const newText = currentText.replace(selectedText, corrected);
      updateEditorContent(editor, newText);

      showNotification('Seçili metin düzeltildi!', 'success', {
        undoCallback: () => {
          if (originalTextBeforeCorrection) {
            updateEditorContent(editor, originalTextBeforeCorrection);
            showNotification('Düzeltme geri alındı', 'info');
          }
        }
      });
    } catch (error) {
      showNotification('Hata: ' + error.message, 'error');
    }
  }

  /* Düzelt butonu değiştirir */
  function replaceCorrectionButtons() {
    document.querySelectorAll('button[data-xf-init="duzelt"]').forEach(button => {
      if (button.dataset.textolayBound) return;
      button.dataset.textolayBound = 'true';

      const textEl = button.querySelector('.button-text');
      if (textEl) textEl.textContent = 'AI ile Düzelt';

      button.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const editor = findEditorElement();
        if (editor) {
          correctText(editor);
        } else {
          showNotification('Düzeltilebilecek bir metin alanı bulunamadı', 'error');
        }
      });
    });
  }

  replaceCorrectionButtons();

  const observer = new MutationObserver(() => replaceCorrectionButtons());
  observer.observe(document.body, { childList: true, subtree: true });

  /* Mesaj dinleyiciler */
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'correctText') {
      const editor = findEditorElement();
      if (!editor) {
        sendResponse({ status: 'error', error: 'Editör alanı bulunamadı' });
        return false;
      }
      correctText(editor).then(sendResponse);
      return true;

    } else if (request.action === 'correctSelectedText') {
      if (request.text) correctSelectedText(request.text);
      return false;

    } else if (request.action === 'checkPageLoaded') {
      sendResponse({ loaded: true });
      return false;
    }
  });

  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href
  });
})();