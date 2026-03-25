import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function App() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const keys = {};
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    let player = { x: 400, y: 300, angle: 0, speed: 3, radius: 15, cooldown: 0 };
    let bullets = [];
    let enemies = [];
    let lastEnemySpawn = 0;
    
    let currentScore = 0;
    let isGameOver = false;

    const spawnEnemy = () => {
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      if (edge === 0) { x = Math.random() * GAME_WIDTH; y = -30; } // Top
      else if (edge === 1) { x = GAME_WIDTH + 30; y = Math.random() * GAME_HEIGHT; } // Right
      else if (edge === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 30; } // Bottom
      else { x = -30; y = Math.random() * GAME_HEIGHT; } // Left
      
      enemies.push({ x, y, radius: 15, speed: 1.5 });
    };

    const update = () => {
      if (isGameOver) return;
      
      // Player Movement
      if (keys['ArrowUp'] || keys['KeyW']) {
        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;
      }
      if (keys['ArrowDown'] || keys['KeyS']) {
        player.x -= Math.cos(player.angle) * player.speed;
        player.y -= Math.sin(player.angle) * player.speed;
      }
      if (keys['ArrowLeft'] || keys['KeyA']) player.angle -= 0.05;
      if (keys['ArrowRight'] || keys['KeyD']) player.angle += 0.05;

      // Keep player in bounds
      player.x = Math.max(player.radius, Math.min(GAME_WIDTH - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(GAME_HEIGHT - player.radius, player.y));

      // Shooting
      if (player.cooldown > 0) player.cooldown--;
      if (keys['Space'] && player.cooldown === 0) {
        bullets.push({
          x: player.x + Math.cos(player.angle) * 20,
          y: player.y + Math.sin(player.angle) * 20,
          vx: Math.cos(player.angle) * 8,
          vy: Math.sin(player.angle) * 8,
          radius: 4
        });
        player.cooldown = 20;
      }

      // Update Bullets
      bullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bullets = bullets.filter(b => b.x > 0 && b.x < GAME_WIDTH && b.y > 0 && b.y < GAME_HEIGHT);

      // Spawn Enemies
      if (Date.now() - lastEnemySpawn > 1500) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
      }

      // Update Enemies & Collisions
      for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        // Move towards player
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
        
        // Collision with player
        if (dist < player.radius + e.radius) {
          isGameOver = true;
          setGameOver(true);
        }

        // Collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
          let b = bullets[j];
          let bdx = b.x - e.x;
          let bdy = b.y - e.y;
          if (Math.sqrt(bdx * bdx + bdy * bdy) < b.radius + e.radius) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            currentScore += 10;
            setScore(currentScore);
            break;
          }
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Bullets
      ctx.fillStyle = 'yellow';
      bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      ctx.fillStyle = 'red';
      enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(e.x - 10, e.y - 10, 20, 20); // Make them square-ish tanks
      });

      // Draw Player Tank
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      
      // Tank body
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(-15, -15, 30, 30);
      
      // Tank gun barrel
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(0, -5, 25, 10);
      
      ctx.restore();
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
      // cleanup event listeners would go here ideally 
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>React Tank Shooter</h1>
      <p>Score: {score}</p>
      {gameOver && <h2 style={{color: 'red'}}>Game Over! Refresh to restart.</h2>}
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT} 
        style={{ border: '2px solid white', backgroundColor: '#222' }} 
      />
      <p>Controls: W A S D / Arrows to Move and Rotate | Space to Shoot</p>
    </div>
  );
}

