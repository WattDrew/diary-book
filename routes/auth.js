const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ msg: '请填写所有字段' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: '用户名已存在' });
    }
    
    // 创建新用户
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      username,
      password: hashedPassword
    });
    
    const savedUser = await newUser.save();
    
    // 生成JWT
    const token = jwt.sign({
      id: savedUser._id
    }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ msg: '请填写所有字段' });
    }
    
    // 检查用户是否存在
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: '用户名或密码错误' });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '用户名或密码错误' });
    }
    
    // 生成JWT
    const token = jwt.sign({
      id: user._id
    }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;