const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// ニュースデータのパス
const newsFilePath = path.join(__dirname, 'data', 'news.json');
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// 認証ミドルウェア（簡易版）
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === 'Bearer demo-token') {
        next();
    } else {
        res.status(401).json({ error: '認証が必要です' });
    }
};

// CORSの設定
app.use(cors());  // すべてのオリジンを許可

// ミドルウェアの設定
app.use(bodyParser.json());

// 静的ファイルの提供
app.use(express.static(path.join(__dirname)));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/member', express.static(path.join(__dirname, 'member')));

// 会員ログインAPI
app.post('/api/member/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(userData).users;
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // 簡易的なトークン生成（本番環境ではより安全な方法を使用してください）
            const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
            res.json({
                token,
                name: user.name,
                membershipLevel: user.membershipLevel
            });
        } else {
            res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'ログイン処理に失敗しました' });
    }
});

// APIエンドポイント

// ニュース一覧の取得
app.get('/api/news', async (req, res) => {
    try {
        const data = await fs.readFile(newsFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading news:', error);
        res.status(500).json({ error: 'データの読み込みに失敗しました' });
    }
});

// ニュースの追加/更新
app.post('/api/news', authenticate, async (req, res) => {
    try {
        const data = await fs.readFile(newsFilePath, 'utf8');
        const newsData = JSON.parse(data);
        const newNews = req.body;

        if (newNews.id) {
            // 更新
            const index = newsData.news.findIndex(item => item.id === newNews.id);
            if (index !== -1) {
                newsData.news[index] = { ...newsData.news[index], ...newNews };
            }
        } else {
            // 新規追加
            newNews.id = Math.max(0, ...newsData.news.map(n => n.id)) + 1;
            newNews.date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '.');
            newsData.news.unshift(newNews);
        }

        await fs.writeFile(newsFilePath, JSON.stringify(newsData, null, 2));
        res.json(newsData);
    } catch (error) {
        console.error('Error saving news:', error);
        res.status(500).json({ error: 'データの保存に失敗しました' });
    }
});

// ニュースの削除
app.delete('/api/news/:id', authenticate, async (req, res) => {
    try {
        const data = await fs.readFile(newsFilePath, 'utf8');
        const newsData = JSON.parse(data);
        const id = parseInt(req.params.id);

        newsData.news = newsData.news.filter(item => item.id !== id);
        await fs.writeFile(newsFilePath, JSON.stringify(newsData, null, 2));
        res.json(newsData);
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'データの削除に失敗しました' });
    }
});

// サーバーの起動
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
