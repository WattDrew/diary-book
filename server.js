const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/test', (req, res) => {
    res.json({ msg: 'API working', status: 'success' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/diaries', require('./routes/diaries'));

app.use(express.static('.'));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
    });
}

module.exports = app;