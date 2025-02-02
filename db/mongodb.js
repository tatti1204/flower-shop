const { MongoClient } = require('mongodb');

// MongoDBの接続URL（本番環境では環境変数から取得）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/flower-shop?retryWrites=true&w=majority';

// データベース接続のキャッシュ
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        // MongoDBに接続
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('flower-shop');
        
        // 接続をキャッシュ
        cachedDb = db;
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// ユーザー関連の操作
async function findUserByEmail(email) {
    const db = await connectToDatabase();
    return db.collection('users').findOne({ email });
}

async function findUserById(id) {
    const db = await connectToDatabase();
    return db.collection('users').findOne({ id });
}

async function updateUser(id, userData) {
    const db = await connectToDatabase();
    return db.collection('users').updateOne(
        { id },
        { $set: userData }
    );
}

// 初期データの設定（開発環境用）
async function setupInitialData() {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    const db = await connectToDatabase();
    const users = db.collection('users');

    // ユーザーコレクションが空の場合、初期データを挿入
    const count = await users.countDocuments();
    if (count === 0) {
        await users.insertOne({
            id: 'demo1',
            email: 'demo@example.com',
            password: 'demo1234',
            name: 'デモユーザー',
            membershipLevel: 'gold',
            registeredDate: '2025-02-02',
            phone: '',
            address: ''
        });
        console.log('Initial user data has been set up');
    }
}

module.exports = {
    connectToDatabase,
    findUserByEmail,
    findUserById,
    updateUser,
    setupInitialData
};
