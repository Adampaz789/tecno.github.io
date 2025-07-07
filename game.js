const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const transitionScreen = document.getElementById('transitionScreen');
const transitionText = document.getElementById('transitionText');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const shopScreen = document.getElementById('shopScreen');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const buyShieldBtn = document.getElementById('buyShieldBtn');
const buySwordBtn = document.getElementById('buySwordBtn');
const continueBtn = document.getElementById('continueBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');
const winScreen = document.getElementById('winScreen');
const winScore = document.getElementById('winScore');
const restartWinBtn = document.getElementById('restartWinBtn');

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

let currentLevelIndex = 0;
let playerRunes = 0;
let game;

class Background {
  constructor(color) {
    this.color = color;
    this.stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2,
      speed: 0.5 + Math.random()
    }));
  }

  update() {
    for (let star of this.stars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = WIDTH;
        star.y = Math.random() * HEIGHT;
      }
    }
  }

  draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = this.color;
    for (let star of this.stars) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }
        }
class Player {
  constructor() {
    this.w = 28;
    this.h = 40;
    this.x = 60;
    this.y = HEIGHT - this.h - 20;
    this.color = "#aaffaa";
    this.lives = 3;
    this.speed = 5;
    this.vy = 0;
    this.gravity = 1.2;
    this.jumpStrength = -18;
    this.onGround = true;
    this.attacking = false;
    this.attackCooldown = 0;
    this.shield = false;
    this.sword = false;
  }

  update(keys) {
    // Horizontal
    if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
    if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;

    // Límite horizontal
    this.x = Math.max(0, Math.min(WIDTH - this.w, this.x));

    // Gravedad
    this.y += this.vy;
    if (!this.onGround) this.vy += this.gravity;

    // Suelo
    if (this.y + this.h >= HEIGHT - 20) {
      this.y = HEIGHT - 20 - this.h;
      this.onGround = true;
      this.vy = 0;
    }

    // Saltar
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && this.onGround) {
      this.vy = this.jumpStrength;
      this.onGround = false;
    }

    // Ataque
    if (keys['j'] && this.attackCooldown === 0) {
      this.attacking = true;
      this.attackCooldown = 30;
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

    if (this.shield) {
      ctx.strokeStyle = "#00f";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6);
    }

