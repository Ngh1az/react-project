import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function App() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);

  const keysRef = useRef({});
  const mouseRef = useRef({ x: 400, y: 300, isDown: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const keys = keysRef.current;

    const handleKeyDown = e => {
      keys[e.code] = true;
      if (e.key) keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = e => {
      keys[e.code] = false;
      if (e.key) keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // FIX: Player now spawns at y=500 to avoid being stuck inside the center obstacle!
    let player = { x: 400, y: 500, angle: 0, speed: 3.5, radius: 15, cooldown: 0, hp: 100, maxHp: 100 };
    let bullets = [];
    let enemies = [];
    let lastEnemySpawn = 0;
    
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
      
      enemies.push({ x, y, angle: 0, radius: 15, speed: 1.2 + (currentScore * 0.01), hp: 50, maxHp: 50, cooldown: 0 });
    };

    const checkCollision = (x, y, radius, obs) => {
      let testX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
      let testY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
      let distX = x - testX;
      let distY = y - testY;
      return (distX * distX + distY * distY) < (radius * radius);
    };

    const update = () => {
      if (isGameOver) return;
      
      // M?I: Di chuy?n tr?c ti?p b?ng phím W A S D thay vì di?u khi?n vô lang xoay vòng
      let dx = 0; let dy = 0;
      if (keys['w'] || keys['arrowup'] || keys['KeyW'] || keys['ArrowUp']) dy -= player.speed;
      if (keys['s'] || keys['arrowdown'] || keys['KeyS'] || keys['ArrowDown']) dy += player.speed;
      if (keys['a'] || keys['arrowleft'] || keys['KeyA'] || keys['ArrowLeft']) dx -= player.speed;
      if (keys['d'] || keys['arrowright'] || keys['KeyD'] || keys['ArrowRight']) dx += player.speed;

      // Chu?n hoá t?c d? khi di chéo
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx*dx + dy*dy);
        dx = (dx/length) * player.speed;
        dy = (dy/length) * player.speed;
      }

      let nextX = player.x + dx;
      
      // X? lý tru?t d?c theo tu?ng cho tr?c X
      let hitObsX = false;
      for (let obs of obstacles) {
        if (checkCollision(nextX, player.y, player.radius, obs)) { hitObsX = true; break; }
      }
      if (!hitObsX && nextX > player.radius && nextX < GAME_WIDTH - player.radius) {
        player.x = nextX;
      }

      // X? lý tru?t d?c theo tu?ng cho tr?c Y
      let nextY = player.y + dy;
      let hitObsY = false;
      for (let obs of obstacles) {
        if (checkCollision(player.x, nextY, player.radius, obs)) { hitObsY = true; break; }
      }
      if (!hitObsY && nextY > player.radius && nextY < GAME_HEIGHT - player.radius) {
        player.y = nextY;
      }

      // Ng?m theo hu?ng chu?t
      player.angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);

      // B?n b?ng Chu?t trái ho?c Phím Space
      if (player.cooldown > 0) player.cooldown--;
      if ((keys[' '] || keys['space'] || mouseRef.current.isDown) && player.cooldown === 0) {
        bullets.push({
          x: player.x + Math.cos(player.angle) * 20,
          y: player.y + Math.sin(player.angle) * 20,
          vx: Math.cos(player.angle) * 9,
          vy: Math.sin(player.angle) * 9,
          radius: 4,
          isPlayer: true
        });
        player.cooldown = 15;
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        
        let removed = false;
        
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) {
          bullets.splice(i, 1);
          continue;
        }

        for (let obs of obstacles) {
          if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
            bullets.splice(i, 1);
            removed = true;
            break;
          }
        }
        if (removed) continue;

        if (!b.isPlayer) {
          let distX = player.x - b.x;
          let distY = player.y - b.y;
          if (distX * distX + distY * distY < (player.radius + b.radius) * (player.radius + b.radius)) {
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

      // Khó lên theo th?i gian
      let spawnRate = Math.max(800, 2000 - currentScore * 10);
      if (Date.now() - lastEnemySpawn > spawnRate) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        e.angle = Math.atan2(player.y - e.y, player.x - e.x);
        
        let eDx = Math.cos(e.angle) * e.speed;
        let eDy = Math.sin(e.angle) * e.speed;

        let eHitX = false;
        for (let obs of obstacles) {
          if (checkCollision(e.x + eDx, e.y, e.radius, obs)) { eHitX = true; break; }
        }
        if (!eHitX) e.x += eDx;

        let eHitY = false;
        for (let obs of obstacles) {
          if (checkCollision(e.x, e.y + eDy, e.radius, obs)) { eHitY = true; break; }
        }
        if (!eHitY) e.y += eDy;

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
      ctx.fillStyle = '#6d4c41'; 
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = '#3e2723';
      obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#1b0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      });

      bullets.forEach(b => {
        ctx.fillStyle = b.isPlayer ? 'yellow' : 'orange';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.fillStyle = '#d32f2f'; 
        ctx.fillRect(-15, -15, 30, 30);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(0, -4, 25, 8);
        ctx.restore();
        drawHealthBar(e.x, e.y, e.hp, e.maxHp, 30);
      });

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

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', userSelect: 'none' }}>
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
        style={{ border: '4px solid #333', backgroundColor: '#6d4c41', boxShadow: '0 0 10px rgba(0,0,0,0.5)', cursor: 'crosshair' }} 
        onMouseMove={handleMouseMove}
        onMouseDown={() => mouseRef.current.isDown = true}
        onMouseUp={() => mouseRef.current.isDown = false}
        onMouseLeave={() => mouseRef.current.isDown = false}
        onContextMenu={(e) => e.preventDefault()}
      />
      <p style={{ fontWeight: 'bold' }}>Controls: W, A, S, D to Move | Mouse to Aim | Click or Space to Shoot</p>
    </div>
  );
}

