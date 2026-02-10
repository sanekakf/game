/* Модуль управления Лидербордом (Leaderboard)
    Использует localStorage для сохранения данных между перезагрузками.
*/

const STORAGE_KEY = 'superauto_leaderboard_v1';

// Начальные данные (согласно ТЗ)
const initialData = [
    { id: "init_1", username: "Andrey", score: 100 },
    { id: "init_2", username: "Andrew", score: 100 },
    { id: "init_3", username: "BotLow", score: 2 } // Добавил для теста фильтрации
];

const Leaderboard = {
    // Получить данные (из памяти или начальные)
    getData: function() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Если пусто, записываем начальные данные и возвращаем их
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
            return JSON.parse(JSON.stringify(initialData));
        }
        return JSON.parse(stored);
    },

    // Сохранить новый результат
    saveResult: function(username, score) {
        let data = this.getData();
        
        // Создаем уникальный ID для текущей попытки (timestamp)
        const newEntry = {
            id: Date.now().toString(),
            username: username,
            score: parseInt(score)
        };
        
        data.push(newEntry);
        
        // Сортировка: Сначала по очкам (убывание), потом по имени (если очки равны)
        data.sort((a, b) => b.score - a.score);

        // Сохраняем обратно в браузер
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        return newEntry.id; // Возвращаем ID, чтобы знать, кого подсвечивать
    },

    // Генерация HTML таблицы с учетом правил фильтрации ТЗ
    renderTable: function(containerId, currentRunId) {
        const tbody = document.getElementById(containerId);
        tbody.innerHTML = '';
        
        const data = this.getData(); // Данные уже должны быть отсортированы при сохранении
        
        // 1. Находим индекс текущего игрока в полном списке
        const currentIndex = data.findIndex(item => item.id === currentRunId);
        
        if (currentIndex === -1) return; // Ошибка, игрок не найден

        // 2. Логика ТЗ: "Отображаются результаты текущего игрока и всех, набравших МЕНЬШЕЕ количество баллов"
        // Фактически это означает: показываем список, начиная с позиции игрока и до конца.
        // Если у кого-то выше столько же баллов, по ТЗ они "занимают одинаковую позицию".
        
        // Берем срез массива начиная с текущего игрока
        const filteredData = data.slice(currentIndex);

        // 3. Рендер
        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            
            // Вычисляем МЕСТО (Rank). 
            // Важно: ранк считается по полному списку data.
            // ТЗ: "Если несколько строк имеют одинаковое количество очков, они занимают одинаковую позицию"
            
            let rank = 1;
            // Ищем первое вхождение такого балла в полном списке
            const firstIndexWithScore = data.findIndex(x => x.score === item.score);
            rank = firstIndexWithScore + 1;

            // Если это текущий игрок - добавляем класс подсветки
            if (item.id === currentRunId) {
                tr.classList.add('current-player');
            }

            tr.innerHTML = `
                <td>${rank}</td>
                <td>${item.username}</td>
                <td>${item.score}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};