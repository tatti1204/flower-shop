require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { findUserByEmail, findUserById, updateUser, setupInitialData, connectToDatabase } = require('./db/mongodb');

// MongoDBの接続文字列をログ出力（パスワードは隠す）
console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/:([^:@]+)@/, ':****@'));

const app = express();
const port = process.env.PORT || 3001;

// ニュースデータのパス
const newsFilePath = path.join(__dirname, 'data', 'news.json');

// 初期データのセットアップ
setupInitialData().catch(console.error);

// 管理者認証ミドルウェア
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === 'Bearer admin-token') {
        next();
    } else {
        res.status(401).json({ error: '管理者認証が必要です' });
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

// 管理者ログインAPI
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('管理者ログイン試行:', { email });

        // 管理者認証情報の確認
        if (email === 'admin@example.com' && password === 'admin1234') {
            const token = 'admin-token';
            console.log('管理者ログイン成功');
            return res.json({ token });
        } else {
            console.log('管理者ログイン失敗');
            return res.status(401).json({ error: 'ユーザー名またはパスワードが違います' });
        }
    } catch (error) {
        console.error('Error in admin login:', error);
        res.status(500).json({ error: 'ログインに失敗しました' });
    }
});

// 管理者用会員一覧取得API
app.get('/api/admin/members', authenticate, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const members = await db.collection('users').find().toArray();
        console.log('取得した会員一覧:', members);
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: '会員情報の取得に失敗しました' });
    }
});

// 管理者用会員編集API
app.put('/api/admin/members/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log('会員編集リクエスト:', { id, updateData });

        const db = await connectToDatabase();
        const result = await db.collection('users').updateOne(
            { id },
            { $set: { ...updateData, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: '指定された会員が見つかりません' });
        }

        const updatedMember = await db.collection('users').findOne({ id });
        console.log('更新後の会員情報:', updatedMember);
        res.json(updatedMember);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: '会員情報の更新に失敗しました' });
    }
});

// 管理者用会員削除API
app.delete('/api/admin/members/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('会員削除リクエスト:', { id });

        const db = await connectToDatabase();
        const result = await db.collection('users').deleteOne({ id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: '指定された会員が見つかりません' });
        }
        
        console.log('会員を削除しました:', { id });
        res.json({ message: '会員を削除しました' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: '会員の削除に失敗しました' });
    }
});

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

        // MongoDBからユーザーを取得
        const user = await findUserById(userId);
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

// 会員ログインAPI
app.post('/api/member/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('ログイン試行:', { email });

        // デモユーザーの場合の特別処理
        if (email === 'demo@example.com' && password === 'demo1234') {
            const demoUser = await findUserByEmail(email);
            if (demoUser) {
                const token = Buffer.from(`${demoUser.id}-${Date.now()}`).toString('base64');
                console.log('デモユーザーログイン成功:', {
                    id: demoUser.id,
                    email: demoUser.email,
                    name: demoUser.name
                });
                return res.json({
                    token,
                    name: demoUser.name,
                    email: demoUser.email,
                    membershipLevel: demoUser.membershipLevel
                });
            }
        }

        const user = await findUserByEmail(email);
        console.log('ユーザー情報:', user ? {
            id: user.id,
            email: user.email,
            name: user.name
        } : null);

        if (!user || user.password !== password) {
            console.log('ログイン失敗:', { email });
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }

        const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
        console.log('ログイン成功:', {
            id: user.id,
            email: user.email,
            name: user.name
        });

        res.json({
            token,
            name: user.name,
            email: user.email,
            membershipLevel: user.membershipLevel
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'ログイン処理に失敗しました' });
    }
});

// エラーハンドリング関数
const handleError = (error, res, defaultMessage) => {
    console.error('Error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
    }
    if (error.name === 'AuthenticationError') {
        return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: defaultMessage });
};

