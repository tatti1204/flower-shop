const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// ニュースデータのパス
const newsFilePath = path.join(__dirname, 'data', 'news.json');
// ユーザーデータの初期化
let usersData = {
    users: [{
        id: 'demo1',
        email: 'demo@example.com',
        password: 'demo1234',
        name: 'デモユーザー',
        membershipLevel: 'gold',
        registeredDate: '2025-02-02',
        phone: '',
        address: ''
    }]
};

// ローカル開発環境の場合はファイルから読み込む
const usersFilePath = path.join(__dirname, 'data', 'users.json');
if (process.env.NODE_ENV !== 'production') {
    try {
        const fileData = fs.readFileSync(usersFilePath, 'utf8');
        usersData = JSON.parse(fileData);
    } catch (error) {
        console.error('Error reading users file:', error);
    }
}

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
// ユーザー認証ミドルウェア
const authenticateMember = async (req, res, next) => {
    console.log('Authorization header:', req.headers.authorization);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: '認証が必要です' });
    }

    try {
        // トークンからユーザーIDを取得
        console.log('Token:', token);
        const decodedToken = Buffer.from(token, 'base64').toString();
        console.log('Decoded token:', decodedToken);
        const userId = decodedToken.split('-')[0];
        console.log('User ID:', userId);

        // ユーザーデータの取得
        const users = usersData.users;
        const user = users.find(u => u.id === userId);
        console.log('Found user:', user);

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: '無効なトークンです' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: '認証に失敗しました' });
    }
};

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
                email: user.email,
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

// プロフィール更新API
app.post('/api/member/profile', authenticateMember, async (req, res) => {
    try {
        console.log('Profile update request body:', req.body);
        console.log('Authenticated user:', req.user);

        const { name, email, phone, address, currentPassword, newPassword } = req.body;
        const userIndex = usersData.users.findIndex(u => u.id === req.user.id);
        console.log('Found user index:', userIndex);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        // パスワード変更のチェック
        if (currentPassword && newPassword) {
            if (users.users[userIndex].password !== currentPassword) {
                return res.status(400).json({ error: '現在のパスワードが正しくありません' });
            }
            users.users[userIndex].password = newPassword;
        }

        // プロフィール情報の更新
        usersData.users[userIndex].name = name || usersData.users[userIndex].name;
        usersData.users[userIndex].email = email || usersData.users[userIndex].email;
        usersData.users[userIndex].phone = phone || usersData.users[userIndex].phone || '';
        usersData.users[userIndex].address = address || usersData.users[userIndex].address || '';

        // ローカル開発環境の場合はファイルに保存
        if (process.env.NODE_ENV !== 'production') {
            await fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2));
        }

        res.json({
            message: 'プロフィールを更新しました',
            user: {
                name: users.users[userIndex].name,
                email: users.users[userIndex].email,
                phone: users.users[userIndex].phone,
                address: users.users[userIndex].address
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
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
