document.addEventListener('DOMContentLoaded', function() {
  const titleElement = document.getElementById('title');
  const descriptionElement = document.getElementById('description');
  const urlElement = document.getElementById('url');
  const noContentElement = document.getElementById('noContent');
  const articleContentElement = document.getElementById('articleContent');
  const refreshBtn = document.getElementById('refreshBtn');
  const loadingSection = document.getElementById('loadingSection');
  const resultSection = document.getElementById('resultSection');
  const errorSection = document.getElementById('errorSection');
  const predictionElement = document.getElementById('prediction');
  const confidenceElement = document.getElementById('confidence');
  const pieChartElement = document.getElementById('pieChart');
  const centerPercentElement = document.getElementById('centerPercent');

  // Lấy nội dung từ storage
  function loadContent() {
    chrome.storage.local.get(['newsContent'], function(result) {
      console.log('Dữ liệu từ storage:', result);
      
      if (result.newsContent && result.newsContent.title) {
        // Hiển thị nội dung
        titleElement.textContent = result.newsContent.title;
        descriptionElement.textContent = result.newsContent.description || 'Không có mô tả';
        urlElement.textContent = result.newsContent.url;
        
        // Hiển thị nguồn nếu có
        if (result.newsContent.source) {
          const sourceBadge = document.createElement('div');
          sourceBadge.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 5px;';
          sourceBadge.textContent = `Nguồn: ${result.newsContent.source.toUpperCase()}`;
          urlElement.parentNode.insertBefore(sourceBadge, urlElement);
        }
        
        noContentElement.style.display = 'none';
        articleContentElement.style.display = 'block';
        
        // Tự động phân tích khi có nội dung
        analyzeContent(result.newsContent.description || result.newsContent.title);
      } else {
        // Không có nội dung
        noContentElement.style.display = 'block';
        articleContentElement.style.display = 'none';
        
        // Thử lấy nội dung trực tiếp từ tab hiện tại
        getContentFromCurrentTab();
      }
    });
  }

  // Lấy nội dung trực tiếp từ tab hiện tại
  function getContentFromCurrentTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && (tabs[0].url.includes('vnexpress.net') || tabs[0].url.includes('tienphong.vn'))) {
        console.log('Đang lấy nội dung từ tab hiện tại:', tabs[0].url);
        
        chrome.tabs.sendMessage(tabs[0].id, {action: "getContent"}, function(response) {
          if (response && response.title) {
            // Hiển thị nội dung mới
            titleElement.textContent = response.title;
            descriptionElement.textContent = response.description || 'Không có mô tả';
            urlElement.textContent = response.url;
            
            // Hiển thị nguồn nếu có
            if (response.source) {
              const sourceBadge = document.createElement('div');
              sourceBadge.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 5px;';
              sourceBadge.textContent = `Nguồn: ${response.source.toUpperCase()}`;
              urlElement.parentNode.insertBefore(sourceBadge, urlElement);
            }
            
            noContentElement.style.display = 'none';
            articleContentElement.style.display = 'block';
            
            // Lưu vào storage
            chrome.storage.local.set({
              newsContent: response
            });
            
            // Phân tích nội dung
            analyzeContent(response.description || response.title);
          } else {
            console.log('Không thể lấy nội dung từ tab hiện tại');
          }
        });
      }
    });
  }

  // Phân tích nội dung với API
  async function analyzeContent(text) {
    if (!text || text === 'Không có mô tả') {
      showError('Không có nội dung để phân tích');
      return;
    }

    showLoading();
    hideResult();
    hideError();

    try {
      const response = await fetch('https://fakenews.omnituan.online/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Kết quả phân tích:', data);
      
      displayResult(data);
      
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      showError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      hideLoading();
    }
  }

  // Hiển thị kết quả
  function displayResult(data) {
    if (data.status !== 'success') {
      showError('Lỗi từ server: ' + (data.message || 'Unknown error'));
      return;
    }

    const isReal = data.prediction === 'real';
    const confidence = (data.confidence * 100).toFixed(1);
    const realProb = (data.probabilities.real * 100).toFixed(1);
    const fakeProb = (data.probabilities.fake * 100).toFixed(1);

    // Hiển thị kết quả dự đoán
    predictionElement.textContent = isReal ? 'REAL NEWS' : 'FAKE NEWS';
    predictionElement.className = `prediction ${isReal ? 'real' : 'fake'}`;
    
    confidenceElement.textContent = `Độ tin cậy: ${confidence}%`;

    // Vẽ biểu đồ tròn
    drawPieChart(realProb, fakeProb);
    
    showResult();
  }

  // Vẽ biểu đồ tròn bằng CSS
  function drawPieChart(realPercent, fakePercent) {
    // Thiết lập biến CSS cho biểu đồ
    pieChartElement.style.setProperty('--real-percent', realPercent + '%');
    
    // Hiển thị phần trăm ở trung tâm
    centerPercentElement.textContent = realPercent + '%';
  }

  // Hiển thị loading
  function showLoading() {
    loadingSection.style.display = 'block';
    refreshBtn.disabled = true;
  }

  // Ẩn loading
  function hideLoading() {
    loadingSection.style.display = 'none';
    refreshBtn.disabled = false;
  }

  // Hiển thị kết quả
  function showResult() {
    resultSection.style.display = 'block';
  }

  // Ẩn kết quả
  function hideResult() {
    resultSection.style.display = 'none';
  }

  // Hiển thị lỗi
  function showError(message) {
    errorSection.textContent = message;
    errorSection.style.display = 'block';
  }

  // Ẩn lỗi
  function hideError() {
    errorSection.style.display = 'none';
  }

  // Nút làm mới
  refreshBtn.addEventListener('click', function() {
    console.log('Người dùng click phân tích lại');
    const description = descriptionElement.textContent || titleElement.textContent;
    analyzeContent(description);
  });

  // Load nội dung khi mở popup
  loadContent();
});