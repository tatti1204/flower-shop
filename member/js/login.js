document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch('/api/member/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // ログイン成功
            localStorage.setItem('memberToken', data.token);
            localStorage.setItem('memberName', data.name);
            window.location.href = '/member/mypage.html';
        } else {
            // ログイン失敗
            errorMessage.textContent = data.error || 'ログインに失敗しました';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'サーバーとの通信に失敗しました';
        errorMessage.style.display = 'block';
    }
});