    if (this.attacking || this.sword) {
      ctx.fillStyle = "#ff0";
      ctx.fillRect(this.x + this.w, this.y + this.h / 2 - 5, 15, 5);
    }
  }

  hit() {
    if (!this.shield) {
      this.lives--;
    } else {
      this.shield = false;
    }
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

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Boss {
  constructor(color) {
    this.x = WIDTH;
    this.y = HEIGHT - 150;
    this.w = 120;
    this.h = 120;
    this.color = color;
    this.hp = 60;
    this.speed = 1.5;
    this.direction = -1;
  }

  update() {
    this.x += this.speed * this.direction;
    if (this.x <= WIDTH - 300 || this.x >= WIDTH - 50) {
      this.direction *= -1;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.type = type;
    this.color = type === "shield" ? "#00f" : "#ff0";
    this.speed = 2;
    this.active = true;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.w < 0) this.active = false;
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
    this.items = [];
    this.boss = null;
    this.keys = {};
    this.bossAppeared = false;
    this.gameOver = false;
    this.spawnCooldown = 0;
    this.itemCooldown = 300;
    this.score = 0;
  }

  spawnEnemy() {
    let y = HEIGHT - 45;
    let speed = 3 + currentLevelIndex * 0.3;
    this.enemies.push(new Enemy(WIDTH, y, speed, levels[currentLevelIndex].enemyColor));
  }

  spawnItem() {
    let y = HEIGHT - 50;
    let type = Math.random() < 0.5 ? "shield" : "sword";
    this.items.push(new Item(WIDTH, y, type));
  }

  checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  update() {
    if (this.gameOver) return;

    this.bg.update();
    this.player.update(this.keys);

    if (!this.bossAppeared && this.score >= 1000) {
      this.boss = new Boss(levels[currentLevelIndex].bossColor);
      this.bossAppeared = true;
    }

    if (!this.bossAppeared && this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 80 - currentLevelIndex * 2;
    } else {
      this.spawnCooldown--;
    }

    if (this.itemCooldown <= 0) {
      this.spawnItem();
      this.itemCooldown = 500;
    } else {
      this.itemCooldown--;
    }

    for (let enemy of this.enemies) {
      enemy.update();
      if (this.checkCollision(this.player, enemy) && this.player.attacking) {
        enemy.alive = false;
        this.score += 100;
        playerRunes += 10;
      } else if (this.checkCollision(this.player, enemy) && !this.player.attacking) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          showGameOver();
        }
      }
    }

    for (let item of this.items) {
      item.update();
      if (item.active && this.checkCollision(this.player, item)) {
        if (item.type === "shield") {
          this.player.shield = true;
        } else if (item.type === "sword") {
          this.player.sword = true;
        }
        item.active = false;
      }
    }

    if (this.boss) {
      this.boss.update();
      if (this.checkCollision(this.player, this.boss) && this.player.attacking) {
        this.boss.hp -= 1;
      } else if (this.checkCollision(this.player, this.boss) && !this.player.attacking) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          showGameOver();
        }
      }

      if (this.boss.hp <= 0) {
        this.gameOver = true;
        setTimeout(() => showTransition(), 1000);
      }
    }

    this.enemies = this.enemies.filter(e => e.x + e.w > 0 && e.alive);
    this.items = this.items.filter(i => i.active);

    this.score += 1;
  }

  drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 25);
    ctx.fillText(`Runes: ${playerRunes}`, 10, 45);
    ctx.fillText(`Zone: ${levels[currentLevelIndex].name}`, 10, 65);
    if (this.boss) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillText(`Boss HP: ${Math.max(0, Math.floor(this.boss.hp))}`, WIDTH - 180, 25);
    }
  }

  draw() {
    this.bg.draw();
    this.player.draw();
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    for (let item of this.items) {
      item.draw();
    }
    if (this.boss) this.boss.draw();
    this.drawHUD();
  }
}
// Eventos de teclado
document.addEventListener('keydown', e => {
  if (game) game.keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (game) game.keys[e.key] = false;
});

function startGame() {
  game = new Game();
  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  winScreen.style.display = 'none';
  transitionScreen.style.display = 'none';
  shopScreen.style.display = 'none';
  canvas.style.display = 'block';
  requestAnimationFrame(gameLoop);
}

function showGameOver() {
  finalScore.textContent = `Runes collected: ${playerRunes}`;
  gameOverScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showTransition() {
  if (currentLevelIndex + 1 >= levels.length) {
    showWin();
    return;
  }
  currentLevelIndex++;
  transitionText.textContent = `Level ${currentLevelIndex} Completed!`;
  transitionScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showShop() {
  shopScreen.style.display = 'block';
  transitionScreen.style.display = 'none';
}

function showWin() {
  winScore.textContent = `Total runes: ${playerRunes}`;
  winScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function gameLoop() {
  if (game) {
    game.update();
    game.draw();
    if (!game.gameOver) {
      requestAnimationFrame(gameLoop);
    }
  }
}

// Botones
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
nextLevelBtn.addEventListener('click', showShop);
continueBtn.addEventListener('click', startGame);

buyLifeBtn.addEventListener('click', () => {
  if (playerRunes >= 50) {
    game.player.lives++;
    playerRunes -= 50;
  }
});

buyShieldBtn.addEventListener('click', () => {
  if (playerRunes >= 75) {
    game.player.shield = true;
    playerRunes -= 75;
  }
});

buySwordBtn.addEventListener('click', () => {
  if (playerRunes >= 100) {
    game.player.sword = true;
    playerRunes -= 100;
  }
});
