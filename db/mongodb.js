const { MongoClient } = require('mongodb');

// MongoDBの接続URL（本番環境では環境変数から取得）
const MONGODB_URI = 'mongodb+srv://tachizawa:gxIyaVHgKwP2IqTL@cluster0.jcvzl.mongodb.net/flower-shop?retryWrites=true&w=majority';

// データベース接続のキャッシュ
let cachedDb = null;

async function connectToDatabase() {
    console.log('Connecting to MongoDB...');
    if (cachedDb) {
        console.log('Using cached database connection');
        return cachedDb;
    }

    try {
        console.log('Connection string:', MONGODB_URI);
        console.log('Attempting DNS resolution...');
        const { lookup } = require('dns').promises;
        try {
            const address = await lookup('cluster0.jcvzl.mongodb.net');
            console.log('DNS resolution result:', address);
        } catch (dnsError) {
            console.error('DNS resolution failed:', dnsError);
        }

        console.log('Attempting to connect to MongoDB...');
        // MongoDBに接続
        const client = await MongoClient.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Successfully connected to MongoDB');

        const db = client.db('flower-shop');
        console.log('Selected database: flower-shop');
        
        // 接続をキャッシュ
        cachedDb = db;

        // 接続が成功したことを確認
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections);

        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// ユーザー関連の操作
async function findUserByEmail(email) {
    console.log('Finding user by email:', email);
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });
    console.log('Found user:', user);
    return user;
}

async function findUserById(id) {
    const db = await connectToDatabase();
    return db.collection('users').findOne({ id });
}

// ユーザーデータのバリデーション
const validateUserData = (userData) => {
    const { name, phone, address } = userData;

    // 必須フィールドのチェック
    if (!name) {
        throw new Error('お名前は必須です');
    }

    // 電話番号のフォーマットチェック
    if (phone && !phone.match(/^[0-9-]*$/)) {
        throw new Error('電話番号のフォーマットが正しくありません');
    }

    return { name, phone, address };
};

async function updateUser(id, userData) {
    const db = await connectToDatabase();
    
    try {
        // ユーザーの存在チェック
        const existingUser = await db.collection('users').findOne({ id });
        if (!existingUser) {
            throw new Error('ユーザーが見つかりません');
        }

        // データのバリデーション
        const validatedData = validateUserData(userData);

        // 更新日時を追加
        validatedData.updatedAt = new Date().toISOString();

        // データ更新
        await db.collection('users').updateOne(
            { id },
            { $set: validatedData }
        );

        // 更新後のデータを取得
        return db.collection('users').findOne({ id });
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

// 初期データの設定
async function setupInitialData() {
    console.log('Setting up initial data...');
    try {
        const db = await connectToDatabase();
        const users = db.collection('users');

        // ユーザーコレクションが空の場合、初期データを挿入
        const count = await users.countDocuments();
        console.log('Current user count:', count);

        if (count === 0) {
            const initialUser = {
                id: 'demo1',
                email: 'demo@example.com',
                password: 'demo1234',
                name: 'デモユーザー',
                membershipLevel: 'gold',
                registeredDate: '2025-02-02',
                phone: '',
                address: ''
            };

            const result = await users.insertOne(initialUser);
            console.log('Initial user data has been set up:', result);

            // 挿入されたデータを確認
            const insertedUser = await users.findOne({ id: 'demo1' });
            console.log('Inserted user data:', insertedUser);
        } else {
            // 既存のデータを確認
            const existingUser = await users.findOne({ email: 'demo@example.com' });
            console.log('Existing demo user:', existingUser);
        }
    } catch (error) {
        console.error('Error setting up initial data:', error);
        throw error;
    }
}

module.exports = {
    connectToDatabase,
    findUserByEmail,
    findUserById,
    updateUser,
    setupInitialData
};
