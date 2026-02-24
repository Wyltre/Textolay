chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'correctSelectedText',
    title: 'AI ile Düzelt',
    contexts: ['selection'],
    documentUrlPatterns: ['https://techolay.net/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'correctSelectedText') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'correctSelectedText',
      text: info.selectionText
    });
  }
});

/* Keyboard shortcut komutu */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'correct-text') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('techolay.net')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'correctText' });
      }
    });
  }
});

/* API çağrısı */
async function callGeminiAPI(text, apiKey, _retried = false) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
  const cleanText = text.replace(/<[^>]*>/g, '');

  const prompt = `Türkçe metni düzelt. Sadece yazım/dilbilgisi hatalarını gider. Yapıyı, emojileri, URL'leri, kod bloklarını değiştirme. Açıklama ekleme, sadece düzeltilmiş metni döndür.

Metin:
"""
${cleanText}
"""`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    const errMsg = err.error?.message || '';

    /* Rate limit otomatik yeniden dene */
    if (response.status === 429 && !_retried) {
      const match = errMsg.match(/retry in ([\d.]+)s/i);
      const waitSec = match ? Math.ceil(parseFloat(match[1])) : 30;
      console.warn(`Textolay: Kota aşıldı, ${waitSec}s sonra tekrar denenecek…`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      return callGeminiAPI(text, apiKey, true);
    }

    /* Rate limit hatası  */
    if (response.status === 429) {
      throw new Error('API kota sınırına ulaşıldı. Lütfen biraz bekleyip tekrar deneyin.');
    }

    throw new Error(errMsg || `API hatası: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.candidates?.[0]?.content?.parts?.[0]) {
    throw new Error('API yanıtı geçersiz format içeriyor');
  }

  return data.candidates[0].content.parts[0].text
    .replace(/^"""\s*/g, '')
    .replace(/\s*"""$/g, '');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageLoaded') {
    sendResponse({ status: 'received' });
    return false;
  }

  if (message.action === 'callGeminiAPI') {
    if (!message.text || !message.apiKey) {
      sendResponse({ status: 'error', error: 'Metin veya API anahtarı eksik' });
      return false;
    }
    callGeminiAPI(message.text, message.apiKey)
      .then(result => {
        sendResponse({ status: 'success', correctedText: result });
      })
      .catch(err => {
        console.error('Textolay API hatası:', err);
        sendResponse({ status: 'error', error: err.message || 'Bilinmeyen hata' });
      });
    return true;
  }

  return false;
});