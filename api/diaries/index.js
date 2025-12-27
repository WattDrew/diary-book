const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const diarySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Diary = mongoose.model('Diary', diarySchema);

const auth = async (req, res, next) => {
    try {
        const jwt = require('jsonwebtoken');
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: '无权限访问' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ msg: '无效令牌' });
    }
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        try {
            await auth(req, res, () => {});
            const diaries = await Diary.find({ user: req.user }).sort({ createdAt: -1 });
            res.json(diaries);
        } catch (err) {
            res.status(500).json({ msg: '服务器错误' });
        }
    } else if (req.method === 'POST') {
        try {
            await auth(req, res, () => {});
            const newDiary = new Diary({
                user: req.user,
                content: req.body.content
            });
            const diary = await newDiary.save();
            res.json(diary);
        } catch (err) {
            res.status(500).json({ msg: '服务器错误' });
        }
    } else {
        res.status(405).json({ msg: 'Method not allowed' });
    }
};
