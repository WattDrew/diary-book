# 日记工具跨设备访问实现方案

## 技术方案概述
要实现跨设备访问，需要将当前的纯前端应用升级为前后端分离架构：

- **前端**：保持现有HTML/CSS/JS结构，修改数据存储逻辑
- **后端**：使用Node.js + Express.js构建API服务
- **数据库**：MongoDB Atlas（云端数据库）
- **认证**：JWT（JSON Web Token）
- **部署**：前端GitHub Pages，后端Vercel/Heroku等

## 实现步骤

### 1. 后端实现

#### 项目结构
```
diary_tool_backend/
├── config/
│   └── db.js              # 数据库连接配置
├── models/
│   ├── User.js            # 用户模型
│   └── Diary.js           # 日记模型
├── routes/
│   ├── auth.js            # 认证路由
│   └── diaries.js         # 日记路由
├── middleware/
│   └── auth.js            # 认证中间件
├── .env                   # 环境变量
├── server.js              # 服务器入口
└── package.json           # 项目配置
```

#### 核心文件内容

**package.json**
```json
{
  "name": "diary-tool-backend",
  "version": "1.0.0",
  "description": "日记工具后端API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

**server.js**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(express.json());
app.use(cors());

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diaries', require('./routes/diaries'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

**config/db.js**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**models/User.js**
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请输入用户名'],
    unique: true
  },
  password: {
    type: String,
    required: [true, '请输入密码']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
```

**models/Diary.js**
```javascript
const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '请输入日记内容']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Diary', DiarySchema);
```

**middleware/auth.js**
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 获取token
  const token = req.header('x-auth-token');

  // 检查是否有token
  if (!token) {
    return res.status(401).json({ msg: '没有权限访问' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token无效' });
  }
};
```

**routes/auth.js**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 检查用户是否已存在
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: '用户已存在' });
    }

    // 创建新用户
    user = new User({ username, password });

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 保存用户
    await user.save();

    // 返回JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   POST api/auth/login
// @desc    用户登录
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 检查用户是否存在
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '用户名或密码错误' });
    }

    // 返回JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;
```

**routes/diaries.js**
```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Diary = require('../models/Diary');

// @route   GET api/diaries
// @desc    获取所有日记
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const diaries = await Diary.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(diaries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   POST api/diaries
// @desc    创建新日记
// @access  Private
router.post('/', auth, async (req, res) => {
  const { content } = req.body;

  try {
    const newDiary = new Diary({
      content,
      user: req.user.id
    });

    const diary = await newDiary.save();
    res.json(diary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;
```

**环境变量 .env**
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/diary-tool?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 2. 前端修改

**修改 script.js**
```javascript
// 从localStorage改为从API获取数据
let diaries = [];
let token = localStorage.getItem('token');
const API_URL = 'https://your-backend-api.com/api';

// 认证相关元素
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');

// 初始化页面
checkAuth();

// 检查认证状态
function checkAuth() {
  if (token) {
    // 已登录，获取日记列表
    fetchDiaries();
    showLogoutBtn();
  } else {
    // 未登录，显示登录模态框
    showAuthModal();
  }
}

// 获取日记列表
async function fetchDiaries() {
  try {
    const response = await fetch(`${API_URL}/diaries`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      diaries = await response.json();
      renderDiaryList();
    } else {
      // Token无效，清除并重新登录
      localStorage.removeItem('token');
      token = null;
      showAuthModal();
    }
  } catch (error) {
    console.error('获取日记失败:', error);
  }
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
        'x-auth-token': token
      },
      body: JSON.stringify({ content })
    });
    
    if (response.ok) {
      const newDiary = await response.json();
      diaries.unshift(newDiary);
      renderDiaryList();
      diaryInput.value = '';
      diaryInput.focus();
    }
  } catch (error) {
    console.error('发送日记失败:', error);
  }
}

// 用户登录
async function login(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      token = data.token;
      localStorage.setItem('token', token);
      authModal.style.display = 'none';
      fetchDiaries();
      showLogoutBtn();
    } else {
      alert('登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
}

// 用户注册
async function register(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      token = data.token;
      localStorage.setItem('token', token);
      authModal.style.display = 'none';
      fetchDiaries();
      showLogoutBtn();
    } else {
      alert('注册失败');
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
}

// 其他函数保持不变...
```

**修改 index.html**
```html
<!-- 添加认证模态框 -->
<div id="authModal" class="auth-modal">
  <div class="modal-content">
    <div class="modal-tabs">
      <button class="tab-btn active" onclick="showTab('login')">登录</button>
      <button class="tab-btn" onclick="showTab('register')">注册</button>
    </div>
    
    <form id="loginForm" onsubmit="login(event)">
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="loginUsername" required>
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="loginPassword" required>
      </div>
      <button type="submit">登录</button>
    </form>
    
    <form id="registerForm" onsubmit="register(event)" style="display: none;">
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="registerUsername" required>
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="registerPassword" required>
      </div>
      <button type="submit">注册</button>
    </form>
  </div>
</div>

<!-- 添加登出按钮 -->
<button id="logoutBtn" onclick="logout()" style="display: none;">登出</button>
```

**修改 style.css**
```css
/* 认证模态框样式 */
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal-tabs {
  display: flex;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background-color: #f0f0f0;
  cursor: pointer;
}

.tab-btn.active {
  background-color: #4CAF50;
  color: white;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

### 3. 部署方案

#### 后端部署
1. **MongoDB Atlas配置**
   - 注册MongoDB Atlas账号
   - 创建集群和数据库
   - 获取连接字符串

2. **后端部署到Vercel**
   - 登录Vercel
   - 导入GitHub仓库
   - 配置环境变量（MONGO_URI, JWT_SECRET）
   - 部署完成后获取API地址

#### 前端部署
1. 更新前端代码中的API_URL为后端实际地址
2. 提交代码到GitHub
3. GitHub Pages自动部署

## 注意事项

1. **安全性**：
   - 不要在前端代码中暴露JWT_SECRET
   - 使用HTTPS确保数据传输安全
   - 实现适当的错误处理

2. **性能**：
   - 实现数据缓存，减少API请求
   - 使用分页加载大量日记

3. **用户体验**：
   - 添加加载状态提示
   - 实现离线模式支持
   - 添加数据同步提示

## 替代方案

如果不想搭建完整的后端，也可以使用第三方BaaS服务：

1. **Firebase**：提供认证、数据库、存储等一体化服务
2. **Supabase**：开源的Firebase替代方案
3. **Appwrite**：端到端的后端服务

这些服务提供了更简单的集成方式，无需编写完整的后端代码。