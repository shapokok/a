// Cheat Sheet Component
window.CheatSheetComponent = {
    data: null,

    render(data) {
        this.data = data;
        const container = document.getElementById('cheatsheets-content');
        if (!container || !data) return;

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

        let html = '';

        Object.entries(data).forEach(([week, content], index) => {
            html += `
                <div class="week-section">
                    <h3>Week ${index + 1}: ${content.title}</h3>
                    <ul>
                        ${content.points.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        container.innerHTML = html;
    }
};
