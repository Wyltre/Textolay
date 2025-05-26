// Background script - service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Textolay eklentisi yüklendi');
  

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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageLoaded') {
    console.log('Sayfa yüklendi:', message.url);
    sendResponse({ status: 'received' });
  }
  return true;
}); 