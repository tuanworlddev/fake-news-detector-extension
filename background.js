// Background script cho extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "contentUpdated") {
    // Có thể thêm xử lý ở đây nếu cần
    console.log('Content updated from:', sender.tab.url);
  }
});

// Lắng nghe khi tab được cập nhật
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url.includes('vnexpress.net')) {
    // Tab đã load xong, có thể inject content script nếu cần
  }
});