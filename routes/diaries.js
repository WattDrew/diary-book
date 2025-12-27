const express = require('express');
const jwt = require('jsonwebtoken');
const Diary = require('../models/Diary');
const router = express.Router();

// 中间件：验证JWT
const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ msg: '无权限访问' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ msg: '无效的令牌' });
  }
};

// 获取用户的所有日记
router.get('/', auth, async (req, res) => {
  try {
    const diaries = await Diary.find({ user: req.user }).sort({ createdAt: -1 });
    res.json(diaries);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 创建新日记
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ msg: '请输入日记内容' });
    }
    
    const newDiary = new Diary({
      user: req.user,
      content
    });
    
    const savedDiary = await newDiary.save();
    res.json(savedDiary);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 获取单个日记详情
router.get('/:id', auth, async (req, res) => {
  try {
    const diary = await Diary.findOne({ _id: req.params.id, user: req.user });
    
    if (!diary) {
      return res.status(404).json({ msg: '日记不存在' });
    }
    
    res.json(diary);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 更新日记
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ msg: '请输入日记内容' });
    }
    
    let diary = await Diary.findOne({ _id: req.params.id, user: req.user });
    
    if (!diary) {
      return res.status(404).json({ msg: '日记不存在' });
    }
    
    diary.content = content;
    await diary.save();
    
    res.json(diary);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 删除日记
router.delete('/:id', auth, async (req, res) => {
  try {
    const diary = await Diary.findOne({ _id: req.params.id, user: req.user });
    
    if (!diary) {
      return res.status(404).json({ msg: '日记不存在' });
    }
    
    await diary.deleteOne();
    res.json({ msg: '日记已删除' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;