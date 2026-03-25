import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function App() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const keys = {};
    const handleKeyDown = e => { keys[e.code] = true; };
    const handleKeyUp = e => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let player = { x: 400, y: 300, angle: 0, speed: 3, radius: 15, cooldown: 0, hp: 100, maxHp: 100 };
    let bullets = [];
    let enemies = [];
    let lastEnemySpawn = 0;
    
    // Map obstacles
    const obstacles = [
      { x: 150, y: 150, w: 100, h: 50 },
      { x: 550, y: 150, w: 100, h: 50 },
      { x: 150, y: 400, w: 100, h: 50 },
      { x: 550, y: 400, w: 100, h: 50 },
      { x: 350, y: 250, w: 100, h: 100 },
    ];
    
    let currentScore = 0;
    let isGameOver = false;

    const spawnEnemy = () => {
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      if (edge === 0) { x = Math.random() * GAME_WIDTH; y = -30; }
      else if (edge === 1) { x = GAME_WIDTH + 30; y = Math.random() * GAME_HEIGHT; }
      else if (edge === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 30; }
      else { x = -30; y = Math.random() * GAME_HEIGHT; }
      
      enemies.push({ x, y, angle: 0, radius: 15, speed: 1.2, hp: 50, maxHp: 50, cooldown: 0 });
    };

    const checkCollision = (x, y, radius, obs) => {
      let testX = x;
      let testY = y;
      
      if (x < obs.x) testX = obs.x;
      else if (x > obs.x + obs.w) testX = obs.x + obs.w;
      
      if (y < obs.y) testY = obs.y;
      else if (y > obs.y + obs.h) testY = obs.y + obs.h;
      
      let distX = x - testX;
      let distY = y - testY;
      let distance = Math.sqrt((distX*distX) + (distY*distY));
      
      return distance <= radius;
    };

    const update = () => {
      if (isGameOver) return;
      
      // Player Movement
      let nextX = player.x;
      let nextY = player.y;

      if (keys['ArrowUp'] || keys['KeyW']) {
        nextX += Math.cos(player.angle) * player.speed;
        nextY += Math.sin(player.angle) * player.speed;
      }
      if (keys['ArrowDown'] || keys['KeyS']) {
        nextX -= Math.cos(player.angle) * player.speed;
        nextY -= Math.sin(player.angle) * player.speed;
      }
      if (keys['ArrowLeft'] || keys['KeyA']) player.angle -= 0.05;
      if (keys['ArrowRight'] || keys['KeyD']) player.angle += 0.05;

      // Keep player in bounds
      nextX = Math.max(player.radius, Math.min(GAME_WIDTH - player.radius, nextX));
      nextY = Math.max(player.radius, Math.min(GAME_HEIGHT - player.radius, nextY));

      // Check obstacle collisions for player
      let hitObstacle = false;
      for (let obs of obstacles) {
        if (checkCollision(nextX, nextY, player.radius, obs)) {
          hitObstacle = true;
          break;
        }
      }
      if (!hitObstacle) {
        player.x = nextX;
        player.y = nextY;
      }

      // Shooting
      if (player.cooldown > 0) player.cooldown--;
      if (keys['Space'] && player.cooldown === 0) {
        bullets.push({
          x: player.x + Math.cos(player.angle) * 20,
          y: player.y + Math.sin(player.angle) * 20,
          vx: Math.cos(player.angle) * 8,
          vy: Math.sin(player.angle) * 8,
          radius: 4,
          isPlayer: true
        });
        player.cooldown = 20;
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        
        let removed = false;
        
        // Out of bounds
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) {
          bullets.splice(i, 1);
          continue;
        }

        // Obstacle collision
        for (let obs of obstacles) {
          if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
            bullets.splice(i, 1);
            removed = true;
            break;
          }
        }
        if (removed) continue;

        // Hit Player
        if (!b.isPlayer) {
          let dx = player.x - b.x;
          let dy = player.y - b.y;
          if (Math.sqrt(dx * dx + dy * dy) < player.radius + b.radius) {
            player.hp -= 10;
            setPlayerHp(player.hp);
            bullets.splice(i, 1);
            if (player.hp <= 0) {
              isGameOver = true;
              setGameOver(true);
            }
            continue;
          }
        }
      }

      // Spawn Enemies
      if (Date.now() - lastEnemySpawn > 2000) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
      }

      // Update Enemies & Collisions
      for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        // Calculate angle to player
        e.angle = Math.atan2(player.y - e.y, player.x - e.x);
        
        let nextEX = e.x + Math.cos(e.angle) * e.speed;
        let nextEY = e.y + Math.sin(e.angle) * e.speed;

        let hitObstacle = false;
        for (let obs of obstacles) {
          if (checkCollision(nextEX, nextEY, e.radius, obs)) {
            hitObstacle = true;
            break;
          }
        }

        if (!hitObstacle) {
          e.x = nextEX;
          e.y = nextEY;
        }

        // Enemy Shooting
        if (e.cooldown > 0) e.cooldown--;
        if (e.cooldown <= 0 && Math.random() < 0.02) {
          bullets.push({
            x: e.x + Math.cos(e.angle) * 20,
            y: e.y + Math.sin(e.angle) * 20,
            vx: Math.cos(e.angle) * 5,
            vy: Math.sin(e.angle) * 5,
            radius: 4,
            isPlayer: false
          });
          e.cooldown = 100;
        }
        
        // Collision with bullets (Player's bullets hitting enemy)
        for (let j = bullets.length - 1; j >= 0; j--) {
          let b = bullets[j];
          if (!b.isPlayer) continue;

          let bdx = b.x - e.x;
          let bdy = b.y - e.y;
          if (Math.sqrt(bdx * bdx + bdy * bdy) < b.radius + e.radius) {
            e.hp -= 25;
            bullets.splice(j, 1);
            if (e.hp <= 0) {
              enemies.splice(i, 1);
              currentScore += 10;
              setScore(currentScore);
            }
            break;
          }
        }
      }
    };

    const drawHealthBar = (x, y, hp, maxHp, width) => {
      const percentage = Math.max(0, hp / maxHp);
      ctx.fillStyle = 'red';
      ctx.fillRect(x - width/2, y - 25, width, 5);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x - width/2, y - 25, width * percentage, 5);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(x - width/2, y - 25, width, 5);
    };

    const draw = () => {
      ctx.fillStyle = '#6d4c41'; // map background
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Obstacles
      ctx.fillStyle = '#3e2723';
      obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#1b0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Draw Bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.isPlayer ? 'yellow' : 'orange';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        
        ctx.fillStyle = '#d32f2f'; // enemy red
        ctx.fillRect(-15, -15, 30, 30);
        
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(0, -4, 25, 8);
        
        ctx.restore();
        
        drawHealthBar(e.x, e.y, e.hp, e.maxHp, 30);
      });

      // Draw Player Tank
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(-15, -15, 30, 30);
      
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(0, -5, 25, 10);
      
      ctx.restore();
      
      drawHealthBar(player.x, player.y, player.hp, player.maxHp, 40);
    };

    const loop = () => {
      update();
      draw();
      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Advanced Tank Shooter</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>Score: {score}</h2>
        <h2 style={{ margin: 0, color: playerHp > 30 ? 'green' : 'red' }}>HP: {playerHp}%</h2>
      </div>
      {gameOver && <h2 style={{color: 'red'}}>Game Over! Refresh to restart.</h2>}
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT} 
        style={{ border: '4px solid #333', backgroundColor: '#6d4c41', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} 
        tabIndex={0}
      />
      <p>Controls: W A S D / Arrows = Move & Rotate | Space = Shoot</p>
    </div>
  );
}

