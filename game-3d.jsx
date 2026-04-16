import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Users, Wifi, WifiOff, Settings, Gamepad2 } from 'lucide-react';

const NeonFifaPro3D = () => {
  const [gameState, setGameState] = useState('menu');
  const [gameMode, setGameMode] = useState('single'); // single, multiplayer, tournament
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [time, setTime] = useState(0);
  const [matchTime, setMatchTime] = useState(300); // 5 minutes default
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState('disconnected');
  const [roomCode, setRoomCode] = useState('');
  const [playerStats, setPlayerStats] = useState({
    shots: 0,
    goals: 0,
    possession: 50,
    passes: 0,
    tackles: 0,
    saves: 0
  });

  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const gameRef = useRef({
    camera: { x: 400, y: 200, z: 600, rotationY: 0 },
    players: [],
    ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 10 },
    field: { width: 1000, height: 600, depth: 20 },
    keys: {},
    selectedPlayer: 0,
    formation: '4-3-3',
    aiPlayers: [],
    powerShot: 0,
    specialMove: null,
    weather: 'clear' // clear, rain, snow, night
  });

  // Teams database
  const teams = {
    striker: {
      name: 'Striker FC',
      color: '#00ffff',
      secondaryColor: '#0088ff',
      formation: '4-3-3',
      stats: { attack: 85, defense: 75, speed: 88, stamina: 82 }
    },
    neon: {
      name: 'Neon F.C.',
      color: '#ff00ff',
      secondaryColor: '#ff0088',
      formation: '4-4-2',
      stats: { attack: 88, defense: 78, speed: 85, stamina: 80 }
    },
    nexus: {
      name: 'Nexus City',
      color: '#00ff00',
      secondaryColor: '#00ff88',
      formation: '3-5-2',
      stats: { attack: 82, defense: 85, speed: 80, stamina: 88 }
    },
    aurora: {
      name: 'Aurora United',
      color: '#ffff00',
      secondaryColor: '#ff8800',
      formation: '4-2-4',
      stats: { attack: 90, defense: 72, speed: 90, stamina: 78 }
    }
  };

  // Initialize 3D game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const game = gameRef.current;
    
    // Initialize player positions based on formation
    game.players = [
      // Goalkeeper
      { id: 0, x: -450, y: 0, z: 0, vx: 0, vy: 0, vz: 0, role: 'GK', hasBall: false },
      // Defenders
      { id: 1, x: -350, y: 0, z: -150, vx: 0, vy: 0, vz: 0, role: 'DEF', hasBall: false },
      { id: 2, x: -350, y: 0, z: -50, vx: 0, vy: 0, vz: 0, role: 'DEF', hasBall: false },
      { id: 3, x: -350, y: 0, z: 50, vx: 0, vy: 0, vz: 0, role: 'DEF', hasBall: false },
      { id: 4, x: -350, y: 0, z: 150, vx: 0, vy: 0, vz: 0, role: 'DEF', hasBall: false },
      // Midfielders
      { id: 5, x: -150, y: 0, z: -100, vx: 0, vy: 0, vz: 0, role: 'MID', hasBall: false },
      { id: 6, x: -150, y: 0, z: 0, vx: 0, vy: 0, vz: 0, role: 'MID', hasBall: true },
      { id: 7, x: -150, y: 0, z: 100, vx: 0, vy: 0, vz: 0, role: 'MID', hasBall: false },
      // Forwards
      { id: 8, x: 50, y: 0, z: -80, vx: 0, vy: 0, vz: 0, role: 'FWD', hasBall: false },
      { id: 9, x: 50, y: 0, z: 0, vx: 0, vy: 0, vz: 0, role: 'FWD', hasBall: false },
      { id: 10, x: 50, y: 0, z: 80, vx: 0, vy: 0, vz: 0, role: 'FWD', hasBall: false }
    ];

    // Initialize AI team
    game.aiPlayers = game.players.map((p, i) => ({
      ...p,
      id: i + 11,
      x: -p.x,
      z: p.z,
      hasBall: false
    }));

    // Ball starts with player
    game.ball.x = game.players[6].x;
    game.ball.z = game.players[6].z;
  };

  // WebSocket for multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer') {
      connectToMultiplayer();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [gameMode]);

  const connectToMultiplayer = () => {
    const ws = new WebSocket('ws://localhost:8080'); // Will be replaced with actual server
    
    ws.onopen = () => {
      setMultiplayerStatus('connected');
      console.log('Connected to multiplayer server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMultiplayerMessage(data);
    };

    ws.onerror = () => {
      setMultiplayerStatus('error');
    };

    ws.onclose = () => {
      setMultiplayerStatus('disconnected');
    };

    wsRef.current = ws;
  };

  const handleMultiplayerMessage = (data) => {
    switch (data.type) {
      case 'room_created':
        setRoomCode(data.roomCode);
        break;
      case 'player_position':
        // Update opponent position
        break;
      case 'goal_scored':
        setScore(data.score);
        break;
      case 'match_end':
        setGameState('gameover');
        break;
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key] = true;
      
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shootBall();
      }
      
      if (e.key === 'Shift') {
        e.preventDefault();
        gameRef.current.powerShot = Math.min(gameRef.current.powerShot + 5, 100);
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        switchPlayer();
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        performSpecialMove();
      }
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
      
      if (e.key === 'Shift' && gameRef.current.powerShot > 0) {
        shootBall(gameRef.current.powerShot / 20);
        gameRef.current.powerShot = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const switchPlayer = () => {
    const game = gameRef.current;
    const availablePlayers = game.players.filter(p => !p.hasBall);
    if (availablePlayers.length > 0) {
      game.selectedPlayer = (game.selectedPlayer + 1) % game.players.length;
    }
  };

  const performSpecialMove = () => {
    const moves = ['curve_shot', 'chip_shot', 'power_drive', 'skill_move'];
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    gameRef.current.specialMove = randomMove;
    setTimeout(() => {
      gameRef.current.specialMove = null;
    }, 2000);
  };

  const shootBall = (powerMultiplier = 1) => {
    const game = gameRef.current;
    const player = game.players[game.selectedPlayer];
    
    if (!player.hasBall) return;

    // Calculate shot direction towards goal
    const targetX = 450;
    const targetZ = Math.random() * 100 - 50; // Random height
    
    const dx = targetX - player.x;
    const dz = targetZ - player.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    const speed = 15 * powerMultiplier;
    game.ball.vx = (dx / dist) * speed;
    game.ball.vz = (dz / dist) * speed;
    game.ball.vy = 5; // Arc
    
    player.hasBall = false;
    setPlayerStats(prev => ({ ...prev, shots: prev.shots + 1 }));

    // Send to multiplayer
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'shoot',
        ball: game.ball
      }));
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = Date.now();
    const gameLoop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTime(prev => {
        const newTime = prev + dt;
        if (newTime >= matchTime) {
          setGameState('gameover');
        }
        return newTime;
      });

      updateGame(dt);
      render3D();

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, matchTime]);

  const updateGame = (dt) => {
    const game = gameRef.current;
    const player = game.players[game.selectedPlayer];
    
    // Update player movement
    const speed = 250;
    player.vx = 0;
    player.vz = 0;

    if (game.keys['ArrowLeft'] || game.keys['a']) player.vx = -speed;
    if (game.keys['ArrowRight'] || game.keys['d']) player.vx = speed;
    if (game.keys['ArrowUp'] || game.keys['w']) player.vz = -speed;
    if (game.keys['ArrowDown'] || game.keys['s']) player.vz = speed;

    // Normalize diagonal
    if (player.vx !== 0 && player.vz !== 0) {
      const factor = 1 / Math.sqrt(2);
      player.vx *= factor;
      player.vz *= factor;
    }

    player.x += player.vx * dt;
    player.z += player.vz * dt;

    // Boundaries
    player.x = Math.max(-480, Math.min(480, player.x));
    player.z = Math.max(-280, Math.min(280, player.z));

    // Update ball physics
    if (!player.hasBall) {
      game.ball.x += game.ball.vx * dt;
      game.ball.z += game.ball.vz * dt;
      game.ball.y += game.ball.vy * dt;
      
      game.ball.vy -= 9.8 * dt; // Gravity
      
      if (game.ball.y <= 0) {
        game.ball.y = 0;
        game.ball.vy *= -0.6; // Bounce
        game.ball.vx *= 0.9;
        game.ball.vz *= 0.9;
      }

      // Check pickup
      const dist = Math.sqrt(
        (game.ball.x - player.x) ** 2 + 
        (game.ball.z - player.z) ** 2
      );
      
      if (dist < 30 && game.ball.y < 10 && Math.abs(game.ball.vx) < 3) {
        player.hasBall = true;
        game.ball.y = 0;
        setPlayerStats(prev => ({ ...prev, passes: prev.passes + 1 }));
      }
    } else {
      game.ball.x = player.x;
      game.ball.z = player.z;
      game.ball.y = 0;
    }

    // Check goals
    if (game.ball.x > 470 && Math.abs(game.ball.z) < 80 && game.ball.y < 80) {
      setScore(prev => ({ ...prev, home: prev.home + 1 }));
      setPlayerStats(prev => ({ ...prev, goals: prev.goals + 1 }));
      resetAfterGoal();
    }

    // Update AI
    updateAI(dt);
  };

  const updateAI = (dt) => {
    const game = gameRef.current;
    const difficultyMap = {
      easy: 0.5,
      medium: 0.75,
      hard: 1.0,
      legendary: 1.3
    };
    
    const aiSpeed = 200 * difficultyMap[difficulty];
    
    game.aiPlayers.forEach(ai => {
      // Simple AI: chase ball
      const dx = game.ball.x - ai.x;
      const dz = game.ball.z - ai.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 50) {
        ai.vx = (dx / dist) * aiSpeed;
        ai.vz = (dz / dist) * aiSpeed;
      } else {
        ai.vx *= 0.8;
        ai.vz *= 0.8;
      }
      
      ai.x += ai.vx * dt;
      ai.z += ai.vz * dt;
      
      ai.x = Math.max(-480, Math.min(480, ai.x));
      ai.z = Math.max(-280, Math.min(280, ai.z));
    });
  };

  const resetAfterGoal = () => {
    const game = gameRef.current;
    initializeGame();
  };

  const render3D = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    // Clear
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(1, '#1a0e2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 600);

    // Draw field (isometric view)
    drawField(ctx, game);
    
    // Draw players
    drawPlayers(ctx, game);
    
    // Draw ball
    drawBall(ctx, game);
    
    // Draw UI overlays
    drawUI(ctx, game);
  };

  const drawField = (ctx, game) => {
    const cx = 600;
    const cy = 300;
    
    // Field gradient
    const fieldGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
    fieldGradient.addColorStop(0, '#0a4a0a');
    fieldGradient.addColorStop(1, '#052805');
    
    // 3D field projection
    ctx.save();
    ctx.translate(cx, cy);
    
    // Field outline
    ctx.fillStyle = fieldGradient;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(-500, -200);
    ctx.lineTo(500, -200);
    ctx.lineTo(500, 200);
    ctx.lineTo(-500, 200);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Center line
    ctx.strokeStyle = '#00ffff44';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, -200);
    ctx.lineTo(0, 200);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    // Penalty boxes
    ctx.strokeRect(-500, -100, 120, 200);
    ctx.strokeRect(380, -100, 120, 200);
    
    ctx.setLineDash([]);
    
    // Goals
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(-520, -80, 20, 160);
    
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.fillRect(500, -80, 20, 160);
    ctx.shadowBlur = 0;
    
    ctx.restore();
  };

  const drawPlayers = (ctx, game) => {
    const cx = 600;
    const cy = 300;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw player team
    game.players.forEach((player, i) => {
      const isSelected = i === game.selectedPlayer;
      const size = isSelected ? 25 : 20;
      
      ctx.fillStyle = selectedTeam ? teams[selectedTeam].color : '#00ffff';
      ctx.shadowBlur = isSelected ? 40 : 20;
      ctx.shadowColor = ctx.fillStyle;
      
      ctx.beginPath();
      ctx.arc(player.x, player.z, size, 0, Math.PI * 2);
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.z, size + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Player number
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.id, player.x, player.z + 4);
    });
    
    // Draw AI team
    game.aiPlayers.forEach(ai => {
      ctx.fillStyle = opponentTeam ? teams[opponentTeam].color : '#ff00ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = ctx.fillStyle;
      
      ctx.beginPath();
      ctx.arc(ai.x, ai.z, 20, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  const drawBall = (ctx, game) => {
    const cx = 600;
    const cy = 300;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    const ballSize = 12 + game.ball.y * 0.2;
    
    const gradient = ctx.createRadialGradient(
      game.ball.x, game.ball.z - game.ball.y, 0,
      game.ball.x, game.ball.z - game.ball.y, ballSize
    );
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(1, '#ff8800');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffff00';
    
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.z - game.ball.y, ballSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball shadow
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(game.ball.x, game.ball.z, ballSize * 0.8, ballSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawUI = (ctx, game) => {
    // Power shot gauge
    if (game.powerShot > 0) {
      const barWidth = 200;
      const barHeight = 20;
      const x = 600 - barWidth / 2;
      const y = 550;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      const fillWidth = (game.powerShot / 100) * barWidth;
      const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(0.5, '#ffff00');
      gradient.addColorStop(1, '#ff0000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, fillWidth, barHeight);
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POWER SHOT', 600, y - 5);
    }

    // Special move indicator
    if (game.specialMove) {
      ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${game.specialMove.toUpperCase().replace('_', ' ')} ⚡`, 600, 50);
    }
  };

  const startMatch = (mode) => {
    setGameMode(mode);
    if (mode === 'single' && selectedTeam && opponentTeam) {
      setGameState('playing');
      setScore({ home: 0, away: 0 });
      setTime(0);
      initializeGame();
    }
  };

  const formatTime = (seconds) => {
    const remaining = matchTime - seconds;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-7xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            NEON FIFA PRO 3D
          </h1>
          <p className="text-cyan-300 text-sm tracking-widest">MULTIPLAYER • AI POWERED • NEXT-GEN FOOTBALL</p>
        </div>

        {gameState === 'menu' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Selection */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-cyan-500/30 p-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Select Your Team
              </h2>
              <div className="space-y-3">
                {Object.entries(teams).map(([key, team]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTeam(key)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedTeam === key
                        ? 'border-cyan-400 bg-cyan-900/30'
                        : 'border-slate-700 hover:border-cyan-600'
                    }`}
                    style={{
                      boxShadow: selectedTeam === key ? `0 0 20px ${team.color}` : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold" style={{ color: team.color }}>
                          {team.name}
                        </div>
                        <div className="text-xs text-slate-400">{team.formation}</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-red-900/30 rounded">ATK {team.stats.attack}</span>
                        <span className="px-2 py-1 bg-blue-900/30 rounded">DEF {team.stats.defense}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-bold text-purple-400 mt-6 mb-3">Opponent Team</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(teams).filter(([key]) => key !== selectedTeam).map(([key, team]) => (
                  <button
                    key={key}
                    onClick={() => setOpponentTeam(key)}
                    className={`p-3 rounded border ${
                      opponentTeam === key ? 'border-purple-400 bg-purple-900/30' : 'border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold" style={{ color: team.color }}>
                      {team.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Settings */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-cyan-500/30 p-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Game Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Match Duration</label>
                  <select
                    value={matchTime}
                    onChange={(e) => setMatchTime(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="180">3 Minutes</option>
                    <option value="300">5 Minutes</option>
                    <option value="450">7.5 Minutes</option>
                    <option value="600">10 Minutes</option>
                  </select>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">Controls</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Move</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded">WASD / Arrows</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Shoot</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded">SPACE</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Shot</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded">Hold SHIFT</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Switch Player</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded">TAB</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Move</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded">E</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => startMatch('single')}
                  disabled={!selectedTeam || !opponentTeam}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  START SINGLE PLAYER
                </button>

                <button
                  onClick={() => setGameMode('multiplayer')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Wifi className="w-5 h-5" />
                  MULTIPLAYER (COMING SOON)
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-cyan-500/30 overflow-hidden">
            {/* Match Info Bar */}
            <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 p-4 border-b border-cyan-500/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-cyan-300 mb-1">
                    {selectedTeam ? teams[selectedTeam].name : 'HOME'}
                  </div>
                  <div className="text-5xl font-bold text-cyan-400">{score.home}</div>
                </div>
                <div>
                  <div className="text-sm text-purple-300 mb-1">TIME</div>
                  <div className="text-3xl font-bold text-purple-400">{formatTime(time)}</div>
                  <div className="text-xs text-slate-400 mt-1">{difficulty.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-sm text-pink-300 mb-1">
                    {opponentTeam ? teams[opponentTeam].name : 'AWAY'}
                  </div>
                  <div className="text-5xl font-bold text-pink-400">{score.away}</div>
                </div>
              </div>
            </div>

            {/* Game Canvas */}
            <canvas
              ref={canvasRef}
              width={1200}
              height={600}
              className="w-full h-auto bg-slate-950"
            />

            {/* Stats Bar */}
            <div className="bg-slate-950 p-4 grid grid-cols-3 md:grid-cols-6 gap-3 text-center text-sm">
              <div>
                <div className="text-cyan-400 font-bold text-lg">{playerStats.shots}</div>
                <div className="text-slate-400 text-xs">Shots</div>
              </div>
              <div>
                <div className="text-yellow-400 font-bold text-lg">{playerStats.goals}</div>
                <div className="text-slate-400 text-xs">Goals</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold text-lg">{playerStats.passes}</div>
                <div className="text-slate-400 text-xs">Passes</div>
              </div>
              <div>
                <div className="text-pink-400 font-bold text-lg">{playerStats.tackles}</div>
                <div className="text-slate-400 text-xs">Tackles</div>
              </div>
              <div>
                <div className="text-green-400 font-bold text-lg">{playerStats.saves}</div>
                <div className="text-slate-400 text-xs">Saves</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-lg">
                  {playerStats.shots > 0 ? Math.round((playerStats.goals / playerStats.shots) * 100) : 0}%
                </div>
                <div className="text-slate-400 text-xs">Accuracy</div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="bg-slate-900 p-4 flex gap-3 justify-center border-t border-cyan-500/30">
              <button
                onClick={() => setGameState('paused')}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Exit Match
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-cyan-500/30 p-8 text-center">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-5xl font-bold mb-4">
              {score.home > score.away ? (
                <span className="text-cyan-400">VICTORY!</span>
              ) : score.home < score.away ? (
                <span className="text-pink-400">DEFEAT</span>
              ) : (
                <span className="text-purple-400">DRAW</span>
              )}
            </h2>
            <div className="text-6xl font-bold mb-8">
              <span className="text-cyan-400">{score.home}</span>
              <span className="text-slate-500 mx-4">-</span>
              <span className="text-pink-400">{score.away}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-cyan-400">{playerStats.goals}</div>
                <div className="text-slate-400 text-sm">Goals</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{playerStats.shots}</div>
                <div className="text-slate-400 text-sm">Shots</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-pink-400">
                  {playerStats.shots > 0 ? Math.round((playerStats.goals / playerStats.shots) * 100) : 0}%
                </div>
                <div className="text-slate-400 text-sm">Accuracy</div>
              </div>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeonFifaPro3D;