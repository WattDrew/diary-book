// 应用状态
let isLoginMode = true;
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// 日记数据存储
let diaries = [];

// DOM元素
const diaryInput = document.getElementById('diaryInput');
const sendBtn = document.getElementById('sendBtn');
const diaryList = document.getElementById('diaryList');
const detailSidebar = document.getElementById('detailSidebar');
const closeDetail = document.getElementById('closeDetail');
const detailDate = document.getElementById('detailDate');
const detailContent = document.getElementById('detailContent');

// 认证DOM元素
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const username = document.getElementById('username');
const password = document.getElementById('password');
const authBtn = document.getElementById('authBtn');
const switchAuth = document.getElementById('switchAuth');
const logoutBtn = document.getElementById('logoutBtn');

// API基础URL
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://diary-tool.vercel.app/api';

// 初始化页面
if (token && currentUser) {
    fetchDiaries();
    authModal.classList.remove('active');
} else {
    setupAuthEventListeners();
}

// 发送日记
async function sendDiary() {
    const content = diaryInput.value.trim();
    if (content === '') return;
    
    try {
        const response = await fetch(`${API_URL}/diaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            const newDiary = await response.json();
            diaries.unshift(newDiary);
            renderDiaryList();
            diaryInput.value = '';
            diaryInput.focus();
        } else {
            const error = await response.json();
            alert(error.msg || '发送日记失败');
        }
    } catch (error) {
        console.error('发送日记错误:', error);
        alert('网络错误，请稍后重试');
    }
}

// 从API获取日记列表
async function fetchDiaries() {
    try {
        const response = await fetch(`${API_URL}/diaries`, {
            headers: {
                'x-auth-token': token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (response.ok) {
            diaries = await response.json();
            renderDiaryList();
        } else {
            // 认证失败，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            token = null;
            currentUser = null;
            authModal.classList.add('active');
            setupAuthEventListeners();
        }
    } catch (error) {
        console.error('获取日记错误:', error);
        alert('网络错误，请稍后重试');
    }
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
                <p>还没有日记，今天有遇到什么有趣的事吗！</p>
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
    detailDate.textContent = formatDetailTime(diary.createdAt);
    detailContent.textContent = diary.content;
    detailSidebar.classList.add('active');
}

// 设置认证事件监听器
function setupAuthEventListeners() {
    // 切换登录/注册模式
    switchAuth.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? '登录' : '注册';
        authBtn.textContent = isLoginMode ? '登录' : '注册';
        switchAuth.innerHTML = isLoginMode ? 
            '没有账号？点击注册' : 
            '已有账号？点击登录';
    });
    
    // 认证按钮点击
    authBtn.addEventListener('click', handleAuth);
    
    // 回车键认证
    username.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            password.focus();
        }
    });
    
    password.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    });
}

// 处理登录/注册
async function handleAuth() {
    const usernameValue = username.value.trim();
    const passwordValue = password.value.trim();
    
    if (!usernameValue || !passwordValue) {
        alert('请填写所有字段');
        return;
    }
    
    try {
        const endpoint = isLoginMode ? 'login' : 'register';
        const response = await fetch(`${API_URL}/auth/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({
                username: usernameValue,
                password: passwordValue
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            currentUser = data.user;
            
            // 保存到本地存储
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // 关闭认证模态框，加载日记
            authModal.classList.remove('active');
            fetchDiaries();
            setupAppEventListeners();
            
            // 清空表单
            username.value = '';
            password.value = '';
        } else {
            const error = await response.json();
            alert(error.msg || (isLoginMode ? '登录失败' : '注册失败'));
        }
    } catch (error) {
        console.error('认证错误:', error);
        alert('网络错误，请稍后重试');
    }
}

// 设置应用事件监听器
function setupAppEventListeners() {
    // 退出登录
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        token = null;
        currentUser = null;
        diaries = [];
        authModal.classList.add('active');
        setupAuthEventListeners();
    });
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

// 在setupAppEventListeners中添加应用事件监听器
function setupAppEventListeners() {
    // 发送日记按钮点击
    sendBtn.addEventListener('click', sendDiary);
    
    // 回车键发送（Shift+Enter换行）
    diaryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDiary();
        }
    });
}