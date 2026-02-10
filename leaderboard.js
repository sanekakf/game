/* Модуль управления Лидербордом (Leaderboard)
    Использует localStorage для сохранения данных между перезагрузками.
*/

const STORAGE_KEY = 'superauto_leaderboard_v1';

const initialData = [
    { id: "init_1", username: "Andrey", score: 100 },
    { id: "init_2", username: "Andrew", score: 100 },
    { id: "init_3", username: "BotLow", score: 2 } // Добавил для теста фильтрации
];

const Leaderboard = {
    getData: function() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Если пусто, записываем начальные данные и возвращаем их
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
            return JSON.parse(JSON.stringify(initialData));
        }
        return JSON.parse(stored);
    },

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

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        return newEntry.id; // Возвращаем ID, чтобы знать, кого подсвечивать
    },

    renderTable: function(containerId, currentRunId) {
        const tbody = document.getElementById(containerId);
        tbody.innerHTML = '';
        
        const data = this.getData(); // Данные уже должны быть отсортированы при сохранении
        const currentIndex = data.findIndex(item => item.id === currentRunId);
        
        if (currentIndex === -1) return; // Ошибка, игрок не найден

        const filteredData = data.slice(currentIndex);

        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            
            
            let rank = 1;
            const firstIndexWithScore = data.findIndex(x => x.score === item.score);
            rank = firstIndexWithScore + 1;

            
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