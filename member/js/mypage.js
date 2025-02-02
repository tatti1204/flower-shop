document.addEventListener('DOMContentLoaded', () => {
    // ログイン状態をチェック
    const token = localStorage.getItem('memberToken');
    const memberName = localStorage.getItem('memberName');
    
    if (!token) {
        // 未ログインの場合はログインページにリダイレクト
        window.location.href = '/member/login.html';
        return;
    }
    
    // ユーザー名を表示
    document.getElementById('memberName').textContent = memberName;
    
    // ログアウトボタンの処理
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('memberToken');
        localStorage.removeItem('memberName');
        window.location.href = '/member/login.html';
    });
});
