// Quiz Component
window.QuizComponent = {
    data: null,
    currentWeek: 'week1',
    currentQuestionIndex: 0,
    userAnswers: [],
    isReviewing: false,
    score: 0,

    render(data) {
        this.data = data;
        this.renderWeekSelector();
        this.loadWeek(this.currentWeek);
    },

    renderWeekSelector() {
        const container = document.getElementById('quiz-week-selector');
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
                this.reset();

                // Update active button
                container.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.loadWeek(week);
            });
        });
    },

    reset() {
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.isReviewing = false;
        this.score = 0;
    },

    loadWeek(week) {
        if (!this.data || !this.data[week]) return;
        this.reset();
        this.renderQuestion();
    },

    renderQuestion() {
        const container = document.getElementById('quiz-content');
        if (!container || !this.data[this.currentWeek]) return;

        const questions = this.data[this.currentWeek];

        if (this.currentQuestionIndex >= questions.length) {
            this.renderResults();
            return;
        }

        const question = questions[this.currentQuestionIndex];
        const progress = `Вопрос ${this.currentQuestionIndex + 1} из ${questions.length}`;

        const html = `
            <div class="quiz-container">
                <p style="color: var(--text-secondary); text-align: center; margin-bottom: 2rem;">
                    ${progress}
                </p>

                <div class="question-card">
                    <div class="question-text">${question.question}</div>
                    <div class="options" id="quiz-options">
                        ${question.options.map((option, index) => `
                            <div class="option" data-index="${index}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>

                    ${this.isReviewing ? `
                        <div class="explanation">
                            <strong>Объяснение:</strong> ${question.explanation}
                        </div>
                    ` : ''}
                </div>

                <div class="quiz-controls">
                    <button class="btn-primary" id="quiz-next" ${this.userAnswers[this.currentQuestionIndex] === undefined ? 'disabled' : ''}>
                        ${this.isReviewing ? 'Далее' : 'Ответить'}
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners to options
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                if (this.isReviewing) return; // Can't change answer when reviewing

                const index = parseInt(e.target.getAttribute('data-index'));

                // Toggle selection
                if (this.userAnswers[this.currentQuestionIndex] === undefined) {
                    this.userAnswers[this.currentQuestionIndex] = [];
                }

                const selectedIndexes = this.userAnswers[this.currentQuestionIndex];
                const idx = selectedIndexes.indexOf(index);

                if (idx > -1) {
                    selectedIndexes.splice(idx, 1);
                } else {
                    // For single answer questions, clear previous selection
                    if (question.answer.length === 1) {
                        this.userAnswers[this.currentQuestionIndex] = [index];
                    } else {
                        selectedIndexes.push(index);
                    }
                }

                // Update UI
                options.forEach(opt => opt.classList.remove('selected'));
                this.userAnswers[this.currentQuestionIndex].forEach(i => {
                    options[i].classList.add('selected');
                });

                // Enable next button
                const nextBtn = document.getElementById('quiz-next');
                if (nextBtn) {
                    nextBtn.disabled = this.userAnswers[this.currentQuestionIndex].length === 0;
                }
            });
        });

        // Add event listener to next button
        const nextBtn = document.getElementById('quiz-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!this.isReviewing) {
                    this.checkAnswer();
                } else {
                    this.nextQuestion();
                }
            });
        }
    },

    checkAnswer() {
        const question = this.data[this.currentWeek][this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex].sort();
        const correctAnswer = question.answer.sort();

        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);

        if (isCorrect) {
            this.score++;
        }

        // Show correct/incorrect status
        const options = document.querySelectorAll('.option');
        correctAnswer.forEach(i => {
            options[i].classList.add('correct');
        });

        if (!isCorrect) {
            userAnswer.forEach(i => {
                if (!correctAnswer.includes(i)) {
                    options[i].classList.add('incorrect');
                }
            });
        }

        this.isReviewing = true;
        this.renderQuestion();
    },

    nextQuestion() {
        this.currentQuestionIndex++;
        this.isReviewing = false;
        this.renderQuestion();
    },

    renderResults() {
        const container = document.getElementById('quiz-content');
        if (!container) return;

        const total = this.data[this.currentWeek].length;
        const percentage = Math.round((this.score / total) * 100);

        // Save progress
        window.app.updateProgress('quiz', this.currentWeek, {
            score: percentage
        });

        let feedback = '';
        if (percentage >= 90) {
            feedback = 'Отлично! Вы отлично знаете материал!';
        } else if (percentage >= 70) {
            feedback = 'Хорошо! Есть небольшие пробелы.';
        } else if (percentage >= 50) {
            feedback = 'Удовлетворительно. Рекомендуется повторить материал.';
        } else {
            feedback = 'Нужно больше практики. Повторите материал и попробуйте снова.';
        }

        const html = `
            <div class="quiz-results">
                <h3>Результаты теста</h3>
                <div class="score">${percentage}%</div>
                <p>Правильных ответов: ${this.score} из ${total}</p>
                <p style="margin-top: 1rem; color: var(--text-secondary);">${feedback}</p>

                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                    <button class="btn-primary" id="restart-quiz">
                        Пройти снова
                    </button>
                    <button class="btn-primary" id="review-answers">
                        Посмотреть ответы
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const restartBtn = document.getElementById('restart-quiz');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.loadWeek(this.currentWeek);
            });
        }

        const reviewBtn = document.getElementById('review-answers');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                this.reviewAnswers();
            });
        }
    },

    reviewAnswers() {
        const container = document.getElementById('quiz-content');
        if (!container) return;

        const questions = this.data[this.currentWeek];

        let html = '<div class="quiz-container"><h3 style="text-align: center; margin-bottom: 2rem;">Разбор ответов</h3>';

        questions.forEach((question, qIndex) => {
            const userAnswer = this.userAnswers[qIndex] || [];
            const correctAnswer = question.answer;
            const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());

            html += `
                <div class="question-card" style="margin-bottom: 2rem;">
                    <div class="question-text">
                        ${qIndex + 1}. ${question.question}
                        <span style="margin-left: 1rem; color: ${isCorrect ? 'var(--success)' : 'var(--error)'}">
                            ${isCorrect ? '✓' : '✗'}
                        </span>
                    </div>
                    <div class="options">
                        ${question.options.map((option, oIndex) => {
                            let className = 'option';
                            if (correctAnswer.includes(oIndex)) {
                                className += ' correct';
                            } else if (userAnswer.includes(oIndex)) {
                                className += ' incorrect';
                            }
                            return `<div class="${className}">${option}</div>`;
                        }).join('')}
                    </div>
                    <div class="explanation">
                        <strong>Объяснение:</strong> ${question.explanation}
                    </div>
                </div>
            `;
        });

        html += `
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn-primary" id="back-to-results">Назад к результатам</button>
            </div>
        </div>`;

        container.innerHTML = html;

        const backBtn = document.getElementById('back-to-results');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.renderResults();
            });
        }
    }
};
