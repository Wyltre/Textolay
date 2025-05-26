document.addEventListener('DOMContentLoaded', function() {
    let pageStatus = {
    loaded: false,
    url: '',
    isTecholay: false
  };
  
    chrome.storage.sync.get('geminiApiKey', function(data) {
    if (data.geminiApiKey) {
      document.getElementById('api-key').value = data.geminiApiKey;
      showStatusMessage('API anahtarı yüklendi', 'success');
    }
  });

    document.getElementById('save-api-key').addEventListener('click', function() {
    const apiKey = document.getElementById('api-key').value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ 'geminiApiKey': apiKey }, function() {
        showStatusMessage('API anahtarı kaydedildi', 'success');
        setTimeout(() => {
          clearStatusMessage();
        }, 3000);       });
    } else {
      showStatusMessage('Lütfen geçerli bir API anahtarı girin', 'error');
    }
  });

    function showStatusMessage(message, type = '') {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    
        statusElement.classList.remove('success', 'error', 'warning');
    
        if (type) {
      statusElement.classList.add(type);
    }
  }
  
    function clearStatusMessage() {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = '';
    statusElement.classList.remove('success', 'error', 'warning');
  }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      pageStatus.url = url;
      
            if (url.includes('techolay.net')) {
        pageStatus.isTecholay = true;
        
                try {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'checkPageLoaded' }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Bağlantı hatası:', chrome.runtime.lastError);
                            showStatusMessage('Sayfa ile bağlantı kurulmadı, sayfayı yenileyin', 'warning');
              
                            const refreshButton = document.createElement('button');
              refreshButton.textContent = 'Sayfayı Yenile';
              refreshButton.className = 'action-button';
              refreshButton.style.marginTop = '10px';
              refreshButton.addEventListener('click', function() {
                chrome.tabs.reload(tabs[0].id);
                window.close();               });
              
              const statusContainer = document.getElementById('status-message').parentElement;
              statusContainer.appendChild(refreshButton);
            } else if (response && response.loaded) {
              pageStatus.loaded = true;
              showStatusMessage('Techolay sayfası hazır', 'success');
            }
          });
        } catch (error) {
          console.error('Bağlantı hatası:', error);
          showStatusMessage('Sayfa ile bağlantı kurulamadı', 'error');
        }
      } else {
        showStatusMessage('Bu eklenti sadece Techolay forum sitesinde çalışır', 'warning');
        document.getElementById('correct-text').disabled = true;
      }
    }
  });

    document.getElementById('correct-text').addEventListener('click', function() {
    showStatusMessage('Metin düzeltiliyor...', 'warning');
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) {
        showStatusMessage('Aktif sekme bulunamadı', 'error');
        return;
      }
      
      try {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'correctText' }, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Düzeltme hatası:', chrome.runtime.lastError);
            showStatusMessage('Sayfa ile bağlantı kurulamadı. Sayfayı yenileyin.', 'error');
            
                        const refreshButton = document.createElement('button');
            refreshButton.textContent = 'Sayfayı Yenile';
            refreshButton.className = 'action-button';
            refreshButton.style.marginTop = '10px';
            refreshButton.addEventListener('click', function() {
              chrome.tabs.reload(tabs[0].id);
              window.close();             });
            
            const statusContainer = document.getElementById('status-message').parentElement;
            if (!statusContainer.querySelector('button')) {
              statusContainer.appendChild(refreshButton);
            }
            
            return;
          }
          
          if (response && response.status === 'success') {
            showStatusMessage('Metin düzeltildi!', 'success');
                        setTimeout(() => {
              clearStatusMessage();
            }, 3000);
          } else {
            showStatusMessage('Hata: ' + (response && response.error ? response.error : 'Editör alanı bulunamadı'), 'error');
          }
        });
      } catch (error) {
        console.error('İşlem hatası:', error);
        showStatusMessage('İşlem sırasında bir hata oluştu', 'error');
      }
    });
  });
  
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'pageLoaded') {
      pageStatus.loaded = true;
      pageStatus.url = request.url;
      pageStatus.isTecholay = request.url.includes('techolay.net');
      
      if (pageStatus.isTecholay) {
        showStatusMessage('Techolay sayfası hazır', 'success');
      }
      
            sendResponse({ status: 'received' });
    }
    
    return true;
  });
}); 