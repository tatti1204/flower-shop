// ログイン状態をチェックする関数
function checkLoginStatus() {
    const token = localStorage.getItem('memberToken');
    const memberName = localStorage.getItem('memberName');
    return { isLoggedIn: !!token, memberName };
}

// 会員専用コンテンツを表示/非表示する関数
function updateMemberContent() {
    const { isLoggedIn, memberName } = checkLoginStatus();
    
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
        // ログインボタンをマイページリンクに変更
        if (loginButton) {
            loginButton.textContent = `${memberName}様`;
            loginButton.href = '/member/mypage.html';
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
