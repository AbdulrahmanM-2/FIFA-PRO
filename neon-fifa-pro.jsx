import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Zap, Target } from 'lucide-react';

const NeonFifaPro = () => {
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [time, setTime] = useState(0);
  const [playerStats, setPlayerStats] = useState({
    shots: 0,
    goals: 0,
    possession: 50,
    passes: 0
  });

  // Canvas and animation
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameRef = useRef({
    // Player
    player: { x: 100, y: 300, vx: 0, vy: 0, size: 15, hasBall: true },
    // AI opponent
    ai: { x: 700, y: 300, vx: 0, vy: 0, size: 15, hasBall: false },
    // Ball
    ball: { x: 100, y: 300, vx: 0, vy: 0, size: 8, owner: 'player' },
    // Goals
    goals: [
      { x: 0, y: 250, width: 20, height: 100 },
      { x: 780, y: 250, width: 20, height: 100 }
    ],
    // Controls
    keys: {},
    // AI settings
    aiDifficulty: 0.03,
    aiReactionTime: 0,
    // Power shot
    powerShot: 0,
    maxPowerShot: 100
  });

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    // Handle keyboard controls
    const handleKeyDown = (e) => {
      game.keys[e.key] = true;
      
      // Shoot with space
      if (e.key === ' ' && game.player.hasBall && gameState === 'playing') {
        e.preventDefault();
        shootBall('player');
      }
      
      // Power shot with shift
      if (e.key === 'Shift' && game.player.hasBall && gameState === 'playing') {
        e.preventDefault();
        game.powerShot = Math.min(game.powerShot + 5, game.maxPowerShot);
      }
    };

    const handleKeyUp = (e) => {
      game.keys[e.key] = false;
      
      // Release power shot
      if (e.key === 'Shift' && game.player.hasBall && game.powerShot > 0) {
        shootBall('player', game.powerShot / 20);
        game.powerShot = 0;
      }
    };

    // Touch controls for mobile
    const handleTouchStart = (e) => {
      if (gameState !== 'playing') return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      // Shoot towards touch point
      if (game.player.hasBall) {
        const dx = touchX - game.player.x;
        const dy = touchY - game.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        shootBall('player', 1, dx / dist, dy / dist);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameState]);

  // Shoot ball function
  const shootBall = (shooter, powerMultiplier = 1, dirX = null, dirY = null) => {
    const game = gameRef.current;
    const entity = shooter === 'player' ? game.player : game.ai;
    
    let dx, dy;
    if (dirX !== null && dirY !== null) {
      dx = dirX;
      dy = dirY;
    } else {
      // Default: shoot towards opponent's goal
      const targetGoal = shooter === 'player' ? game.goals[1] : game.goals[0];
      dx = targetGoal.x - entity.x;
      dy = (targetGoal.y + targetGoal.height / 2) - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      dx /= dist;
      dy /= dist;
    }
    
    const speed = 12 * powerMultiplier;
    game.ball.vx = dx * speed;
    game.ball.vy = dy * speed;
    game.ball.owner = null;
    entity.hasBall = false;
    
    if (shooter === 'player') {
      setPlayerStats(prev => ({ ...prev, shots: prev.shots + 1 }));
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    let lastTime = Date.now();
    
    const gameLoop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Update time
      setTime(prev => prev + dt);

      // Update player movement
      const speed = 200;
      game.player.vx = 0;
      game.player.vy = 0;

      if (game.keys['ArrowLeft'] || game.keys['a']) game.player.vx = -speed;
      if (game.keys['ArrowRight'] || game.keys['d']) game.player.vx = speed;
      if (game.keys['ArrowUp'] || game.keys['w']) game.player.vy = -speed;
      if (game.keys['ArrowDown'] || game.keys['s']) game.player.vy = speed;

      // Normalize diagonal movement
      if (game.player.vx !== 0 && game.player.vy !== 0) {
        const factor = 1 / Math.sqrt(2);
        game.player.vx *= factor;
        game.player.vy *= factor;
      }

      game.player.x += game.player.vx * dt;
      game.player.y += game.player.vy * dt;

      // Keep player in bounds
      game.player.x = Math.max(game.player.size, Math.min(800 - game.player.size, game.player.x));
      game.player.y = Math.max(game.player.size, Math.min(600 - game.player.size, game.player.y));

      // AI logic
      updateAI(dt);

      // Update ball
      if (game.ball.owner === null) {
        game.ball.x += game.ball.vx * dt;
        game.ball.y += game.ball.vy * dt;
        
        // Ball friction
        game.ball.vx *= 0.98;
        game.ball.vy *= 0.98;
        
        // Ball boundaries
        if (game.ball.x < game.ball.size || game.ball.x > 800 - game.ball.size) {
          game.ball.vx *= -0.8;
          game.ball.x = Math.max(game.ball.size, Math.min(800 - game.ball.size, game.ball.x));
        }
        if (game.ball.y < game.ball.size || game.ball.y > 600 - game.ball.size) {
          game.ball.vy *= -0.8;
          game.ball.y = Math.max(game.ball.size, Math.min(600 - game.ball.size, game.ball.y));
        }
        
        // Check ball pickup
        const playerDist = Math.sqrt((game.ball.x - game.player.x) ** 2 + (game.ball.y - game.player.y) ** 2);
        const aiDist = Math.sqrt((game.ball.x - game.ai.x) ** 2 + (game.ball.y - game.ai.y) ** 2);
        
        if (playerDist < game.player.size + game.ball.size && Math.abs(game.ball.vx) < 2 && Math.abs(game.ball.vy) < 2) {
          game.ball.owner = 'player';
          game.player.hasBall = true;
          setPlayerStats(prev => ({ ...prev, passes: prev.passes + 1 }));
        } else if (aiDist < game.ai.size + game.ball.size && Math.abs(game.ball.vx) < 2 && Math.abs(game.ball.vy) < 2) {
          game.ball.owner = 'ai';
          game.ai.hasBall = true;
        }
      } else {
        // Ball follows owner
        const owner = game.ball.owner === 'player' ? game.player : game.ai;
        game.ball.x = owner.x;
        game.ball.y = owner.y;
      }

      // Check goals
      checkGoals();

      // Render
      render(ctx);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  // AI update function
  const updateAI = (dt) => {
    const game = gameRef.current;
    const ai = game.ai;
    const ball = game.ball;
    
    // AI difficulty increases over time
    const difficulty = game.aiDifficulty + (time / 1000) * 0.001;
    
    if (ai.hasBall) {
      // AI has ball - move towards player's goal
      const targetX = 100;
      const targetY = 300;
      
      const dx = targetX - ai.x;
      const dy = targetY - ai.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 150;
      ai.vx = (dx / dist) * speed;
      ai.vy = (dy / dist) * speed;
      
      // AI shoots when close enough
      if (ai.x < 300 && Math.random() < difficulty) {
        shootBall('ai');
      }
    } else {
      // AI doesn't have ball - chase it
      const dx = ball.x - ai.x;
      const dy = ball.y - ai.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 180;
      ai.vx = (dx / dist) * speed * (0.7 + difficulty);
      ai.vy = (dy / dist) * speed * (0.7 + difficulty);
    }
    
    ai.x += ai.vx * dt;
    ai.y += ai.vy * dt;
    
    // Keep AI in bounds
    ai.x = Math.max(ai.size, Math.min(800 - ai.size, ai.x));
    ai.y = Math.max(ai.size, Math.min(600 - ai.size, ai.y));
  };

  // Check for goals
  const checkGoals = () => {
    const game = gameRef.current;
    const ball = game.ball;
    
    // Player scores (right goal)
    if (ball.x > 780 && ball.y > 250 && ball.y < 350) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setPlayerStats(prev => ({ ...prev, goals: prev.goals + 1 }));
      resetBall('ai');
    }
    
    // AI scores (left goal)
    if (ball.x < 20 && ball.y > 250 && ball.y < 350) {
      setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
      resetBall('player');
    }
  };

  // Reset ball after goal
  const resetBall = (starter) => {
    const game = gameRef.current;
    game.ball.x = 400;
    game.ball.y = 300;
    game.ball.vx = 0;
    game.ball.vy = 0;
    game.ball.owner = starter;
    
    if (starter === 'player') {
      game.player.x = 400;
      game.player.y = 300;
      game.player.hasBall = true;
      game.ai.hasBall = false;
    } else {
      game.ai.x = 400;
      game.ai.y = 300;
      game.ai.hasBall = true;
      game.player.hasBall = false;
    }
  };

  // Render function
  const render = (ctx) => {
    const game = gameRef.current;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 800, 600);
    
    // Field lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(400, 300, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    // Penalty boxes
    ctx.strokeRect(0, 150, 100, 300);
    ctx.strokeRect(700, 150, 100, 300);
    
    ctx.setLineDash([]);
    
    // Goals
    game.goals.forEach((goal, i) => {
      ctx.fillStyle = i === 0 ? '#ff00ff' : '#00ff00';
      ctx.shadowBlur = 20;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      ctx.shadowBlur = 0;
    });
    
    // Ball
    const gradient = ctx.createRadialGradient(game.ball.x, game.ball.y, 0, game.ball.x, game.ball.y, game.ball.size);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(1, '#ff8800');
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffff00';
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Ball trail
    if (Math.abs(game.ball.vx) > 5 || Math.abs(game.ball.vy) > 5) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.lineWidth = game.ball.size * 2;
      ctx.beginPath();
      ctx.moveTo(game.ball.x, game.ball.y);
      ctx.lineTo(game.ball.x - game.ball.vx * 2, game.ball.y - game.ball.vy * 2);
      ctx.stroke();
    }
    
    // Player
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, game.player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Player indicator
    if (game.player.hasBall) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(game.player.x, game.player.y, game.player.size + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // AI
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.arc(game.ai.x, game.ai.y, game.ai.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // AI indicator
    if (game.ai.hasBall) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(game.ai.x, game.ai.y, game.ai.size + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Power shot gauge
    if (game.powerShot > 0 && game.player.hasBall) {
      const barWidth = 100;
      const barHeight = 10;
      const barX = game.player.x - barWidth / 2;
      const barY = game.player.y - 35;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      const fillWidth = (game.powerShot / game.maxPowerShot) * barWidth;
      const gradient2 = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      gradient2.addColorStop(0, '#00ff00');
      gradient2.addColorStop(0.5, '#ffff00');
      gradient2.addColorStop(1, '#ff0000');
      ctx.fillStyle = gradient2;
      ctx.fillRect(barX, barY, fillWidth, barHeight);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore({ player: 0, ai: 0 });
    setTime(0);
    setPlayerStats({ shots: 0, goals: 0, possession: 50, passes: 0 });
    resetBall('player');
  };

  const togglePause = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing');
  };

  const resetGame = () => {
    setGameState('menu');
    setScore({ player: 0, ai: 0 });
    setTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            NEON FIFA PRO
          </h1>
          <p className="text-cyan-300 text-sm tracking-widest">FUTURE OF FOOTBALL • AI POWERED</p>
        </div>

        {/* Game Container */}
        <div className="bg-slate-900/50 backdrop-blur rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden">
          {/* Score & Stats Bar */}
          <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 p-4 border-b border-cyan-500/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-cyan-400 text-sm mb-1">YOU</div>
                <div className="text-4xl font-bold text-cyan-300">{score.player}</div>
              </div>
              <div>
                <div className="text-purple-400 text-sm mb-1">TIME</div>
                <div className="text-2xl font-bold text-purple-300">{formatTime(time)}</div>
              </div>
              <div>
                <div className="text-pink-400 text-sm mb-1">AI</div>
                <div className="text-4xl font-bold text-pink-300">{score.ai}</div>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-auto bg-slate-950 border-b border-cyan-500/30"
            />
            
            {/* Overlays */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold text-cyan-400">Welcome to Neon Arena</h2>
                    <p className="text-slate-300">Experience the future of football</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-6 space-y-3 text-left max-w-md">
                    <h3 className="text-cyan-400 font-semibold text-lg mb-3">Controls</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <kbd className="px-3 py-1 bg-slate-700 rounded text-cyan-300">WASD</kbd>
                        <span className="text-slate-300">or Arrow Keys - Move</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <kbd className="px-3 py-1 bg-slate-700 rounded text-cyan-300">SPACE</kbd>
                        <span className="text-slate-300">Shoot</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <kbd className="px-3 py-1 bg-slate-700 rounded text-cyan-300">SHIFT</kbd>
                        <span className="text-slate-300">Hold for Power Shot</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <kbd className="px-3 py-1 bg-slate-700 rounded text-cyan-300">TOUCH</kbd>
                        <span className="text-slate-300">Tap to shoot (Mobile)</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Play className="w-5 h-5" />
                    START MATCH
                  </button>
                </div>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center">
                <div className="text-center space-y-6">
                  <h2 className="text-4xl font-bold text-cyan-400">PAUSED</h2>
                  <button
                    onClick={togglePause}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg"
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    RESUME
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Panel */}
          <div className="bg-gradient-to-r from-slate-900/80 to-purple-900/80 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Target className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <div className="text-xs text-slate-400">SHOTS</div>
              <div className="text-xl font-bold text-cyan-300">{playerStats.shots}</div>
            </div>
            <div className="text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className="text-xs text-slate-400">GOALS</div>
              <div className="text-xl font-bold text-yellow-300">{playerStats.goals}</div>
            </div>
            <div className="text-center">
              <Zap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-xs text-slate-400">ACCURACY</div>
              <div className="text-xl font-bold text-purple-300">
                {playerStats.shots > 0 ? Math.round((playerStats.goals / playerStats.shots) * 100) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="w-5 h-5 text-pink-400 mx-auto mb-1 flex items-center justify-center font-bold">∞</div>
              <div className="text-xs text-slate-400">PASSES</div>
              <div className="text-xl font-bold text-pink-300">{playerStats.passes}</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="bg-slate-950 p-4 flex gap-3 justify-center">
            {gameState === 'playing' && (
              <button
                onClick={togglePause}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Match
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>🎮 Cross-platform ready • 🤖 AI-powered opponents • ⚡ Real-time physics</p>
          <p className="mt-2 text-xs">Next: Multiplayer, Advanced AI, 3D Graphics, Mobile App Build</p>
        </div>
      </div>
    </div>
  );
};

export default NeonFifaPro;
