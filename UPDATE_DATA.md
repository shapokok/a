# Как обновить данные на сайте

## Проблема
Сайт использует встроенный файл `data.js` для работы через `file://` протокол (при прямом открытии index.html).
Когда вы меняете JSON файлы, изменения не отражаются автоматически.

## Решение

### Шаг 1: Отредактируйте JSON файлы
Измените нужные данные в:
- `data/cheatsheets.json` — шпоры
- `data/flashcards.json` — карточки
- `data/questions.json` — вопросы

### Шаг 2: Пересоберите data.js
Запустите скрипт:
```bash
./rebuild-data.sh
```

Или вручную:
```bash
cd /home/user/a
cat > data.js << 'EOF'
// Data for Psychology of Management Exam Prep
window.EXAM_DATA = {
  cheatsheets:
EOF
cat data/cheatsheets.json >> data.js
echo "," >> data.js
echo "  flashcards:" >> data.js
cat data/flashcards.json >> data.js
echo "," >> data.js
echo "  questions:" >> data.js
cat data/questions.json >> data.js
echo "" >> data.js
echo "};" >> data.js
```

### Шаг 3: Обновите страницу
- Откройте `index.html` в браузере
- Нажмите **Ctrl+Shift+R** (жесткая перезагрузка)
- Или **Ctrl+F5**

## Альтернатива: Использовать локальный сервер

Если запустить локальный сервер, сайт будет читать JSON напрямую:

```bash
python -m http.server 8000
# Откройте http://localhost:8000
```

В этом режиме изменения в JSON применяются сразу после перезагрузки страницы (F5).

## Быстрая команда

После изменения JSON:
```bash
./rebuild-data.sh && echo "✅ Готово! Обновите страницу в браузере."
```
