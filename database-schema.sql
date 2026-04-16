-- Neon FIFA Pro Database Schema
-- PostgreSQL 14+

-- Create database
CREATE DATABASE neon_fifa_pro;

\c neon_fifa_pro;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ========== USERS TABLE ==========
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- Player stats
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 1000,
    
    -- Match statistics
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    total_assists INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    total_tackles INTEGER DEFAULT 0,
    
    -- Account info
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    premium_until TIMESTAMP,
    
    -- Profile
    avatar_url VARCHAR(500),
    country VARCHAR(3), -- ISO country code
    bio TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{"sound": true, "music": true, "difficulty": "medium"}'::jsonb
);

-- Indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_level ON users(level DESC);

-- ========== TEAMS TABLE ==========
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    
    -- Team colors
    primary_color VARCHAR(7) NOT NULL, -- Hex color
    secondary_color VARCHAR(7) NOT NULL,
    
    -- Team stats
    overall_rating INTEGER DEFAULT 75 CHECK (overall_rating >= 0 AND overall_rating <= 99),
    attack_rating INTEGER DEFAULT 75,
    defense_rating INTEGER DEFAULT 75,
    midfield_rating INTEGER DEFAULT 75,
    speed_rating INTEGER DEFAULT 75,
    stamina_rating INTEGER DEFAULT 75,
    
    -- Formation
    formation VARCHAR(10) DEFAULT '4-4-2',
    
    -- Metadata
    league VARCHAR(100),
    stadium_name VARCHAR(100),
    founded_year INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default teams
INSERT INTO teams (name, short_name, primary_color, secondary_color, overall_rating, attack_rating, defense_rating, formation) VALUES
('Striker FC', 'STK', '#00ffff', '#0088ff', 85, 88, 78, '4-3-3'),
('Neon F.C.', 'NEO', '#ff00ff', '#ff0088', 86, 90, 75, '4-4-2'),
('Nexus City', 'NXS', '#00ff00', '#00ff88', 84, 82, 88, '3-5-2'),
('Aurora United', 'AUR', '#ffff00', '#ff8800', 87, 92, 72, '4-2-4'),
('Cyber Wolves', 'CYB', '#ff0000', '#ff4444', 83, 85, 80, '4-3-3'),
('Digital Dragons', 'DIG', '#8800ff', '#aa44ff', 85, 87, 82, '4-4-2'),
('Quantum Raiders', 'QTM', '#00ffaa', '#00ddaa', 82, 80, 85, '5-3-2'),
('Plasma Phoenix', 'PLS', '#ffaa00', '#ff6600', 86, 91, 78, '4-2-3-1');

-- ========== PLAYERS TABLE ==========
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    
    -- Player info
    name VARCHAR(100) NOT NULL,
    position VARCHAR(5) NOT NULL, -- GK, DEF, MID, FWD
    number INTEGER CHECK (number >= 1 AND number <= 99),
    
    -- Player stats
    overall_rating INTEGER DEFAULT 70 CHECK (overall_rating >= 40 AND overall_rating <= 99),
    pace INTEGER DEFAULT 70,
    shooting INTEGER DEFAULT 70,
    passing INTEGER DEFAULT 70,
    dribbling INTEGER DEFAULT 70,
    defending INTEGER DEFAULT 70,
    physical INTEGER DEFAULT 70,
    
    -- Special attributes
    weak_foot INTEGER DEFAULT 3 CHECK (weak_foot >= 1 AND weak_foot <= 5),
    skill_moves INTEGER DEFAULT 3 CHECK (skill_moves >= 1 AND skill_moves <= 5),
    
    -- Metadata
    age INTEGER,
    nationality VARCHAR(3),
    height INTEGER, -- in cm
    weight INTEGER, -- in kg
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== USER TEAMS ==========
CREATE TABLE user_teams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id),
    
    is_active BOOLEAN DEFAULT false,
    selected_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, team_id)
);

