# Database Tables Required for eSports Manager
# PostgreSQL Schema Based on Application Models

## 📋 Required Tables

### Core User Management
1. **users** - User accounts and authentication
2. **players** - Player profiles and statistics
3. **teams** - Team information and management
4. **coaches** - Coach profiles and information

### Division System
5. **divisions** - MOBA and Tactical Shooter divisions
6. **division_games** - Games supported by each division

### Content Management
7. **heroes** - MOBA heroes/characters
8. **agents** - Valorant agents/characters
9. **maps** - Game maps for both divisions
10. **hero_abilities** - Hero abilities and skills
11. **agent_abilities** - Agent abilities and skills

### Match System
12. **matches** - Match records and results
13. **match_players** - Player participation in matches
14. **match_events** - Match timeline events
15. **draft_sessions** - Draft phase records
16. **draft_picks** - Individual draft picks
17. **draft_bans** - Draft ban records

### Training & Development
18. **training_sessions** - Individual training sessions
19. **training_drills** - Available training exercises
20. **player_stats** - Historical player statistics

### Economic System
21. **team_economy** - Team economic state tracking
22. **match_economy** - Per-match economic data
23. **round_economy** - Per-round economic decisions

### AI & Strategy
24. **ai_opponents** - AI opponent profiles
25. **ai_strategies** - Available AI strategies
26. **tactical_plans** - Saved tactical plans
27. **tactic_executions** - Execution history of tactics

### Social Features
28. **notifications** - User notifications
29. **chat_messages** - Chat and messaging
30. **friend_requests** - Friend system

### Tournaments & Events
31. **tournaments** - Tournament information
32. **tournament_participants** - Teams in tournaments
33. **tournament_matches** - Tournament match structure

### Game-Specific Features
34. **valorant_rounds** - Valorant round-specific data
35. **valorant_timeouts** - Timeout calls and reasons
36. **moba_objectives** - MOBA objective tracking

### Analytics & Reports
37. **match_reports** - Detailed match reports
38. **performance_analytics** - Player performance metrics
39. **division_statistics** - Division-wide statistics

### System Tables
40. **system_logs** - Application logging
41. **api_keys** - API key management
42. **settings** - Application settings

## 🛠️ Installation Steps

### 1. Create the Database
```sql
CREATE DATABASE esport_manager;
```

### 2. Create Required Extensions
```sql
-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "hstore";
```

### 3. Create ENUM Types
```sql
-- Division types
CREATE TYPE division_type AS ENUM ('moba', 'tactical');

-- Game states
CREATE TYPE match_state AS ENUM ('scheduled', 'drafting', 'in_progress', 'completed', 'cancelled');

-- Player roles
CREATE TYPE player_role AS ENUM ('carry', 'support', 'mid', 'jungle', 'roam', 'duelist', 'controller', 'initiator', 'sentinel');

-- Match outcomes
CREATE TYPE match_outcome AS ENUM ('victory', 'defeat', 'draw', 'surrender');
```

### 4. Create Tables
Execute the SQL from `postgresql_schema.sql` in your DBeaver editor to create all required tables with proper relationships, indexes, and constraints.

## 🔗 Key Relationships

- **Users ↔ Players**: One-to-one relationship
- **Teams ↔ Players**: One-to-many relationship  
- **Divisions ↔ Games**: One-to-many relationship
- **Matches ↔ Players**: Many-to-many relationship
- **Draft Sessions ↔ Draft Picks/Bans**: One-to-many relationship

## 📊 Important Indexes

The schema includes indexes on:
- Foreign key columns for fast joins
- Searchable columns (email, username, etc.)
- Date columns for efficient time-based queries
- Enum columns for filtering

## 🚀 Quick Start Commands

1. **Execute in DBeaver:**
   ```sql
   -- Copy and execute the contents of postgresql_schema.sql
   ```

2. **Verify Installation:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

3. **Check Extensions:**
   ```sql
   SELECT extname FROM pg_extension;
   ```

## ⚠️ Important Notes

- **Foreign Key Constraints**: Ensure referential integrity
- **Cascading Deletes**: Be careful with cascade options
- **Index Performance**: Some indexes are large but necessary for performance
- **Data Types**: PostgreSQL-specific data types are used for optimal performance
- **JSON Fields**: Some tables use JSONB for flexible data storage

The comprehensive schema is ready in the `postgresql_schema.sql` file for immediate execution!