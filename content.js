// Lấy nội dung từ trang VnExpress
function extractContent() {
  console.log('Đang tìm nội dung từ VnExpress...');

  let title = '';
  let description = '';

  // Tìm tiêu đề
  const titleElement = document.querySelector('h1.title-detail');
  if (titleElement && titleElement.textContent.trim()) {
    title = titleElement.textContent.trim();
  }

  // Tìm mô tả
  const descriptionElement = document.querySelector('p.description');
  if (descriptionElement && descriptionElement.textContent.trim()) {
    description = descriptionElement.textContent.trim();
  }

  console.log('Tiêu đề:', title);
  console.log('Mô tả:', description);

  // Lưu vào chrome storage
  chrome.storage.local.set({
    vnexpressContent: {
      title: title,
      description: description,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
  }, function () {
    console.log('Đã lưu nội dung vào storage');
  });
}

// Chờ trang load xong
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', extractContent);
} else {
  extractContent();
}

// Theo dõi thay đổi DOM (phòng trường hợp nội dung load sau)
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (!mutation.addedNodes) return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      const node = mutation.addedNodes[i];
      // Nếu có thêm node mới, thử extract lại
      if (node.nodeType === 1) { // Element node
        extractContent();
        break;
      }
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Lắng nghe message từ popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "refreshContent") {
    console.log('Nhận yêu cầu làm mới nội dung');
    extractContent();
    sendResponse({ status: "refreshed" });
  }

  if (request.action === "getContent") {
    extractContent();
    setTimeout(() => {
      chrome.storage.local.get(['vnexpressContent'], function (result) {
        sendResponse(result.vnexpressContent);
      });
    }, 100);
    return true; // Giữ kết nối mở cho sendResponse
  }
});