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

const levels = [
  { name: "Enchanted Forest", color: "#00ff88", enemyColor: "#008855", bossColor: "#22ff88" },
  { name: "Dark Grove", color: "#44ff44", enemyColor: "#228822", bossColor: "#55ff55" },
  { name: "Ruined Village", color: "#999999", enemyColor: "#555555", bossColor: "#bbbbbb" },
  { name: "Castle Walls", color: "#4444ff", enemyColor: "#2222aa", bossColor: "#7777ff" },
  { name: "Castle Halls", color: "#8844ff", enemyColor: "#5522aa", bossColor: "#aa77ff" },
  { name: "Catacombs", color: "#ff4444", enemyColor: "#aa2222", bossColor: "#ff7777" },
  { name: "Crystal Cave", color: "#44ffff", enemyColor: "#22aaaa", bossColor: "#77ffff" },
  { name: "Infernal Volcano", color: "#ff5500", enemyColor: "#cc2200", bossColor: "#ff8800" },
  { name: "Arcane Tower", color: "#ff00ff", enemyColor: "#aa00aa", bossColor: "#ff55ff" },
  { name: "Demonic Throne", color: "#ff0000", enemyColor: "#aa0000", bossColor: "#ff3333" }
];

let currentLevelIndex = 0;
let playerRunes = 0;
let game;

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
    this.speed = 5;
  }

  update(keys) {
    if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
    if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
    if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
    if (keys['ArrowDown'] || keys['s']) this.y += this.speed;

    this.x = Math.max(0, Math.min(WIDTH - this.w, this.x));
    this.y = Math.max(0, Math.min(HEIGHT - this.h, this.y));
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
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

class Projectile {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 5;
    this.color = "#ff0";
    this.speed = speed;
    this.active = true;
  }

  update() {
    this.x += this.speed;
    if (this.x > WIDTH) this.active = false;
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
    this.projectiles = [];
    this.boss = new Boss(levels[currentLevelIndex].bossColor);
    this.keys = {};
    this.spawnCooldown = 0;
    this.score = 0;
    this.gameOver = false;
  }

  spawnEnemy() {
    let x = Math.random() * (WIDTH - 30);
    let y = Math.random() * (HEIGHT - 30);
    this.enemies.push(new Enemy(x, y, 1 + Math.random() * 1.5, levels[currentLevelIndex].enemyColor));
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

    for (let enemy of this.enemies) {
      enemy.update(this.player);

      if (this.checkCollision(this.player, enemy)) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          showGameOver();
        }
      }
    }

    for (let projectile of this.projectiles) {
      projectile.update();

      for (let enemy of this.enemies) {
        if (this.checkCollision(projectile, enemy)) {
          enemy.alive = false;
          projectile.active = false;
          this.score += 100;
          playerRunes += 10;
        }
      }

      if (this.checkCollision(projectile, this.boss)) {
        this.boss.hp -= 1;
        projectile.active = false;
        if (this.boss.hp <= 0) {
          this.gameOver = true;
          setTimeout(() => showWin(), 500);
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);
    this.projectiles = this.projectiles.filter(p => p.active);

    this.drawHUD();
    this.player.draw();
    for (let enemy of this.enemies) enemy.draw();
    for (let projectile of this.projectiles) projectile.draw();
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

document.addEventListener('keydown', e => {
  if (game) game.keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (game) game.keys[e.key] = false;
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 0 && game) {
    const px = game.player.x + game.player.w;
    const py = game.player.y + game.player.h / 2 - 2;
    game.projectiles.push(new Projectile(px, py, 8));
  }
});

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
