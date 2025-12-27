# 日记工具 - 跨设备访问实现部署指南

## 一、项目结构

```
diary_tool/
├── index.html          # 主页面结构
├── style.css           # 样式文件
├── script.js           # 前端JavaScript逻辑
├── server.js           # 后端Express服务器
├── config/
│   └── db.js           # 数据库连接配置
├── models/
│   ├── User.js         # 用户模型
│   └── Diary.js        # 日记模型
├── routes/
│   ├── auth.js         # 认证路由
│   └── diaries.js      # 日记路由
├── package.json        # 项目依赖
├── .env                # 环境变量配置
├── .gitignore          # Git忽略文件
└── DEPLOYMENT_GUIDE.md # 本部署指南
```

## 二、本地开发和测试

### 1. 安装依赖

```bash
# 进入项目目录
cd diary_tool

# 安装npm依赖
npm install
```

### 2. 配置MongoDB

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 创建免费账户
2. 创建新的集群（Cluster）
3. 配置数据库用户和网络访问权限（允许所有IP访问）
4. 获取连接字符串
5. 更新 `.env` 文件中的 `MONGO_URI`：

```env
MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster0.mongodb.net/diary-app?retryWrites=true&w=majority
```

### 3. 配置JWT密钥

在 `.env` 文件中设置强随机的JWT密钥：

```env
JWT_SECRET=your_strong_jwt_secret_key_here
```

### 4. 启动开发服务器

```bash
# 启动后端服务器（默认端口5000）
npm run dev

# 或者使用node直接运行
node server.js
```

### 5. 访问应用

打开浏览器访问：`http://localhost:5000`

## 三、部署到云端

### 方案一：使用Vercel部署（推荐）

1. **准备工作**：
   - 确保项目已经初始化Git仓库
   - 推送到GitHub/GitLab仓库

2. **部署步骤**：
   - 访问 [Vercel官网](https://vercel.com/)
   - 使用GitHub账户登录
   - 导入你的项目仓库
   - 配置项目：
     - 构建命令：`npm install && npm run build`（无需修改）
     - 输出目录：无需修改
     - 环境变量：添加 `.env` 文件中的所有变量
   - 点击部署

3. **配置MongoDB Atlas**：
   - 在MongoDB Atlas中允许Vercel服务器的IP访问

### 方案二：使用Heroku部署

1. **安装Heroku CLI**：
   - 下载并安装 [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. **登录Heroku**：
   ```bash
   heroku login
   ```

3. **创建Heroku应用**：
   ```bash
   heroku create your-diary-app-name
   ```

4. **设置环境变量**：
   ```bash
   heroku config:set MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/diary-app?retryWrites=true&w=majority
   heroku config:set JWT_SECRET=your_jwt_secret_key_here
   ```

5. **部署代码**：
   ```bash
   git push heroku master
   ```

6. **打开应用**：
   ```bash
   heroku open
   ```

## 四、功能测试

### 1. 用户认证功能
- 注册新用户
- 登录已有用户
- 测试错误处理（空字段、无效用户名/密码）

### 2. 日记功能
- 创建新日记
- 查看日记列表
- 点击日记查看详情
- 测试跨设备访问：
  - 在设备A登录并创建日记
  - 在设备B登录同一账号，验证日记同步

## 五、注意事项

1. **安全性**：
   - 不要将 `.env` 文件提交到版本控制系统
   - 定期更新JWT密钥
   - 使用HTTPS协议部署生产环境

2. **性能优化**：
   - 考虑添加日记列表分页
   - 实现客户端缓存减少API请求

3. **数据备份**：
   - 定期备份MongoDB Atlas数据
   - 考虑实现数据导出功能

## 六、常见问题排查

### 1. 服务器无法启动
- 检查Node.js版本是否兼容（建议使用v16+）
- 检查端口是否被占用
- 查看控制台错误信息

### 2. 数据库连接失败
- 确认MongoDB Atlas连接字符串正确
- 检查网络访问权限设置
- 确认数据库用户密码正确

### 3. 认证失败
- 检查JWT密钥是否一致
- 确认用户名和密码正确
- 检查token是否过期

### 4. 跨域问题
- 确认CORS中间件已正确配置
- 检查API请求头中的token是否正确设置

## 七、技术支持

如果遇到问题，可以：
1. 查看控制台错误信息
2. 检查MongoDB Atlas日志
3. 检查服务器日志
4. 参考相关技术文档：
   - [Express.js](https://expressjs.com/)
   - [MongoDB Atlas](https://docs.mongodb.com/atlas/)
   - [Mongoose](https://mongoosejs.com/docs/)
   - [JWT](https://jwt.io/introduction/)

---

通过以上步骤，你已经成功实现了跨设备访问的日记工具！现在用户可以在任何设备上登录并访问他们的日记内容。