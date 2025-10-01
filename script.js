// --- ELEMENTOS DO HTML ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');

// --- CONFIGURAÇÕES DO JOGO ---
const GRID_SIZE = 20;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// --- VARIÁVEIS DE ESTADO ---
let snake, food, specialFood, direction, score, highScore, gameSpeed, gameInterval;
let specialFoodActive = false;
let specialFoodTimer;
let isGameOver;

// --- FUNÇÕES DE INICIALIZAÇÃO ---

// Carrega o recorde salvo no navegador
function loadHighScore() {
    const savedHighScore = localStorage.getItem('snakeHighScore') || 0;
    highScore = parseInt(savedHighScore);
    highScoreEl.textContent = highScore;
}

// Inicia (ou reinicia) o jogo
function startGame() {
    // Estado inicial da cobra
    snake = [{ x: 10, y: 10 }];
    // Posição inicial da comida
    food = generateFoodPosition();
    // Limpa qualquer comida especial
    specialFood = null;
    specialFoodActive = false;
    clearTimeout(specialFoodTimer);

    direction = 'right';
    score = 0;
    gameSpeed = 200; // Velocidade inicial (maior = mais lento)
    isGameOver = false;

    // Atualiza a interface
    currentScoreEl.textContent = score;
    gameOverScreen.classList.add('hidden');

    // Inicia o loop do jogo
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// --- LÓGICA DAS COMIDAS ---

// Gera uma posição aleatória para a comida que não esteja na cobra
function generateFoodPosition() {
    let newPosition;
    do {
        newPosition = {
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
        };
    } while (snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y));
    return newPosition;
}

// Gera uma comida especial (vermelha ou laranja)
function spawnSpecialFood() {
    if (specialFoodActive) return;

    specialFoodActive = true;
    const type = Math.random() < 0.5 ? 'negative' : 'positive'; // 50% de chance para cada tipo
    specialFood = {
        ...generateFoodPosition(),
        type: type,
        color: type === 'negative' ? '#e74c3c' : '#f39c12' // Vermelho ou Laranja
    };

    // Define um timer de 5 segundos para a comida especial desaparecer
    specialFoodTimer = setTimeout(() => {
        specialFood = null;
        specialFoodActive = false;
    }, 5000);
}

// --- LÓGICA DO JOGO ---

function updateGameSpeed() {
    // A velocidade aumenta a cada 4 pontos (o valor diminui)
    const speedDecrease = Math.floor(score / 4) * 10;
    gameSpeed = Math.max(200 - speedDecrease, 60); // Define uma velocidade máxima (60ms)

    // Reinicia o intervalo com a nova velocidade
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
}

function update() {
    const head = { ...snake[0] };

    // Move a cabeça da cobra
    if (direction === 'right') head.x++;
    if (direction === 'left') head.x--;
    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;

    // Verifica colisão com as paredes
    if (head.x < 0 || head.x * GRID_SIZE >= CANVAS_WIDTH || head.y < 0 || head.y * GRID_SIZE >= CANVAS_HEIGHT) {
        return endGame();
    }
    // Verifica colisão com o próprio corpo
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return endGame();
    }
    
    snake.unshift(head); // Adiciona a nova cabeça

    let ateFood = false;

    // Verifica se comeu a comida normal
    if (head.x === food.x && head.y === food.y) {
        ateFood = true;
        score++;
        food = generateFoodPosition();
        updateGameSpeed();

        // Chance de 25% de gerar uma comida especial após comer a normal
        if (Math.random() < 0.25) {
            spawnSpecialFood();
        }
    }
    // Verifica se comeu a comida especial
    else if (specialFoodActive && head.x === specialFood.x && head.y === specialFood.y) {
        ateFood = true;
        if (specialFood.type === 'negative') {
            score = Math.max(0, score - 1); // Reduz 1 ponto
            if (snake.length > 1) snake.pop(); // Reduz o tamanho
        } else { // 'positive'
            score += 4;
            // Adiciona 3 segmentos extras (1 já foi adicionado pelo movimento)
            for(let i=0; i<3; i++) snake.push({}); 
        }
        specialFood = null;
        specialFoodActive = false;
        clearTimeout(specialFoodTimer);
        updateGameSpeed();
    }

    // Se não comeu nenhuma comida, remove o último segmento da cauda
    if (!ateFood) {
        snake.pop();
    }
    
    currentScoreEl.textContent = score;
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    
    // Salva o novo recorde se necessário
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// --- RENDERIZAÇÃO ---

