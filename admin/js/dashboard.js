class NewsManager {
    constructor() {
        this.newsData = [];
        this.apiUrl = 'http://localhost:3001/api';
        this.init();
    }

    async init() {
        await this.loadNews();
        this.setupEventListeners();
        this.renderNews();
    }

    // APIヘッダーの取得
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-token'
        };
    }

    // ニュース一覧を読み込む
    async loadNews() {
        try {
            const response = await fetch(`${this.apiUrl}/news`);
            const data = await response.json();
            this.newsData = data.news;
        } catch (error) {
            console.error('ニュースの読み込みに失敗しました:', error);
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        const addButton = document.getElementById('addNewNews');
        if (addButton) {
            addButton.addEventListener('click', () => this.openModal());
        }

        const newsForm = document.getElementById('newsForm');
        if (newsForm) {
            newsForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    // ニュース一覧を表示
    renderNews() {
        const container = document.getElementById('newsList');
        if (!container) return;

        container.innerHTML = this.newsData.map(news => `
            <div class="news-item" data-id="${news.id}">
                <div class="news-content">
                    <h3>${news.title}</h3>
                    <div class="news-meta">
                        <span class="date">${news.date}</span>
                        <span class="category">${news.category}</span>
                    </div>
                    <p>${news.excerpt}</p>
                </div>
                <div class="news-actions">
                    <button class="edit" onclick="newsManager.editNews(${news.id})">
                        <i class="fas fa-edit"></i> 編集
                    </button>
                    <button class="delete" onclick="newsManager.deleteNews(${news.id})">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // モーダルを開く
    openModal(newsId = null) {
        const modal = document.getElementById('newsModal');
        const form = document.getElementById('newsForm');
        
        if (newsId) {
            const news = this.newsData.find(n => n.id === newsId);
            if (news) {
                form.elements.title.value = news.title;
                form.elements.category.value = news.category;
                form.elements.excerpt.value = news.excerpt;
                form.elements.url.value = news.url;
                form.dataset.id = newsId;
            }
        } else {
            form.reset();
            delete form.dataset.id;
        }

        modal.classList.add('active');
    }

    // モーダルを閉じる
    closeModal() {
        const modal = document.getElementById('newsModal');
        modal.classList.remove('active');
    }

    // ニュースの編集
    editNews(id) {
        this.openModal(id);
    }

    // ニュースの削除
    async deleteNews(id) {
        if (!confirm('このお知らせを削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`${this.apiUrl}/news/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('削除に失敗しました');

            const data = await response.json();
            this.newsData = data.news;
            this.renderNews();
        } catch (error) {
            console.error('ニュースの削除に失敗しました:', error);
            alert('削除に失敗しました。もう一度お試しください。');
        }
    }

    // フォームの送信処理
    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const newsItem = {
            title: formData.get('title'),
            category: formData.get('category'),
            excerpt: formData.get('excerpt'),
            url: formData.get('url')
        };

        if (form.dataset.id) {
            newsItem.id = parseInt(form.dataset.id);
        }

        try {
            const response = await fetch(`${this.apiUrl}/news`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(newsItem)
            });

            if (!response.ok) throw new Error('保存に失敗しました');

            const data = await response.json();
            this.newsData = data.news;
            this.renderNews();
            this.closeModal();
        } catch (error) {
            console.error('ニュースの保存に失敗しました:', error);
            alert('保存に失敗しました。もう一度お試しください。');
        }
    }

    // 次のIDを取得
    getNextId() {
        return Math.max(0, ...this.newsData.map(n => n.id)) + 1;
    }

    // ニュースデータを保存
    async saveNews() {
        try {
            const response = await fetch('/data/news.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ news: this.newsData })
            });
            
            if (!response.ok) {
                throw new Error('保存に失敗しました');
            }
        } catch (error) {
            console.error('ニュースの保存に失敗しました:', error);
            alert('保存に失敗しました。もう一度お試しください。');
        }
    }
}

// グローバルで使用できるようにインスタンスを作成
const newsManager = new NewsManager();

// モーダルを閉じる関数
function closeModal() {
    newsManager.closeModal();
}
