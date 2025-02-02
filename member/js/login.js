document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    console.log('ログイン試行:', { email });
    
    try {
        const response = await fetch('/api/member/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('レスポンスステータス:', response.status);
        const data = await response.json();
        console.log('レスポンスデータ:', data);
        
        if (response.ok) {
            console.log('ログイン成功:', { 
                token: data.token,
                name: data.name,
                email: data.email
            });
            
            // ローカルストレージに保存
            localStorage.setItem('memberToken', data.token);
            localStorage.setItem('memberName', data.name);
            localStorage.setItem('memberEmail', email);
            
            // トップページに遷移
            window.location.href = '/';
        } else {
            console.log('ログイン失敗:', data.error);
            errorMessage.textContent = data.error || 'ログインに失敗しました';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'サーバーとの通信に失敗しました';
        errorMessage.style.display = 'block';
    }
});
