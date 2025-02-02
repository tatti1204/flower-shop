// 認証関連の処理を管理するクラス
class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.checkAuth();
    }

    // ログイン状態をチェック
    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            if (window.location.pathname !== '/admin/login.html' && 
                window.location.pathname !== '/flower-shop/admin/login.html') {
                this.redirectToLogin();
            }
            return false;
        }
        
        // トークンの有効期限をチェック
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            if (tokenData.exp < Date.now() / 1000) {
                this.logout();
                return false;
            }
        } catch (e) {
            this.logout();
            return false;
        }

        this.isAuthenticated = true;
        return true;
    }

    // ログイン処理
    async login(username, password) {
        // デモ用の簡易認証
        if (username === 'admin' && password === 'password') {
            const token = this.generateDemoToken();
            localStorage.setItem('adminToken', token);
            localStorage.setItem('username', username);
            this.isAuthenticated = true;
            return true;
        }
        throw new Error('ユーザー名またはパスワードが違います');
    }

    // ログアウト処理
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('username');
        this.isAuthenticated = false;
        this.redirectToLogin();
    }

    // ログイン画面へリダイレクト
    redirectToLogin() {
        const currentPath = window.location.pathname;
        const loginPath = currentPath.includes('/flower-shop/') 
            ? '/flower-shop/admin/login.html' 
            : '/admin/login.html';
        
        if (currentPath !== loginPath) {
            window.location.href = loginPath;
        }
    }

    // デモ用のJWTトークンを生成
    generateDemoToken() {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        const payload = {
            sub: 'admin',
            name: 'Administrator',
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1時間有効
        };

        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = 'demo-signature';

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
}

// グローバルで使用できるように認証インスタンスを作成
const auth = new Auth();

// ログインフォームの処理
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        try {
            await auth.login(username, password);
            const currentPath = window.location.pathname;
            const dashboardPath = currentPath.includes('/flower-shop/') 
                ? '/flower-shop/admin/dashboard.html' 
                : '/admin/dashboard.html';
            window.location.href = dashboardPath;
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
}

// ログアウトボタンの処理
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
    });
}

// ユーザー名の表示
const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay) {
    usernameDisplay.textContent = localStorage.getItem('username');
}
