// server.js - Backend API for Neon FIFA Pro
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const cors = require('cors');
const redis = require('redis');

// Initialize Express
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'neon_fifa_pro',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Redis for real-time data
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory game rooms for multiplayer
const gameRooms = new Map();
const playerConnections = new Map();

// ========== AUTHENTICATION ENDPOINTS ==========

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ========== PLAYER ENDPOINTS ==========

// Get player profile
app.get('/api/player/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, level, xp, coins, 
              total_matches, wins, losses, draws, 
              total_goals, total_assists, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player stats after match
app.post('/api/player/match-result', authenticateToken, async (req, res) => {
  try {
    const { result: matchResult, goals, assists, xpEarned } = req.body;
    const userId = req.user.userId;

    // Update user stats
    await pool.query(
      `UPDATE users SET 
        total_matches = total_matches + 1,
        wins = wins + $1,
        losses = losses + $2,
        draws = draws + $3,
        total_goals = total_goals + $4,
        total_assists = total_assists + $5,
        xp = xp + $6,
        level = FLOOR((xp + $6) / 1000) + 1
       WHERE id = $7`,
      [
        matchResult === 'win' ? 1 : 0,
        matchResult === 'loss' ? 1 : 0,
        matchResult === 'draw' ? 1 : 0,
        goals,
        assists,
        xpEarned,
        userId
      ]
    );

    // Save match history
    await pool.query(
      `INSERT INTO match_history 
       (user_id, result, goals, assists, xp_earned, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, matchResult, goals, assists, xpEarned]
    );

    res.json({ success: true, xpEarned });
  } catch (error) {
    console.error('Match result error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== LEADERBOARD ENDPOINTS ==========

// Get global leaderboard
app.get('/api/leaderboard/global', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        username, level, xp, total_matches, wins, 
        total_goals, 
        ROUND((CAST(wins AS FLOAT) / NULLIF(total_matches, 0) * 100), 2) as win_rate
       FROM users
       WHERE total_matches > 0
       ORDER BY xp DESC, wins DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get player rank
app.get('/api/leaderboard/rank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT rank FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY xp DESC, wins DESC) as rank
        FROM users
        WHERE total_matches > 0
      ) as ranked
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ rank: result.rows[0].rank });
  } catch (error) {
    console.error('Rank error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== TEAM ENDPOINTS ==========

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teams ORDER BY overall_rating DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Teams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's team
app.get('/api/teams/my-team', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.* FROM teams t
       JOIN user_teams ut ON t.id = ut.team_id
       WHERE ut.user_id = $1 AND ut.is_active = true`,
      [req.user.userId]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('My team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== WEBSOCKET MULTIPLAYER ==========

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  let playerId = null;
  let currentRoom = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'authenticate':
          // Verify JWT token
          jwt.verify(data.token, JWT_SECRET, (err, user) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
              ws.close();
            } else {
              playerId = user.userId;
              playerConnections.set(playerId, ws);
              ws.send(JSON.stringify({ type: 'authenticated', userId: playerId }));
            }
          });
          break;

        case 'create_room':
          // Create new game room
          const roomCode = generateRoomCode();
          currentRoom = roomCode;
          
          gameRooms.set(roomCode, {
            host: playerId,
            players: [playerId],
            gameState: 'waiting',
            createdAt: Date.now()
          });

          ws.send(JSON.stringify({ 
            type: 'room_created', 
            roomCode,
            playerId 
          }));

          // Cache room in Redis
          await redisClient.setEx(`room:${roomCode}`, 3600, JSON.stringify(gameRooms.get(roomCode)));
          break;

        case 'join_room':
          // Join existing room
          const room = gameRooms.get(data.roomCode);
          
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            break;
          }

          if (room.players.length >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            break;
          }

          room.players.push(playerId);
          currentRoom = data.roomCode;

          // Notify both players
          room.players.forEach(pid => {
            const playerWs = playerConnections.get(pid);
            if (playerWs) {
              playerWs.send(JSON.stringify({
                type: 'player_joined',
                roomCode: data.roomCode,
                players: room.players
              }));
            }
          });

          // Start match if room is full
          if (room.players.length === 2) {
            room.gameState = 'playing';
            room.players.forEach(pid => {
              const playerWs = playerConnections.get(pid);
              if (playerWs) {
                playerWs.send(JSON.stringify({ type: 'match_start' }));
              }
            });
          }
          break;

        case 'player_position':
          // Broadcast player position to opponent
          if (currentRoom) {
            const room = gameRooms.get(currentRoom);
            const opponentId = room.players.find(p => p !== playerId);
            const opponentWs = playerConnections.get(opponentId);
            
            if (opponentWs) {
              opponentWs.send(JSON.stringify({
                type: 'opponent_position',
                position: data.position
              }));
            }
          }
          break;

        case 'shoot':
          // Broadcast shot to opponent
          if (currentRoom) {
            const room = gameRooms.get(currentRoom);
            const opponentId = room.players.find(p => p !== playerId);
            const opponentWs = playerConnections.get(opponentId);
            
            if (opponentWs) {
              opponentWs.send(JSON.stringify({
                type: 'opponent_shoot',
                ball: data.ball
              }));
            }
          }
          break;

        case 'goal_scored':
          // Update score and broadcast
          if (currentRoom) {
            const room = gameRooms.get(currentRoom);
            room.players.forEach(pid => {
              const playerWs = playerConnections.get(pid);
              if (playerWs) {
                playerWs.send(JSON.stringify({
                  type: 'goal_scored',
                  scorer: playerId,
                  score: data.score
                }));
              }
            });
          }
          break;

        case 'match_end':
          // Save match results
          if (currentRoom) {
            const room = gameRooms.get(currentRoom);
            
            // Save to database
            await pool.query(
              `INSERT INTO multiplayer_matches 
               (player1_id, player2_id, player1_score, player2_score, created_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [room.players[0], room.players[1], data.score.player1, data.score.player2]
            );

            // Notify players
            room.players.forEach(pid => {
              const playerWs = playerConnections.get(pid);
              if (playerWs) {
                playerWs.send(JSON.stringify({
                  type: 'match_end',
                  score: data.score
                }));
              }
            });

            // Clean up room
            gameRooms.delete(currentRoom);
            await redisClient.del(`room:${currentRoom}`);
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Server error' }));
    }
  });

  ws.on('close', () => {
    if (playerId) {
      playerConnections.delete(playerId);
      
      // Remove from room if in one
      if (currentRoom) {
        const room = gameRooms.get(currentRoom);
        if (room) {
          room.players = room.players.filter(p => p !== playerId);
          
          if (room.players.length === 0) {
            gameRooms.delete(currentRoom);
          } else {
            // Notify remaining player
            const remainingPlayer = room.players[0];
            const remainingWs = playerConnections.get(remainingPlayer);
            if (remainingWs) {
              remainingWs.send(JSON.stringify({ 
                type: 'opponent_disconnected' 
              }));
            }
          }
        }
      }
    }
    console.log('WebSocket disconnected');
  });
});

// ========== HELPER FUNCTIONS ==========

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Clean up old rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of gameRooms.entries()) {
    if (now - room.createdAt > 3600000) { // 1 hour
      gameRooms.delete(code);
      redisClient.del(`room:${code}`);
    }
  }
}, 300000); // Every 5 minutes

// ========== START SERVER ==========

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Neon FIFA Pro server running on port ${PORT}`);
  console.log(`📊 Database connected`);
  console.log(`🎮 WebSocket server ready`);
  console.log(`⚡ Redis connected`);
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

module.exports = { app, server, pool };
