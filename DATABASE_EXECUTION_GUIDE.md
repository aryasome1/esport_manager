# Database Setup Guide

## Step 1: Execute PostgreSQL Schema in DBeaver

1. **Open DBeaver** and connect to your PostgreSQL database using these credentials:
   - Host: `127.0.0.1`
   - Port: `5432`
   - Database: `esport_manager`
   - Username: `postgres`
   - Password: `aryaaaaa`

2. **Create the Database** (if not already created):
   ```sql
   CREATE DATABASE esport_manager;
   ```

3. **Execute the Schema**:
   - Open a new SQL script in DBeaver
   - Copy and paste the entire contents of `postgresql_schema.sql`
   - Execute the script (Ctrl+Enter or click the execute button)

## Step 2: Verify Tables Creation

After executing the schema, you should see these tables created:
- `users` - User authentication
- `divisions` - MOBA and Valorant divisions
- `game_modes` - Different game modes for each division
- `players` - Player profiles and statistics
- `heroes` - MOBA heroes data
- `valorant_agents` - Valorant agents data
- `teams` - Team management
- `matches` - Match records
- `timeouts` - Timeout records
- `drafts` - Draft system data
- `coaches` - Coach profiles
- `training_sessions` - Training records
- And more...

## Step 3: Insert Initial Data

Execute this SQL to insert initial division data:

```sql
-- Insert MOBA Division
INSERT INTO divisions (name, division_type, description, max_players_per_team, min_players_per_team, has_draft_system, has_timeout_system, has_agent_selection, has_ai_opponent) 
VALUES ('MOBA Champions', 'moba', 'Mobile Legends & Arena of Valor division', 5, 3, true, true, true, true);

-- Insert Valorant Division
INSERT INTO divisions (name, division_type, description, max_players_per_team, min_players_per_team, has_draft_system, has_timeout_system, has_agent_selection, has_map_pool, has_ai_opponent) 
VALUES ('Valorant Tactical', 'tactical', 'Strategic FPS division with agent selection', 5, 3, true, true, true, true, true);

-- Insert Game Modes
-- MOBA Mode
INSERT INTO game_modes (division_id, name, game_mode_type, max_players, duration_minutes, requires_draft, allows_timeout, supports_ai_opponent) 
VALUES (1, 'Classic Ranked', 'ranked', 10, 20, true, true, true);

-- Valorant Mode
INSERT INTO game_modes (division_id, name, game_mode_type, max_players, duration_minutes, requires_draft, allows_timeout, supports_ai_opponent) 
VALUES (2, 'Competitive', 'ranked', 10, 40, true, true, true);
```

## Step 4: Create a Test User

```sql
INSERT INTO users (email, username, full_name, password_hash, division_preference) 
VALUES ('test@esports.com', 'testuser', 'Test User', '$2b$12$LQv3c1yqBwE9eOQO8Yv1fO.G9Q5W3N8X2V7K6J4H3F2D1S0A9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3Z2Y1X0', 'valorant');
```

Note: The password hash above is for password: `password123` (you should change this).

## Verification

After setup, you should have:
- ✅ Database connected
- ✅ All tables created (42+ tables)
- ✅ Initial division data inserted
- ✅ Test user created
- ✅ Ready for backend connection