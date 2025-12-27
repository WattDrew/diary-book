// 日记数据存储
let diaries = JSON.parse(localStorage.getItem('diaries')) || [];

// DOM元素
const diaryInput = document.getElementById('diaryInput');
const sendBtn = document.getElementById('sendBtn');
const diaryList = document.getElementById('diaryList');
const detailSidebar = document.getElementById('detailSidebar');
const closeDetail = document.getElementById('closeDetail');
const detailDate = document.getElementById('detailDate');
const detailContent = document.getElementById('detailContent');

// 初始化页面
renderDiaryList();

// 发送日记
function sendDiary() {
    const content = diaryInput.value.trim();
    if (content === '') return;
    
    const diary = {
        id: Date.now(),
        content: content,
        timestamp: new Date()
    };
    
    diaries.unshift(diary); // 新日记添加到最前面
    saveDiaries();
    renderDiaryList();
    diaryInput.value = '';
    diaryInput.focus();
}

// 保存日记到localStorage
function saveDiaries() {
    localStorage.setItem('diaries', JSON.stringify(diaries));
}

// 渲染日记列表
function renderDiaryList() {
    diaryList.innerHTML = '';
    
    if (diaries.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-message';
        emptyMsg.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                <p>还没有日记，快来写第一篇吧！</p>
            </div>
        `;
        diaryList.appendChild(emptyMsg);
        return;
    }
    
    diaries.forEach(diary => {
        const diaryItem = document.createElement('div');
        diaryItem.className = 'diary-item';
        diaryItem.dataset.id = diary.id;
        
        const time = formatTime(diary.timestamp);
        
        diaryItem.innerHTML = `
            <div class="diary-item-time">${time}</div>
            <div class="diary-item-content">${escapeHtml(diary.content)}</div>
        `;
        
        diaryItem.addEventListener('click', () => showDetail(diary));
        diaryList.appendChild(diaryItem);
    });
}

// 显示日记详情
function showDetail(diary) {
    detailDate.textContent = formatDetailTime(diary.timestamp);
    detailContent.textContent = diary.content;
    detailSidebar.classList.add('active');
}

// 关闭详情侧边栏
function closeDetailSidebar() {
    detailSidebar.classList.remove('active');
}

// 格式化显示时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 今天的日记显示时间
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天的日记
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 今年的日记显示月日
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    
    // 其他年份显示完整日期
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// 格式化详情页时间
function formatDetailTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
    });
}

// HTML转义防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 事件监听
sendBtn.addEventListener('click', sendDiary);

// 回车键发送（Shift+Enter换行）
diaryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendDiary();
    }
});

// 输入框自动高度调整
diaryInput.addEventListener('input', () => {
    diaryInput.style.height = 'auto';
    diaryInput.style.height = Math.min(diaryInput.scrollHeight, 200) + 'px';
});

// 初始化输入框高度
diaryInput.style.height = 'auto';
diaryInput.style.height = Math.min(diaryInput.scrollHeight, 200) + 'px';

closeDetail.addEventListener('click', closeDetailSidebar);

// 点击侧边栏外部关闭
window.addEventListener('click', (e) => {
    if (e.target === detailSidebar) {
        closeDetailSidebar();
    }
});

// ESC键关闭侧边栏
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDetailSidebar();
    }
});