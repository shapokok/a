// Flashcards Component
window.FlashcardsComponent = {
    data: null,
    currentWeek: 'week1',
    currentCardIndex: 0,
    isFlipped: false,
    weekProgress: {},

    render(data) {
        this.data = data;
        this.renderWeekSelector();
        this.loadWeek(this.currentWeek);
    },

    renderWeekSelector() {
        const container = document.getElementById('flashcards-week-selector');
        if (!container) return;

        const weekNames = [
            'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5',
            'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'
        ];

        let html = '<div class="week-selector">';
        weekNames.forEach((name, index) => {
            const week = `week${index + 1}`;
            const isActive = week === this.currentWeek ? 'active' : '';
            html += `
                <button class="week-btn ${isActive}" data-week="${week}">
                    ${name}
                </button>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.week-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const week = e.target.getAttribute('data-week');
                this.currentWeek = week;
                this.currentCardIndex = 0;
                this.isFlipped = false;

                // Update active button
                container.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.loadWeek(week);
            });
        });
    },

    loadWeek(week) {
        if (!this.data || !this.data[week]) return;

        this.currentCardIndex = 0;
        this.isFlipped = false;

        // Initialize progress for this week
        if (!this.weekProgress[week]) {
            this.weekProgress[week] = {
                known: 0,
                unknown: 0,
                cards: new Array(this.data[week].length).fill(null)
            };
        }

        this.renderCard();
    },

    renderCard() {
        const container = document.getElementById('flashcards-content');
        if (!container || !this.data[this.currentWeek]) return;

        const cards = this.data[this.currentWeek];
        const card = cards[this.currentCardIndex];

        if (!card) {
            this.renderComplete();
            return;
        }

        const progress = this.weekProgress[this.currentWeek];
        const total = cards.length;
        const reviewed = progress.cards.filter(c => c !== null).length;

        const html = `
            <div class="flashcard-progress">
                Карточка ${this.currentCardIndex + 1} из ${total} | Просмотрено: ${reviewed}
            </div>

            <div class="flashcard-container">
                <div class="flashcard ${this.isFlipped ? 'flipped' : ''}" id="current-flashcard">
                    <div class="flashcard-content">
                        ${this.isFlipped ? card.back : card.front}
                    </div>
                    <div class="flashcard-hint">
                        ${this.isFlipped ? 'Нажмите для возврата' : 'Нажмите чтобы увидеть ответ'}
                    </div>
                </div>

                ${this.isFlipped ? `
                    <div class="flashcard-controls">
                        <button class="btn-dont-know" id="btn-dont-know">Не знаю</button>
                        <button class="btn-know" id="btn-know">Знаю</button>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners
        const flashcard = document.getElementById('current-flashcard');
        if (flashcard) {
            flashcard.addEventListener('click', () => this.flipCard());
        }

        const knowBtn = document.getElementById('btn-know');
        const dontKnowBtn = document.getElementById('btn-dont-know');

        if (knowBtn) {
            knowBtn.addEventListener('click', () => this.markCard(true));
        }

        if (dontKnowBtn) {
            dontKnowBtn.addEventListener('click', () => this.markCard(false));
        }
    },

    flipCard() {
        this.isFlipped = !this.isFlipped;
        this.renderCard();
    },

    markCard(known) {
        const progress = this.weekProgress[this.currentWeek];

        if (known) {
            progress.known++;
            progress.cards[this.currentCardIndex] = true;
        } else {
            progress.unknown++;
            progress.cards[this.currentCardIndex] = false;
        }

        // Update global progress
        const total = this.data[this.currentWeek].length;
        window.app.updateProgress('flashcard', this.currentWeek, {
            known: progress.known,
            total: total
        });

        // Move to next card
        this.currentCardIndex++;
        this.isFlipped = false;
        this.renderCard();
    },

    renderComplete() {
        const container = document.getElementById('flashcards-content');
        if (!container) return;

        const progress = this.weekProgress[this.currentWeek];
        const total = progress.cards.length;
        const percentage = Math.round((progress.known / total) * 100);

        const html = `
            <div class="quiz-results">
                <h3>Карточки завершены!</h3>
                <div class="score">${percentage}%</div>
                <p>Знаю: ${progress.known} | Не знаю: ${progress.unknown}</p>
                <button class="btn-primary" id="restart-flashcards" style="margin-top: 2rem;">
                    Повторить снова
                </button>
            </div>
        `;

        container.innerHTML = html;

        const restartBtn = document.getElementById('restart-flashcards');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.weekProgress[this.currentWeek] = {
                    known: 0,
                    unknown: 0,
                    cards: new Array(this.data[this.currentWeek].length).fill(null)
                };
                this.loadWeek(this.currentWeek);
            });
        }
    }
};
