// Main App Logic
class App {
    constructor() {
        this.currentScreen = 'home';
        this.theme = localStorage.getItem('theme') || 'light';
        this.data = {
            cheatsheets: null,
            flashcards: null,
            questions: null
        };

        this.init();
    }

    async init() {
        this.applyTheme();
        this.setupEventListeners();
        await this.loadData();
        this.initializeProgress();
    }

    // Theme Management
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    // Data Loading
    async loadData() {
        try {
            // Use embedded data if available (for file:// protocol support)
            if (window.EXAM_DATA) {
                this.data.cheatsheets = window.EXAM_DATA.cheatsheets;
                this.data.flashcards = window.EXAM_DATA.flashcards;
                this.data.questions = window.EXAM_DATA.questions;
                console.log('Data loaded successfully from embedded source');
            } else {
                // Fallback to fetch for local server
                const [cheatsheets, flashcards, questions] = await Promise.all([
                    fetch('data/cheatsheets.json').then(r => r.json()),
                    fetch('data/flashcards.json').then(r => r.json()),
                    fetch('data/questions.json').then(r => r.json())
                ]);

                this.data.cheatsheets = cheatsheets;
                this.data.flashcards = flashcards;
                this.data.questions = questions;
                console.log('Data loaded successfully from JSON files');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Ошибка загрузки данных. Убедитесь, что все файлы на месте.');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Menu buttons
        const menuButtons = document.querySelectorAll('.menu-button');
        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                const screen = button.getAttribute('data-screen');
                this.navigateToScreen(screen);
            });
        });

        // Back buttons
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(button => {
            button.addEventListener('click', () => this.navigateToScreen('home'));
        });

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    // Navigation
    navigateToScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;

            // Initialize screen-specific content
            this.initializeScreen(screenName);
        }
    }

    initializeScreen(screenName) {
        switch(screenName) {
            case 'cheatsheets':
                if (window.CheatSheetComponent) {
                    window.CheatSheetComponent.render(this.data.cheatsheets);
                }
                break;
            case 'flashcards':
                if (window.FlashcardsComponent) {
                    window.FlashcardsComponent.render(this.data.flashcards);
                }
                break;
            case 'quiz':
                if (window.QuizComponent) {
                    window.QuizComponent.render(this.data.questions);
                }
                break;
            case 'exam':
                if (window.ExamComponent) {
                    window.ExamComponent.render(this.data.questions);
                }
                break;
            case 'progress':
                this.renderProgress();
                break;
        }
    }

    // Search Functionality
    handleSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (query.length < 2) {
            resultsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Введите минимум 2 символа для поиска</p>';
            return;
        }

        const results = this.searchInData(query.toLowerCase());

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Ничего не найдено</p>';
            return;
        }

        const html = results.map(result => `
            <div class="search-result">
                <h4>${result.week}</h4>
                <p>${this.highlightText(result.text, query)}</p>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
    }

    searchInData(query) {
        const results = [];

        // Search in cheatsheets
        if (this.data.cheatsheets) {
            Object.entries(this.data.cheatsheets).forEach(([week, data]) => {
                const weekTitle = data.title;

                // Search in title
                if (weekTitle.toLowerCase().includes(query)) {
                    results.push({
                        week: weekTitle,
                        text: weekTitle
                    });
                }

                // Search in points
                data.points.forEach(point => {
                    if (point.toLowerCase().includes(query)) {
                        results.push({
                            week: weekTitle,
                            text: point
                        });
                    }
                });
            });
        }

        // Search in flashcards
        if (this.data.flashcards) {
            Object.entries(this.data.flashcards).forEach(([week, cards]) => {
                const weekNum = week.replace('week', 'Week ');
                cards.forEach(card => {
                    if (card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query)) {
                        results.push({
                            week: weekNum,
                            text: `${card.front} — ${card.back}`
                        });
                    }
                });
            });
        }

        return results.slice(0, 20); // Limit to 20 results
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Progress Management
    initializeProgress() {
        if (!localStorage.getItem('progress')) {
            const progress = {
                flashcards: {},
                quizzes: {}
            };

            // Initialize for all weeks
            for (let i = 1; i <= 10; i++) {
                progress.flashcards[`week${i}`] = { known: 0, total: 0 };
                progress.quizzes[`week${i}`] = { score: 0, attempts: 0 };
            }

            localStorage.setItem('progress', JSON.stringify(progress));
        }
    }

    getProgress() {
        return JSON.parse(localStorage.getItem('progress') || '{}');
    }

    updateProgress(type, week, data) {
        const progress = this.getProgress();

        if (type === 'flashcard') {
            if (!progress.flashcards[week]) {
                progress.flashcards[week] = { known: 0, total: 0 };
            }
            progress.flashcards[week] = data;
        } else if (type === 'quiz') {
            if (!progress.quizzes[week]) {
                progress.quizzes[week] = { score: 0, attempts: 0 };
            }
            progress.quizzes[week].score = data.score;
            progress.quizzes[week].attempts += 1;
        }

        localStorage.setItem('progress', JSON.stringify(progress));
    }

    renderProgress() {
        const container = document.getElementById('progress-content');
        if (!container) return;

        const progress = this.getProgress();
        const weekNames = [
            'Основы психологии управления',
            'Международный опыт в психологии управления',
            'Работа с целями в управленческих процессах',
            'Управление человеческими ресурсами',
            'Управление изменениями',
            'Корпоративная культура и деловые коммуникации',
            'Конфликтология в управлении',
            'Стресс-менеджмент в управлении',
            'Лидерство и командообразование',
            'Личностное развитие руководителя'
        ];

        let html = '<div class="progress-grid">';

        for (let i = 1; i <= 10; i++) {
            const week = `week${i}`;
            const flashcardProgress = progress.flashcards[week] || { known: 0, total: 0 };
            const quizProgress = progress.quizzes[week] || { score: 0, attempts: 0 };

            const flashcardPercent = flashcardProgress.total > 0
                ? Math.round((flashcardProgress.known / flashcardProgress.total) * 100)
                : 0;

            const quizPercent = quizProgress.attempts > 0 ? quizProgress.score : 0;

            html += `
                <div class="progress-card">
                    <h3>Week ${i}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">${weekNames[i-1]}</p>

                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">Flashcards</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${flashcardPercent}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>${flashcardProgress.known}/${flashcardProgress.total}</span>
                            <span>${flashcardPercent}%</span>
                        </div>
                    </div>

                    <div>
                        <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">Quiz</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${quizPercent}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>${quizProgress.attempts} попыток</span>
                            <span>${quizPercent}%</span>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