-- ========== MATCH HISTORY ==========
CREATE TABLE match_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Match details
    result VARCHAR(10) NOT NULL, -- win, loss, draw
    mode VARCHAR(20) DEFAULT 'single_player', -- single_player, multiplayer, tournament
    difficulty VARCHAR(20) DEFAULT 'medium',
    
    -- Team info
    player_team_id INTEGER REFERENCES teams(id),
    opponent_team_id INTEGER REFERENCES teams(id),
    
    -- Scores
    player_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    
    -- Player stats
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    passes INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    possession_percentage INTEGER DEFAULT 50,
    
    -- Rewards
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    
    -- Duration
    match_duration INTEGER, -- in seconds
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for match history
CREATE INDEX idx_match_history_user ON match_history(user_id);
CREATE INDEX idx_match_history_created ON match_history(created_at DESC);

-- ========== MULTIPLAYER MATCHES ==========
CREATE TABLE multiplayer_matches (
    id SERIAL PRIMARY KEY,
    
    -- Players
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    
    -- Teams
    player1_team_id INTEGER REFERENCES teams(id),
    player2_team_id INTEGER REFERENCES teams(id),
    
    -- Scores
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    
    -- Match data
    room_code VARCHAR(10),
    match_duration INTEGER,
    
    -- Stats
    match_data JSONB, -- Store detailed match events
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_multiplayer_player1 ON multiplayer_matches(player1_id);
CREATE INDEX idx_multiplayer_player2 ON multiplayer_matches(player2_id);

-- ========== TOURNAMENTS ==========
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Tournament settings
    max_players INTEGER DEFAULT 16,
    entry_fee INTEGER DEFAULT 0, -- in coins
    prize_pool INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, ongoing, completed
    
    -- Dates
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TOURNAMENT PARTICIPANTS ==========
CREATE TABLE tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tournament progress
    current_round INTEGER DEFAULT 1,
    is_eliminated BOOLEAN DEFAULT false,
    final_position INTEGER,
    
    -- Stats
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tournament_id, user_id)
);

-- ========== ACHIEVEMENTS ==========
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Requirements
    requirement_type VARCHAR(50), -- total_goals, total_wins, level, etc.
    requirement_value INTEGER,
    
    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== USER ACHIEVEMENTS ==========
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id),
    
    unlocked_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Insert default achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value, xp_reward, coins_reward, rarity) VALUES
('First Goal', 'Score your first goal', 'total_goals', 1, 100, 50, 'common'),
('Hat Trick Hero', 'Score 3 goals in a single match', 'match_goals', 3, 500, 250, 'rare'),
('Perfect Game', 'Win a match without conceding', 'clean_sheet_win', 1, 300, 150, 'rare'),
('Century Club', 'Score 100 total goals', 'total_goals', 100, 2000, 1000, 'epic'),
('Champion', 'Win 10 matches in a row', 'win_streak', 10, 1500, 750, 'epic'),
('Legend', 'Reach level 50', 'level', 50, 5000, 2500, 'legendary');

-- ========== LEADERBOARDS (Materialized View) ==========
CREATE MATERIALIZED VIEW global_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.level,
    u.xp,
    u.total_matches,
    u.wins,
    u.losses,
    u.draws,
    u.total_goals,
    u.total_assists,
    CASE 
        WHEN u.total_matches > 0 THEN ROUND((CAST(u.wins AS NUMERIC) / u.total_matches * 100), 2)
        ELSE 0 
    END as win_rate,
    ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.wins DESC) as rank
FROM users u
WHERE u.total_matches > 0 AND u.is_active = true
ORDER BY u.xp DESC, u.wins DESC
LIMIT 1000;

-- Index for leaderboard
CREATE UNIQUE INDEX idx_global_leaderboard_id ON global_leaderboard(id);

-- Refresh leaderboard function
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- ========== STORE ITEMS ==========
CREATE TABLE store_items (
    id SERIAL PRIMARY KEY,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type VARCHAR(50), -- avatar, badge, celebration, boost
    
    price_coins INTEGER DEFAULT 0,
    price_premium_currency INTEGER DEFAULT 0,
    
    is_available BOOLEAN DEFAULT true,
    is_premium_only BOOLEAN DEFAULT false,
    
    -- Item data
    item_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== USER INVENTORY ==========
CREATE TABLE user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES store_items(id),
    
    is_equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, item_id)
);

-- ========== FUNCTIONS ==========

