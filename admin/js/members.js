// 会員一覧を取得して表示
async function fetchMembers() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/members', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('会員情報の取得に失敗しました');
        }
        
        const members = await response.json();
        displayMembers(members);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// 会員一覧を表示
function displayMembers(members) {
    const tbody = document.getElementById('memberList');
    tbody.innerHTML = '';
    
    members.forEach(member => {
        const tr = document.createElement('tr');
        
        // 会員レベルに応じたバッジのスタイルを設定
        const levelClass = 
            member.membershipLevel === 'gold' ? 'status-gold' :
            member.membershipLevel === 'silver' ? 'status-silver' :
            'status-normal';
        
        const levelText = 
            member.membershipLevel === 'gold' ? 'ゴールド会員' :
            member.membershipLevel === 'silver' ? 'シルバー会員' :
            '一般会員';

        tr.innerHTML = `
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td><span class="status-badge ${levelClass}">${levelText}</span></td>
            <td>${new Date(member.registeredDate).toLocaleDateString('ja-JP')}</td>
            <td>${member.updatedAt ? new Date(member.updatedAt).toLocaleDateString('ja-JP') : '未更新'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editMember('${member.id}')">編集</button>
                    <button class="btn-delete" onclick="deleteMember('${member.id}')">削除</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// 会員を検索
function searchMembers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.getElementById('memberList').getElementsByTagName('tr');
    
    for (let row of rows) {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// 会員を編集
async function editMember(id) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/members/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('会員情報の取得に失敗しました');
        }
        
        const member = await response.json();
        
        // フォームに値を設定
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberLevel').value = member.membershipLevel;
        document.getElementById('memberPhone').value = member.phone || '';
        document.getElementById('memberAddress').value = member.address || '';
        
        // モーダルを表示
        const modal = document.getElementById('memberModal');
        modal.style.display = 'block';
        
        // フォームの送信イベントを設定
        const form = document.getElementById('memberForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateMember(id, {
                name: document.getElementById('memberName').value,
                email: document.getElementById('memberEmail').value,
                membershipLevel: document.getElementById('memberLevel').value,
                phone: document.getElementById('memberPhone').value,
                address: document.getElementById('memberAddress').value
            });
        };
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// 会員情報を更新
async function updateMember(id, data) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/members/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('会員情報の更新に失敗しました');
        }
        
        closeMemberModal();
        fetchMembers(); // 一覧を再読み込み
        alert('会員情報を更新しました');
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// 会員を削除
async function deleteMember(id) {
    if (!confirm('本当にこの会員を削除しますか？')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/members/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('会員の削除に失敗しました');
        }
        
        alert('会員を削除しました');
        fetchMembers(); // 一覧を再読み込み
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// モーダルを閉じる
function closeMemberModal() {
    const modal = document.getElementById('memberModal');
    modal.style.display = 'none';
}

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
    fetchMembers();
    
    // モーダルの外側をクリックしたら閉じる
    window.onclick = (event) => {
        const modal = document.getElementById('memberModal');
        if (event.target === modal) {
            closeMemberModal();
        }
    };
});
