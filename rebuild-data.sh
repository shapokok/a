#!/bin/bash
# Rebuild data.js from JSON files

echo "Rebuilding data.js from JSON files..."

cat > data.js << 'EOF'
// Data for Psychology of Management Exam Prep
window.EXAM_DATA = {
  cheatsheets:
EOF

cat data/cheatsheets.json >> data.js

cat >> data.js << 'EOF'
,
  flashcards:
EOF

cat data/flashcards.json >> data.js

cat >> data.js << 'EOF'
,
  questions:
EOF

cat data/questions.json >> data.js

cat >> data.js << 'EOF'

};
EOF

echo "✅ data.js successfully rebuilt!"
echo "Now reload the website to see changes."