// 入力チェック関数
const validateProfileInput = (body) => {
    const { name, email, phone, address } = body;
    if (!name || name.trim().length === 0) {
        throw Object.assign(new Error('お名前は必須です'), { name: 'ValidationError' });
    }
    if (name.length > 50) {
        throw Object.assign(new Error('お名前は50文字以内で入力してください'), { name: 'ValidationError' });
    }
    if (!email || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        throw Object.assign(new Error('正しいメールアドレスを入力してください'), { name: 'ValidationError' });
    }
    if (phone && !phone.match(/^[0-9-]*$/)) {
        throw Object.assign(new Error('電話番号は数字とハイフンのみを使用してください'), { name: 'ValidationError' });
    }
    return { name, email, phone, address };
};

// プロフィール取得API
app.get('/api/member/profile', authenticateMember, async (req, res) => {
    try {
        if (!req.user) {
            throw Object.assign(new Error('ユーザー情報が見つかりません'), { name: 'AuthenticationError' });
        }

        res.json({
            name: req.user.name,
            email: req.user.email,
            membershipLevel: req.user.membershipLevel,
            phone: req.user.phone || '',
            address: req.user.address || '',
            registeredDate: req.user.registeredDate,
            updatedAt: req.user.updatedAt
        });
    } catch (error) {
        handleError(error, res, 'プロフィール情報の取得に失敗しました');
    }
});

// プロフィール更新API
app.put('/api/member/profile', authenticateMember, async (req, res) => {
    try {
        console.log('プロフィール更新リクエスト:', req.body);
        const user = await findUserById(req.user.id);

        // 更新データの準備
        const updateData = {};

        // 基本情報の更新
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.address !== undefined) updateData.address = req.body.address;

        // パスワードの更新がある場合
        if (req.body.currentPassword && req.body.newPassword) {
            console.log('パスワード更新の試行:', {
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword
            });

            // 現在のパスワードを確認
            if (!user || user.password !== req.body.currentPassword) {
                console.log('現在のパスワードが一致しません');
                return res.status(400).json({ error: '現在のパスワードが正しくありません' });
            }

            // 新しいパスワードのバリデーション
            if (req.body.newPassword.length < 8) {
                return res.status(400).json({ error: '新しいパスワードは8文字以上で入力してください' });
            }

            updateData.password = req.body.newPassword;
            console.log('パスワードを更新します:', { newPassword: req.body.newPassword });
        }

        console.log('更新するデータ:', updateData);
        const updatedUser = await updateUser(req.user.id, updateData);

        if (!updatedUser) {
            throw Object.assign(new Error('ユーザー情報の更新に失敗しました'), { name: 'ValidationError' });
        }

        console.log('更新後のユーザー情報:', updatedUser);
        res.json({
            name: updatedUser.name,
            email: updatedUser.email,
            membershipLevel: updatedUser.membershipLevel,
            phone: updatedUser.phone || '',
            address: updatedUser.address || '',
            registeredDate: updatedUser.registeredDate,
            updatedAt: updatedUser.updatedAt
        });
    } catch (error) {
        handleError(error, res, 'プロフィール情報の更新に失敗しました');
    }
});

app.post('/api/member/profile', authenticateMember, async (req, res) => {
    try {
        console.log('Profile update request body:', req.body);
        console.log('Authenticated user:', req.user);

        const { name, email, phone, address, currentPassword, newPassword } = req.body;
        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        // パスワード変更のチェック
        if (currentPassword && newPassword) {
            if (user.password !== currentPassword) {
                return res.status(400).json({ error: '現在のパスワードが正しくありません' });
            }
        }

        // 更新データの準備
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (currentPassword && newPassword) updateData.password = newPassword;

        // MongoDBでユーザー情報を更新
        await updateUser(user.id, updateData);

        // 更新後のユーザー情報を取得
        const updatedUser = await findUserById(user.id);

        res.json({
            message: 'プロフィールを更新しました',
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone || '',
                address: updatedUser.address || ''
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
    }
});

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
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'データの更新に失敗しました' });
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
    console.log(`Server is running on port ${port}`);
});
