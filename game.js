const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');
const winScreen = document.getElementById('winScreen');
const winScore = document.getElementById('winScore');
const restartWinBtn = document.getElementById('restartWinBtn');

let currentLevelIndex = 0;
let playerRunes = 0;
let game;

const levels = [
  { name: "Enchanted Forest", color: "#228b22", enemyColor: "#006400", bossColor: "#2e8b57" },
  { name: "Dark Grove", color: "#2f4f4f", enemyColor: "#556b2f", bossColor: "#6b8e23" },
  { name: "Ruined Village", color: "#8b4513", enemyColor: "#a0522d", bossColor: "#cd853f" },
  { name: "Castle Walls", color: "#4682b4", enemyColor: "#1e90ff", bossColor: "#4169e1" },
  { name: "Castle Halls", color: "#6a5acd", enemyColor: "#7b68ee", bossColor: "#9370db" },
  { name: "Catacombs", color: "#708090", enemyColor: "#2f4f4f", bossColor: "#696969" },
  { name: "Crystal Cave", color: "#20b2aa", enemyColor: "#00ced1", bossColor: "#40e0d0" },
  { name: "Infernal Volcano", color: "#b22222", enemyColor: "#ff4500", bossColor: "#ff6347" },
  { name: "Arcane Tower", color: "#800080", enemyColor: "#8a2be2", bossColor: "#9400d3" },
  { name: "Demonic Throne", color: "#8b0000", enemyColor: "#b22222", bossColor: "#ff0000" }
];

class Background {
  constructor(color) {
    this.color = color;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

class Player {
  constructor() {
    this.w = 28;
    this.h = 40;
    this.x = WIDTH / 2 - this.w / 2;
    this.y = HEIGHT / 2 - this.h / 2;
    this.color = "#aaffaa";
    this.lives = 3;
    this.speed = 4;
    this.attacking = false;
    this.attackCooldown = 0;
  }

  update(keys) {
    if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
    if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
    if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
    if (keys['ArrowDown'] || keys['s']) this.y += this.speed;

    this.x = Math.max(0, Math.min(WIDTH - this.w, this.x));
    this.y = Math.max(0, Math.min(HEIGHT - this.h, this.y));

    if (keys['j'] && this.attackCooldown === 0) {
      this.attacking = true;
      this.attackCooldown = 15;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
      if (this.attackCooldown === 0) {
        this.attacking = false;
      }
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    if (this.attacking) {
      ctx.fillStyle = "#ff0";
      ctx.fillRect(this.x + this.w / 2 - 5, this.y - 10, 10, 10);
    }
  }

  hit() {
    this.lives--;
  }
}

class Enemy {
  constructor(x, y, speed, color) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.color = color;
    this.speed = speed;
    this.alive = true;
  }

  update(player) {
    if (this.x < player.x) this.x += this.speed;
    if (this.x > player.x) this.x -= this.speed;
    if (this.y < player.y) this.y += this.speed;
    if (this.y > player.y) this.y -= this.speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Boss {
  constructor(color) {
    this.x = WIDTH / 2 - 60;
    this.y = HEIGHT / 2 - 60;
    this.w = 120;
    this.h = 120;
    this.color = color;
    this.hp = 100;
    this.phase = 1;
  }

  update() {
    this.x += Math.sin(Date.now() / 500) * 1.5;
    this.y += Math.cos(Date.now() / 700) * 1.5;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Game {
  constructor() {
    this.bg = new Background(levels[currentLevelIndex].color);
    this.player = new Player();
    this.enemies = [];
    this.boss = new Boss(levels[currentLevelIndex].bossColor);
    this.keys = {};
    this.spawnCooldown = 0;
    this.bossSpawnCooldown = 300;
    this.score = 0;
    this.gameOver = false;
  }

  spawnEnemy() {
    let x = Math.random() * (WIDTH - 30);
    let y = Math.random() * (HEIGHT - 30);
    let speed = 1 + Math.random() * 1.5;
    this.enemies.push(new Enemy(x, y, speed, levels[currentLevelIndex].enemyColor));
  }

  update() {
    if (this.gameOver) return;

    this.bg.draw();
    this.player.update(this.keys);
    this.boss.update();

    if (this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 100;
    } else {
      this.spawnCooldown--;
    }

    if (this.bossSpawnCooldown <= 0) {
      this.spawnEnemy();
      this.bossSpawnCooldown = 300;
    } else {
      this.bossSpawnCooldown--;
    }

    for (let enemy of this.enemies) {
      enemy.update(this.player);

      if (this.checkCollision(this.player, enemy)) {
        if (this.player.attacking) {
          enemy.alive = false;
          this.score += 100;
          playerRunes += 10;
        } else {
          this.player.hit();
          if (this.player.lives <= 0) {
            this.gameOver = true;
            showGameOver();
          }
        }
      }
    }

    if (this.checkCollision(this.player, this.boss) && this.player.attacking) {
      this.boss.hp -= 1;
      if (this.boss.hp <= 0) {
        this.gameOver = true;
        setTimeout(() => showWin(), 500);
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);

    this.drawHUD();
    this.player.draw();
    for (let enemy of this.enemies) enemy.draw();
    this.boss.draw();
  }

  checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 25);
    ctx.fillText(`Runes: ${playerRunes}`, 10, 45);
    ctx.fillText(`Zone: ${levels[currentLevelIndex].name}`, 10, 65);
    ctx.fillText(`Boss HP: ${Math.max(0, Math.floor(this.boss.hp))}`, WIDTH - 160, 25);
  }
}

function startGame() {
  game = new Game();
  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  winScreen.style.display = 'none';
  canvas.style.display = 'block';
  requestAnimationFrame(gameLoop);
}

function showGameOver() {
  finalScore.textContent = `Runes collected: ${playerRunes}`;
  gameOverScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showWin() {
  winScore.textContent = `Total runes: ${playerRunes}`;
  winScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function gameLoop() {
  if (game) {
    game.update();
    if (!game.gameOver) {
      requestAnimationFrame(gameLoop);
    }
  }
}

document.addEventListener('keydown', e => {
  if (game) game.keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (game) game.keys[e.key] = false;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  currentLevelIndex = 0;
  playerRunes = 0;
  startGame();
});
restartWinBtn.addEventListener('click', () => {
  currentLevelIndex = 0;
  playerRunes = 0;
  startGame();
});
