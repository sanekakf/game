/* Основная логика игры */

// Конфигурация
const Config = {
    duration: 20,    // секунд
    spawnRate: 600,  // мс (частота появления)
    fallSpeed: 5,    // пикселей за кадр
    carSpeed: 10,    // скорость перемещения машины
    maxHealth: 5     // количество жизней
};

// Состояние
const State = {
    isPlaying: false,
    score: 0,
    health: Config.maxHealth,
    timeLeft: Config.duration,
    username: 'Player',
    gameLoopId: null,
    spawnInterval: null,
    timerInterval: null,
    carX: 0,
    objects: [] // массив падающих объектов {el: DOMNode, y: number, type: string}
};

// DOM элементы
const els = {
    screens: {
        start: document.getElementById('screen-start'),
        game: document.getElementById('screen-game'),
        ranking: document.getElementById('screen-ranking')
    },
    form: document.getElementById('login-form'),
    inputName: document.getElementById('username'),
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    hearts: document.getElementById('hearts-container'),
    playerName: document.getElementById('player-name-display'),
    gameArea: document.getElementById('game-area'),
    playerCar: document.getElementById('player'),
    btnRestart: document.getElementById('btn-restart')
};

// --- УПРАВЛЕНИЕ ЭКРАНАМИ ---
function switchScreen(name) {
    // Скрываем все
    Object.values(els.screens).forEach(screen => {
        screen.classList.remove('screen-active');
        screen.style.display = 'none';
    });
    
    // Показываем нужный
    const target = els.screens[name];
    target.classList.add('screen-active');
    
    // Для игрового экрана нужен display: block, а не flex (чтобы позиционирование работало)
    if (name === 'game') {
        target.style.display = 'block';
    } else {
        target.style.display = 'flex';
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ИГРЫ ---
els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.inputName.value.trim();
    if (name) {
        State.username = name;
        startGame();
    }
});

els.btnRestart.addEventListener('click', () => {
    switchScreen('start');
});

function startGame() {
    // Сброс переменных
    State.score = 0;
    State.health = Config.maxHealth;
    State.timeLeft = Config.duration;
    State.objects = [];
    State.isPlaying = true;

    // Очистка поля от старых объектов
    document.querySelectorAll('.game-object').forEach(el => el.remove());

    // Установка UI
    els.playerName.textContent = `Игрок: ${State.username}`;
    updateHUD();
    
    // Позиция машины
    const areaWidth = els.gameArea.clientWidth;
    State.carX = areaWidth / 2 - 40;
    updateCarPosition();

    switchScreen('game');

    // Запуск таймеров
    State.timerInterval = setInterval(tickTimer, 1000);
    State.spawnInterval = setInterval(spawnObject, Config.spawnRate);
    
    // Запуск цикла анимации
    requestAnimationFrame(gameLoop);
}

// --- ИГРОВОЙ ЦИКЛ ---
function gameLoop() {
    if (!State.isPlaying) return;

    // 1. Движение объектов вниз
    moveObjects();

    // 2. Проверка коллизий
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    els.score.textContent = State.score;
    // Форматирование времени 00:XX
    const sec = State.timeLeft < 10 ? '0' + State.timeLeft : State.timeLeft;
    els.timer.textContent = `00:${sec}`;

    // Рендер сердец
    els.hearts.innerHTML = '';
    for (let i = 0; i < State.health; i++) {
        const img = document.createElement('img');
        img.src = 'heart.png';
        els.hearts.appendChild(img);
    }
}

function tickTimer() {
    State.timeLeft--;
    updateHUD();
    if (State.timeLeft <= 0) {
        finishGame();
    }
}

// --- ОБЪЕКТЫ (Спавн и движение) ---
function spawnObject() {
    const obj = document.createElement('div');
    obj.classList.add('game-object');

    // Рандом: 30% Инструмент, 70% Выбоина
    const isTool = Math.random() > 0.7;
    const type = isTool ? 'tool' : 'pothole';
    
    obj.classList.add(isTool ? 'obj-tool' : 'obj-pothole');
    
    // Позиция X (в пределах ширины поля)
    const maxX = els.gameArea.clientWidth - 60;
    const randomX = Math.floor(Math.random() * maxX);
    
    obj.style.left = randomX + 'px';
    obj.style.top = '-60px'; // Старт за экраном

    els.gameArea.appendChild(obj);

    State.objects.push({
        el: obj,
        y: -60,
        type: type,
        speed: Config.fallSpeed + Math.random() * 2 // Немного разная скорость
    });
}

function moveObjects() {
    State.objects.forEach((obj, index) => {
        obj.y += obj.speed;
        obj.el.style.top = obj.y + 'px';

        // Удаление, если улетел за экран
        if (obj.y > window.innerHeight) {
            obj.el.remove();
            State.objects.splice(index, 1);
        }
    });
}

// --- УПРАВЛЕНИЕ МАШИНОЙ ---
document.addEventListener('keydown', (e) => {
    if (!State.isPlaying) return;
    const areaWidth = els.gameArea.clientWidth;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        State.carX -= Config.carSpeed * 2;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        State.carX += Config.carSpeed * 2;
    }

    // Ограничение границ
    if (State.carX < 0) State.carX = 0;
    if (State.carX > areaWidth - 80) State.carX = areaWidth - 80;

    updateCarPosition();
});

// Управление мышью
els.gameArea.addEventListener('mousemove', (e) => {
    if (!State.isPlaying) return;
    const rect = els.gameArea.getBoundingClientRect();
    let newX = e.clientX - rect.left - 40; // Центрируем по курсору

    const areaWidth = els.gameArea.clientWidth;
    if (newX < 0) newX = 0;
    if (newX > areaWidth - 80) newX = areaWidth - 80;

    State.carX = newX;
    updateCarPosition();
});

function updateCarPosition() {
    els.playerCar.style.left = State.carX + 'px';
}

// --- СТОЛКНОВЕНИЯ ---
function checkCollisions() {
    const carRect = els.playerCar.getBoundingClientRect();

    State.objects.forEach((obj, index) => {
        const objRect = obj.el.getBoundingClientRect();

        // Проверка пересечения прямоугольников
        if (!(carRect.right < objRect.left || 
              carRect.left > objRect.right || 
              carRect.bottom < objRect.top || 
              carRect.top > objRect.bottom)) {
            
            // Столкновение произошло
            handleCollision(obj);
            
            // Удаляем объект
            obj.el.remove();
            State.objects.splice(index, 1);
        }
    });
}

function handleCollision(obj) {
    if (obj.type === 'tool') {
        State.score++;
    } else {
        State.health--;
    }
    updateHUD();

    if (State.health <= 0) {
        finishGame();
    }
}

// --- КОНЕЦ ИГРЫ ---
function finishGame() {
    State.isPlaying = false;
    clearInterval(State.timerInterval);
    clearInterval(State.spawnInterval);

    // Сохранение в Leaderboard
    // Вызываем метод из leaderboard.js
    const runId = Leaderboard.saveResult(State.username, State.score);

    // Показываем результат
    els.finalScore.textContent = State.score;
    
    // Рендерим таблицу
    Leaderboard.renderTable('ranking-body', runId);

    switchScreen('ranking');
}