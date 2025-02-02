// ログイン状態をチェックする関数
function checkLoginStatus() {
    const token = localStorage.getItem('memberToken');
    const memberName = localStorage.getItem('memberName');
    const memberEmail = localStorage.getItem('memberEmail');
    return { isLoggedIn: !!token, memberName, memberEmail };
}

// ユーザーメニューの生成と表示を管理する関数
function createUserMenu(loginButton, memberName, memberEmail) {
    // 既存のユーザーメニューを削除
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // 新しいユーザーメニューを作成
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <button class="user-menu-button">
            <i class="fas fa-user-circle"></i>
            <span>${memberName}</span>
            <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-menu-content">
            <div class="user-menu-header">
                <div class="user-menu-name">${memberName}</div>
                <div class="user-menu-email">${memberEmail || 'メールアドレス未設定'}</div>
            </div>
            <div class="user-menu-items">
                <a href="/member/mypage.html" class="user-menu-item">
                    <i class="fas fa-home"></i>マイページ
                </a>
                <a href="/member/profile.html" class="user-menu-item">
                    <i class="fas fa-user"></i>プロフィール編集
                </a>
                <a href="/member/orders.html" class="user-menu-item">
                    <i class="fas fa-shopping-bag"></i>注文履歴
                </a>
                <div class="user-menu-divider"></div>
                <a href="#" class="user-menu-item" id="logoutButton">
                    <i class="fas fa-sign-out-alt"></i>ログアウト
                </a>
            </div>
        </div>
    `;

    // ログインボタンをユーザーメニューに置き換え
    loginButton.replaceWith(userMenu);

    // メニューの表示/非表示を制御
    const menuButton = userMenu.querySelector('.user-menu-button');
    const menuContent = userMenu.querySelector('.user-menu-content');

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        menuContent.classList.toggle('show');
    });

    // メニュー外をクリックしたら閉じる
    document.addEventListener('click', () => {
        menuContent.classList.remove('show');
    });

    // ログアウト処理
    const logoutButton = userMenu.querySelector('#logoutButton');
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('memberToken');
        localStorage.removeItem('memberName');
        localStorage.removeItem('memberEmail');
        window.location.reload();
    });
}

// 会員専用コンテンツを表示/非表示する関数
function updateMemberContent() {
    const { isLoggedIn, memberName, memberEmail } = checkLoginStatus();
    
    // 会員専用コンテンツの要素を取得
    const memberOnlyElements = document.querySelectorAll('.member-only');
    const nonMemberElements = document.querySelectorAll('.non-member-only');
    const loginButton = document.querySelector('.member-login');
    
    if (isLoggedIn) {
        // 会員専用コンテンツを表示
        memberOnlyElements.forEach(element => {
            element.style.display = '';
        });
        // 非会員用コンテンツを非表示
        nonMemberElements.forEach(element => {
            element.style.display = 'none';
        });
        // ログインボタンをユーザーメニューに変更
        if (loginButton) {
            createUserMenu(loginButton, memberName, memberEmail);
        }
    } else {
        // 会員専用コンテンツを非表示
        memberOnlyElements.forEach(element => {
            element.style.display = 'none';
        });
        // 非会員用コンテンツを表示
        nonMemberElements.forEach(element => {
            element.style.display = '';
        });
        // ログインボタンを元に戻す
        if (loginButton) {
            loginButton.textContent = '会員ログイン';
            loginButton.href = '/member/login.html';
        }
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', updateMemberContent);
