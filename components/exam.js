// Exam Mode Component
window.ExamComponent = {
    data: null,
    examQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    isStarted: false,
    isFinished: false,
    timeLimit: 40 * 60, // 40 minutes in seconds
    timeRemaining: 40 * 60,
    timerInterval: null,

    render(data) {
        this.data = data;
        this.renderStartScreen();
    },

    renderStartScreen() {
        const container = document.getElementById('exam-content');
        if (!container) return;

        const html = `
            <div class="exam-info">
                <h3>⚠️ Экзаменационный режим</h3>
                <p>Это финальный тест по всему курсу</p>
            </div>

            <div class="quiz-results">
                <h3>Правила экзамена</h3>
                <ul style="text-align: left; max-width: 600px; margin: 2rem auto;">
                    <li style="margin-bottom: 1rem;">30 случайных вопросов из всех 10 недель</li>
                    <li style="margin-bottom: 1rem;">Ограничение по времени: 40 минут</li>
                    <li style="margin-bottom: 1rem;">Нельзя вернуться к предыдущим вопросам</li>
                    <li style="margin-bottom: 1rem;">После завершения вы увидите подробный разбор</li>
                </ul>

                <button class="btn-primary" id="start-exam" style="margin-top: 2rem; padding: 1rem 3rem; font-size: 1.1rem;">
                    Начать экзамен
                </button>
            </div>
        `;

        container.innerHTML = html;

        const startBtn = document.getElementById('start-exam');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startExam());
        }
    },

    startExam() {
        this.isStarted = true;
        this.isFinished = false;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.timeRemaining = this.timeLimit;

        // Generate random questions
        this.examQuestions = this.generateRandomQuestions(30);

        // Start timer
        this.startTimer();

        // Render first question
        this.renderQuestion();
    },

    generateRandomQuestions(count) {
        const allQuestions = [];

        // Collect all questions from all weeks
        Object.entries(this.data).forEach(([week, questions]) => {
            questions.forEach(q => {
                allQuestions.push({ ...q, week });
            });
        });

        // Shuffle and select
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.finishExam();
            }

            this.updateTimerDisplay();
        }, 1000);
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timerElement = document.getElementById('exam-timer');

        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Change color when time is running out
            if (this.timeRemaining < 5 * 60) {
                timerElement.style.color = 'var(--error)';
            }
        }
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    renderQuestion() {
        const container = document.getElementById('exam-content');
        if (!container) return;

        if (this.currentQuestionIndex >= this.examQuestions.length) {
            this.finishExam();
            return;
        }

        const question = this.examQuestions[this.currentQuestionIndex];
        const progress = `Вопрос ${this.currentQuestionIndex + 1} из ${this.examQuestions.length}`;

        const html = `
            <div class="timer" id="exam-timer">${Math.floor(this.timeRemaining / 60)}:${(this.timeRemaining % 60).toString().padStart(2, '0')}</div>

            <div class="quiz-container">
                <p style="color: var(--text-secondary); text-align: center; margin-bottom: 2rem;">
                    ${progress}
                </p>

                <div class="question-card">
                    <div class="question-text">${question.question}</div>
                    <div class="options" id="exam-options">
                        ${question.options.map((option, index) => `
                            <div class="option" data-index="${index}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="quiz-controls">
                    <button class="btn-primary" id="exam-next" disabled>
                        ${this.currentQuestionIndex === this.examQuestions.length - 1 ? 'Завершить экзамен' : 'Следующий вопрос'}
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners to options
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));

                // Store answer
                if (question.answer.length === 1) {
                    // Single answer
                    this.userAnswers[this.currentQuestionIndex] = [index];
                    options.forEach(opt => opt.classList.remove('selected'));
                    e.target.classList.add('selected');
                } else {
                    // Multiple answers
                    if (!this.userAnswers[this.currentQuestionIndex]) {
                        this.userAnswers[this.currentQuestionIndex] = [];
                    }

                    const selectedIndexes = this.userAnswers[this.currentQuestionIndex];
                    const idx = selectedIndexes.indexOf(index);

                    if (idx > -1) {
                        selectedIndexes.splice(idx, 1);
                        e.target.classList.remove('selected');
                    } else {
                        selectedIndexes.push(index);
                        e.target.classList.add('selected');
                    }
                }

                // Enable next button
                const nextBtn = document.getElementById('exam-next');
                if (nextBtn && this.userAnswers[this.currentQuestionIndex]?.length > 0) {
                    nextBtn.disabled = false;
                }
            });
        });

        // Add event listener to next button
        const nextBtn = document.getElementById('exam-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentQuestionIndex++;
                this.renderQuestion();
            });
        }
    },

    finishExam() {
        this.stopTimer();
        this.isFinished = true;
        this.calculateResults();
    },

    calculateResults() {
        let correctCount = 0;
        const weakWeeks = {};

        this.examQuestions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index] || [];
            const correctAnswer = question.answer;
            const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());

            if (isCorrect) {
                correctCount++;
            } else {
                // Track weak weeks
                const week = question.week;
                weakWeeks[week] = (weakWeeks[week] || 0) + 1;
            }
        });

        const percentage = Math.round((correctCount / this.examQuestions.length) * 100);

        this.renderResults(correctCount, percentage, weakWeeks);
    },

    renderResults(correctCount, percentage, weakWeeks) {
        const container = document.getElementById('exam-content');
        if (!container) return;

        let grade = '';
        let feedback = '';

        if (percentage >= 90) {
            grade = 'A';
            feedback = 'Отлично! Вы полностью готовы к экзамену!';
        } else if (percentage >= 80) {
            grade = 'B';
            feedback = 'Хорошо! Небольшие пробелы, но в целом вы готовы.';
        } else if (percentage >= 70) {
            grade = 'C';
            feedback = 'Удовлетворительно. Рекомендуем повторить слабые темы.';
        } else if (percentage >= 60) {
            grade = 'D';
            feedback = 'Нужна дополнительная подготовка.';
        } else {
            grade = 'F';
            feedback = 'Требуется серьезная подготовка. Повторите весь материал.';
        }

        // Format weak weeks
        let weakWeeksHtml = '';
        if (Object.keys(weakWeeks).length > 0) {
            weakWeeksHtml = '<div style="margin-top: 2rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">';
            weakWeeksHtml += '<h4>Рекомендуем повторить:</h4><ul>';

            const sortedWeeks = Object.entries(weakWeeks).sort((a, b) => b[1] - a[1]);
            sortedWeeks.forEach(([week, count]) => {
                const weekNum = week.replace('week', 'Week ');
                weakWeeksHtml += `<li>${weekNum}: ${count} ошибок</li>`;
            });

            weakWeeksHtml += '</ul></div>';
        }

        const timeSpent = this.timeLimit - this.timeRemaining;
        const minutesSpent = Math.floor(timeSpent / 60);
        const secondsSpent = timeSpent % 60;

        const html = `
            <div class="quiz-results">
                <h3>Экзамен завершен!</h3>
                <div class="score" style="font-size: 4rem;">${grade}</div>
                <div class="score">${percentage}%</div>
                <p>Правильных ответов: ${correctCount} из ${this.examQuestions.length}</p>
                <p style="color: var(--text-secondary);">Время: ${minutesSpent}:${secondsSpent.toString().padStart(2, '0')}</p>
                <p style="margin-top: 1rem; font-size: 1.1rem;">${feedback}</p>

                ${weakWeeksHtml}

                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                    <button class="btn-primary" id="review-exam">
                        Посмотреть разбор
                    </button>
                    <button class="btn-primary" id="restart-exam">
                        Пройти снова
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const reviewBtn = document.getElementById('review-exam');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.reviewExam());
        }

        const restartBtn = document.getElementById('restart-exam');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.renderStartScreen());
        }
    },

    reviewExam() {
        const container = document.getElementById('exam-content');
        if (!container) return;

        let html = '<div class="quiz-container"><h3 style="text-align: center; margin-bottom: 2rem;">Разбор экзамена</h3>';

        this.examQuestions.forEach((question, qIndex) => {
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
                <button class="btn-primary" id="back-to-exam-results">Назад к результатам</button>
            </div>
        </div>`;

        container.innerHTML = html;

        const backBtn = document.getElementById('back-to-exam-results');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const correctCount = this.examQuestions.filter((q, i) => {
                    const userAnswer = this.userAnswers[i] || [];
                    const correctAnswer = q.answer;
                    return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());
                }).length;

                const percentage = Math.round((correctCount / this.examQuestions.length) * 100);
                const weakWeeks = {};

                this.examQuestions.forEach((question, index) => {
                    const userAnswer = this.userAnswers[index] || [];
                    const correctAnswer = question.answer;
                    const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());

                    if (!isCorrect) {
                        const week = question.week;
                        weakWeeks[week] = (weakWeeks[week] || 0) + 1;
                    }
                });

                this.renderResults(correctCount, percentage, weakWeeks);
            });
        }
    }
};
