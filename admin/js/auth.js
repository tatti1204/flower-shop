// 認証関連の処理を管理するクラス
class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.checkAuth();
    }

    // ログイン状態をチェック
    checkAuth() {
        const token = localStorage.getItem('adminToken');
        const currentPath = window.location.pathname;

        // ログインページにいる場合はチェックしない
        if (currentPath.endsWith('/login.html')) {
            return false;
        }

        // トークンがない場合はログインページにリダイレクト
        if (!token) {
            this.redirectToLogin();
            return false;
        }

        this.isAuthenticated = true;
        return true;
    }

    // ログイン処理
    async login(username, password) {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('username', username);
                this.isAuthenticated = true;
                return true;
            } else {
                throw new Error(data.error || 'ログインに失敗しました');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
        window.location.href = '/admin/login.html';
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
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin/';
            } else {
                errorMessage.textContent = data.error || 'ログインに失敗しました';
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'ログインに失敗しました';
        }


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
