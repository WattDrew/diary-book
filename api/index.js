const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(indexContent);
};