function draw() {
    // Limpa o canvas com a cor de fundo da arena
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Desenha o corpo da cobra
    ctx.fillStyle = '#48cae4'; // Ciano para o corpo
    // Começamos do segundo segmento, pois a cabeça será desenhada depois com o rosto
    for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // Desenha a cabeça da cobra e o rosto
    const head = snake[0];
    const headX = head.x * GRID_SIZE;
    const headY = head.y * GRID_SIZE;
    
    // 1. Desenha o quadrado da cabeça
    ctx.fillStyle = '#ade8f4'; // Ciano claro para a cabeça
    ctx.fillRect(headX, headY, GRID_SIZE, GRID_SIZE);

    // 2. Prepara para desenhar o rosto
    ctx.fillStyle = '#161b22'; // Cor do fundo para "recortar" o rosto

    // 3. Desenha o rosto virado para a direção correta
    switch (direction) {
        case 'up':
            // Olhos na parte de baixo
            ctx.fillRect(headX + 4, headY + 12, 4, 4); // Olho esquerdo
            ctx.fillRect(headX + 12, headY + 12, 4, 4); // Olho direito
            // Boca na parte de cima
            ctx.fillRect(headX + 4, headY + 4, 12, 4); // Boca
            break;

        case 'down':
            // Olhos na parte de cima
            ctx.fillRect(headX + 4, headY + 4, 4, 4); // Olho esquerdo
            ctx.fillRect(headX + 12, headY + 4, 4, 4); // Olho direito
            // Boca na parte de baixo
            ctx.fillRect(headX + 4, headY + 12, 12, 4); // Boca
            break;

        case 'left':
            // Olhos na parte direita
            ctx.fillRect(headX + 12, headY + 4, 4, 4); // Olho de cima
            ctx.fillRect(headX + 12, headY + 12, 4, 4); // Olho de baixo
            // Boca na parte esquerda (linha vertical)
            ctx.fillRect(headX + 4, headY + 4, 4, 12); // Boca
            break;

        case 'right':
            // Olhos na parte esquerda
            ctx.fillRect(headX + 4, headY + 4, 4, 4); // Olho de cima
            ctx.fillRect(headX + 4, headY + 12, 4, 4); // Olho de baixo
            // Boca na parte direita (linha vertical)
            ctx.fillRect(headX + 12, headY + 4, 4, 12); // Boca
            break;
    }

    // --- Continua desenhando as comidas como antes ---
    
    // Desenha a comida normal
    ctx.fillStyle = '#ffafcc'; // Rosa Neon
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // Desenha a comida especial (se existir)
    if (specialFoodActive && specialFood) {
        const specialFoodColor = specialFood.type === 'negative' ? '#f72585' : '#ffea00'; // Rosa forte ou Amarelo Neon
        ctx.fillStyle = specialFoodColor;
        ctx.fillRect(specialFood.x * GRID_SIZE, specialFood.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
}

// --- CONTROLES ---

function handleDirectionChange(newDirection) {
    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    if (newDirection === 'up' && !goingDown) direction = 'up';
    if (newDirection === 'down' && !goingUp) direction = 'down';
    if (newDirection === 'left' && !goingRight) direction = 'left';
    if (newDirection === 'right' && !goingLeft) direction = 'right';
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') handleDirectionChange('up');
    if (e.key === 'ArrowDown') handleDirectionChange('down');
    if (e.key === 'ArrowLeft') handleDirectionChange('left');
    if (e.key === 'ArrowRight') handleDirectionChange('right');
});

document.getElementById('btn-up').addEventListener('click', () => handleDirectionChange('up'));
document.getElementById('btn-down').addEventListener('click', () => handleDirectionChange('down'));
document.getElementById('btn-left').addEventListener('click', () => handleDirectionChange('left'));
document.getElementById('btn-right').addEventListener('click', () => handleDirectionChange('right'));
document.getElementById('restart-button').addEventListener('click', startGame);

// --- INÍCIO DO JOGO ---
loadHighScore();
startGame();