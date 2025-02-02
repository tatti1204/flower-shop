document.addEventListener('DOMContentLoaded', function() {
    // ニュース一覧を表示する関数
    async function displayNews() {
        try {
            const response = await fetch('http://localhost:3001/api/news', {
                cache: 'no-store' // キャッシュを無効化
            });
            const data = await response.json();
            const newsContainer = document.querySelector('.news-grid');
            
            if (!newsContainer) return;

            // 最新の3件のニュースを表示
            const recentNews = data.news.slice(0, 3);
            
            newsContainer.innerHTML = recentNews.map(news => `
                <a href="${news.url}" class="news-item">
                    <span class="date">${news.date}</span>
                    <span class="category">${news.category}</span>
                    <h3>${news.title}</h3>
                    <p class="excerpt">${news.excerpt}</p>
                </a>
            `).join('');

        } catch (error) {
            console.error('ニュースの読み込みに失敗しました:', error);
        }
    }

    // ページネーションの設定
    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;
    let allNews = [];
    let filteredNews = [];

    // ニュース一覧ページの場合は全件表示する関数
    async function displayAllNews() {
        try {
            const response = await fetch('http://localhost:3001/api/news', {
                cache: 'no-store' // キャッシュを無効化
            });
            const data = await response.json();
            allNews = data.news;
            filteredNews = allNews;
            
            displayNewsPage(currentPage);
            updatePagination();
        } catch (error) {
            console.error('ニュースの読み込みに失敗しました:', error);
        }
    }

    // 指定されたページのニュースを表示
    function displayNewsPage(page) {
        const newsContainer = document.querySelector('.news-list');
        if (!newsContainer) return;

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageNews = filteredNews.slice(start, end);

        // カテゴリーに応じた画像を返す
        function getCategoryImage(category) {
            const images = {
                'お知らせ': 'images/news/announcement.jpg',
                '店舗情報': 'images/news/shop.jpg',
                'キャンペーン': 'images/news/campaign.jpg',
                'ワークショップ': 'images/news/workshop.jpg'
            };
            return images[category] || 'images/news/default.jpg';
        }

        newsContainer.innerHTML = pageNews.map(news => `
            <article class="news-item">
                <div class="news-image">
                    <img src="${getCategoryImage(news.category)}" alt="${news.title}">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <time class="date">${news.date}</time>
                        <span class="category">${news.category}</span>
                    </div>
                    <h2 class="title">
                        <a href="${news.url}">${news.title}</a>
                    </h2>
                    <p class="excerpt">${news.excerpt}</p>
                    <a href="${news.url}" class="read-more">続きを読む</a>
                </div>
            </article>
        `).join('');
    }

    // カテゴリーでニュースをフィルタリングする関数
    function filterNewsByCategory(category) {
        filteredNews = category === 'all' 
            ? allNews 
            : allNews.filter(news => news.category === category);
        
        currentPage = 1;
        displayNewsPage(currentPage);
        updatePagination();
    }

    // ページネーションを更新
    function updatePagination() {
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // 前のページへのリンク
        if (currentPage > 1) {
            paginationHTML += `<a href="#" data-page="${currentPage - 1}" class="prev">&laquo;</a>`;
        }

        // ページ番号
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<a href="#" data-page="${i}" ${i === currentPage ? 'class="active"' : ''}>${i}</a>`;
        }

        // 次のページへのリンク
        if (currentPage < totalPages) {
            paginationHTML += `<a href="#" data-page="${currentPage + 1}" class="next">&raquo;</a>`;
        }

        pagination.innerHTML = paginationHTML;

        // ページネーションのクリックイベントを設定
        const pageLinks = pagination.querySelectorAll('a');
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                currentPage = page;
                displayNewsPage(currentPage);
                updatePagination();
                window.scrollTo(0, 0);
            });
        });
    }

    // 現在のページに応じて適切な関数を実行
    const pagePath = window.location.pathname;
    if (pagePath.includes('news.html')) {
        displayAllNews();
        
        // カテゴリーフィルターのイベントリスナーを設定
        const categoryButtons = document.querySelectorAll('.news-filter button');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // ボタンのテキストをカテゴリーとして使用
                const category = button.textContent === 'すべて' ? 'all' : button.textContent;
                filterNewsByCategory(category);
                
                // アクティブなボタンのスタイルを更新
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    } else {
        displayNews();
    }
});