-- Calculate XP for match
CREATE OR REPLACE FUNCTION calculate_match_xp(
    p_result VARCHAR,
    p_goals INTEGER,
    p_assists INTEGER,
    p_difficulty VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
    base_xp INTEGER := 50;
    result_bonus INTEGER := 0;
    difficulty_multiplier NUMERIC := 1.0;
    total_xp INTEGER;
BEGIN
    -- Result bonus
    IF p_result = 'win' THEN result_bonus := 100;
    ELSIF p_result = 'draw' THEN result_bonus := 50;
    END IF;
    
    -- Difficulty multiplier
    CASE p_difficulty
        WHEN 'easy' THEN difficulty_multiplier := 0.8;
        WHEN 'medium' THEN difficulty_multiplier := 1.0;
        WHEN 'hard' THEN difficulty_multiplier := 1.5;
        WHEN 'legendary' THEN difficulty_multiplier := 2.0;
    END CASE;
    
    -- Calculate total
    total_xp := ROUND((base_xp + result_bonus + (p_goals * 20) + (p_assists * 10)) * difficulty_multiplier);
    
    RETURN total_xp;
END;
$$ LANGUAGE plpgsql;

-- Get player stats
CREATE OR REPLACE FUNCTION get_player_stats(p_user_id INTEGER)
RETURNS TABLE (
    total_matches BIGINT,
    wins BIGINT,
    losses BIGINT,
    draws BIGINT,
    total_goals BIGINT,
    total_assists BIGINT,
    avg_goals_per_match NUMERIC,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_matches,
        COUNT(*) FILTER (WHERE result = 'win')::BIGINT as wins,
        COUNT(*) FILTER (WHERE result = 'loss')::BIGINT as losses,
        COUNT(*) FILTER (WHERE result = 'draw')::BIGINT as draws,
        COALESCE(SUM(goals), 0)::BIGINT as total_goals,
        COALESCE(SUM(assists), 0)::BIGINT as total_assists,
        ROUND(AVG(goals), 2) as avg_goals_per_match,
        ROUND(
            CAST(COUNT(*) FILTER (WHERE result = 'win') AS NUMERIC) / 
            NULLIF(COUNT(*), 0) * 100, 
            2
        ) as win_rate
    FROM match_history
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGERS ==========

-- Auto-refresh leaderboard after match
CREATE OR REPLACE FUNCTION trigger_refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule async refresh (in production, use a job queue)
    PERFORM refresh_leaderboard();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_match_insert
    AFTER INSERT ON match_history
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_leaderboard();

-- ========== SAMPLE DATA ==========

-- Create test user
INSERT INTO users (username, email, password, level, xp, total_matches, wins, total_goals)
VALUES ('TestPlayer', 'test@neonfifa.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxx', 10, 5000, 50, 35, 120);

-- Grant user a team
INSERT INTO user_teams (user_id, team_id, is_active)
VALUES (1, 1, true);

-- Add some match history
INSERT INTO match_history (
    user_id, result, mode, player_team_id, opponent_team_id,
    player_score, opponent_score, goals, assists, shots, xp_earned
) VALUES
(1, 'win', 'single_player', 1, 2, 3, 1, 2, 1, 8, 150),
(1, 'loss', 'single_player', 1, 3, 1, 2, 1, 0, 5, 75),
(1, 'win', 'single_player', 1, 4, 4, 0, 3, 1, 12, 200);

-- Refresh leaderboard
SELECT refresh_leaderboard();

-- ========== VIEWS ==========

-- Top scorers view
CREATE VIEW top_scorers AS
SELECT 
    u.username,
    u.total_goals,
    u.total_matches,
    ROUND(CAST(u.total_goals AS NUMERIC) / NULLIF(u.total_matches, 0), 2) as goals_per_match
FROM users u
WHERE u.total_matches > 0
ORDER BY u.total_goals DESC
LIMIT 100;

-- Recent matches view
CREATE VIEW recent_matches AS
SELECT 
    m.id,
    u.username,
    t1.name as player_team,
    t2.name as opponent_team,
    m.player_score,
    m.opponent_score,
    m.result,
    m.created_at
FROM match_history m
JOIN users u ON m.user_id = u.id
LEFT JOIN teams t1 ON m.player_team_id = t1.id
LEFT JOIN teams t2 ON m.opponent_team_id = t2.id
ORDER BY m.created_at DESC
LIMIT 100;

COMMENT ON DATABASE neon_fifa_pro IS 'Neon FIFA Pro - Futuristic AI-Powered Football Game';
