// Lấy nội dung từ trang web
function extractContent() {
  console.log('Đang tìm nội dung từ trang web...');
  
  let title = '';
  let description = '';
  let source = '';
  
  // Xác định nguồn trang web
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('vnexpress.net')) {
    source = 'vnexpress';
    // Selector cho VnExpress
    const titleSelectors = [
      'h1.title-detail',
      'h1.title-news',
      'h1',
      '.title-detail',
      '.title-news',
      'header h1',
      '.breadcrumb__list h1'
    ];
    
    const descriptionSelectors = [
      'p.description',
      '.description',
      '.lead',
      '.summary',
      'h2.sapo',
      '.sapo'
    ];
    
    // Tìm tiêu đề
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('VnExpress - Tìm thấy tiêu đề với selector:', selector);
        break;
      }
    }
    
    // Tìm mô tả
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        description = element.textContent.trim();
        console.log('VnExpress - Tìm thấy mô tả với selector:', selector);
        break;
      }
    }
    
  } else if (currentUrl.includes('tienphong.vn')) {
    source = 'tienphong';
    // Selector cho Tiền Phong
    const titleSelectors = [
      'h1.article__title',
      'h1.cms-title',
      '.article__title',
      'h1',
      '.detail__title'
    ];
    
    const descriptionSelectors = [
      'div.article__sapo',
      '.article__sapo p',
      '.cms-desc',
      '.detail__sapo',
      '.sapo'
    ];
    
    // Tìm tiêu đề
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('Tiền Phong - Tìm thấy tiêu đề với selector:', selector);
        break;
      }
    }
    
    // Tìm mô tả
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Lấy text từ thẻ p bên trong hoặc từ chính element
        const pElement = element.querySelector('p');
        if (pElement && pElement.textContent.trim()) {
          description = pElement.textContent.trim();
        } else if (element.textContent.trim()) {
          description = element.textContent.trim();
        }
        
        if (description) {
          console.log('Tiền Phong - Tìm thấy mô tả với selector:', selector);
          break;
        }
      }
    }
    
  } else if (currentUrl.includes('tuoitre.vn')) {
    source = 'tuoitre';
    // Selector cho Tuổi Trẻ
    const titleSelectors = [
      'h1.detail-title',
      'h1.article-title',
      '.detail-title',
      '.article-title',
      'h1[data-role="title"]',
      'h1'
    ];
    
    const descriptionSelectors = [
      'h2.detail-sapo',
      '.detail-sapo',
      'h2[data-role="sapo"]',
      '.sapo',
      '.detail__sapo'
    ];
    
    // Tìm tiêu đề
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('Tuổi Trẻ - Tìm thấy tiêu đề với selector:', selector);
        break;
      }
    }
    
    // Tìm mô tả
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        description = element.textContent.trim();
        console.log('Tuổi Trẻ - Tìm thấy mô tả với selector:', selector);
        break;
      }
    }
  }
  
  console.log('Nguồn:', source);
  console.log('Tiêu đề:', title);
  console.log('Mô tả:', description);
  
  // Lưu vào chrome storage
  chrome.storage.local.set({
    newsContent: {
      title: title,
      description: description,
      url: window.location.href,
      source: source,
      timestamp: new Date().toISOString()
    }
  }, function() {
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
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "refreshContent") {
    console.log('Nhận yêu cầu làm mới nội dung');
    extractContent();
    sendResponse({status: "refreshed"});
  }
  
  if (request.action === "getContent") {
    extractContent();
    setTimeout(() => {
      chrome.storage.local.get(['newsContent'], function(result) {
        sendResponse(result.newsContent);
      });
    }, 100);
    return true; // Giữ kết nối mở cho sendResponse
  }
});