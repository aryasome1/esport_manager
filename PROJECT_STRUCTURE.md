# eSports Multi-Division Manager - Project Structure

## 📁 Project Overview

This is a comprehensive eSports management simulation game supporting **multiple divisions**:
- **MOBA Division**: Mobile Legends-style 5v5 tactical gameplay  
- **Tactical Shooter Division**: Valorant-style competitive shooter with adaptive AI

## 🏗️ Architecture

- **Frontend**: Expo Go (React Native) for cross-platform mobile development
- **Backend**: Python FastAPI with SQLAlchemy and PostgreSQL
- **Real-time Communication**: WebSocket for live draft and match updates
- **Authentication**: JWT-based authentication system
- **Multi-Division Support**: Unified architecture for different eSports types

## 📂 Directory Structure

```
esport-manager/
├── README.md                          # Project overview and setup instructions
│
├── frontend/                          # React Native mobile application
│   ├── package.json                   # Dependencies and scripts
│   ├── App.js                         # Multi-division app entry point
│   ├── app.json                       # Expo configuration
│   └── src/                           # Source code
│       ├── theme/                     # Theme and styling
│       │   └── theme.js               # Complete design system
│       ├── components/                # Reusable UI components
│       │   ├── common/                # Common components
│       │   │   ├── LoadingScreen.js
│       │   │   └── ErrorMessage.js
│       │   ├── navigation/            # Navigation components
│       │   │   └── TabBarIcon.js
│       │   ├── draft/                 # MOBA draft components
│       │   │   ├── DraftMap.js        # MOBA visual draft map
│       │   │   ├── HeroCard.js        # Hero display component
│       │   │   ├── TeamPanel.js       # Team composition panel
│       │   │   ├── DraftPhaseIndicator.js
│       │   │   └── BanPickPanel.js    # Ban/pick interface
│       │   └── valorant/              # Tactical shooter components
│       │       ├── TacticalMapView.js # Animated Valorant map
│       │       ├── AgentSelectionPanel.js # Agent selection
│       │       ├── TeamCompositionView.js # Team setup
│       │       ├── AIOpponentDisplay.js   # AI opponent info
│       │       ├── TimeoutInterface.js    # Timeout management
│       │       ├── RoundInterface.js     # Round controls
│       │       ├── Scoreboard.js         # Match scoreboard
│       │       ├── TeamStats.js          # Team statistics
│       │       └── MatchControls.js      # Match interface
│       ├── screens/                   # Screen components
│       │   ├── WelcomeScreen.js       # App landing page
│       │   ├── auth/                  # Authentication screens
│       │   ├── division/              # Division selection
│       │   │   └── DivisionSelectionScreen.js # Division chooser
│       │   ├── main/                  # MOBA division screens
│       │   │   ├── HomeScreen.js      # MOBA dashboard
│       │   │   ├── TeamScreen.js      # Team management
│       │   │   ├── HeroesScreen.js    # Hero management
│       │   │   ├── DraftScreen.js     # MOBA draft interface
│       │   │   ├── MatchesScreen.js   # Match history/results
│       │   │   ├── MatchReportScreen.js # Match reports
│       │   │   └── ProfileScreen.js   # User profile
│       │   └── valorant/              # Tactical shooter screens
│       │       ├── ValorantDraftScreen.js # Agent selection
│       │       ├── ValorantMatchSim.js     # Match simulation
│       │       ├── AgentSelectScreen.js    # Agent management
│       │       └── MapPoolScreen.js        # Map selection
│       ├── services/                  # API and business logic
│       │   ├── AuthService.js         # Authentication API
│       │   ├── DivisionService.js     # Division management
│       │   ├── DraftService.js        # MOBA draft mechanics
│       │   ├── ValorantService.js     # Tactical shooter mechanics
│       │   ├── AIOpponentService.js   # Adaptive AI system
│       │   ├── HeroService.js         # MOBA hero management
│       │   ├── TeamService.js         # Team operations
│       │   └── MatchService.js        # Match handling
│       ├── contexts/                  # React contexts
│       │   ├── AuthContext.js         # Authentication state
│       │   └── WebSocketContext.js    # Real-time communication
│       └── utils/                     # Utility functions
│           ├── api.js                 # API client
│           ├── validation.js          # Input validation
│           └── constants.js           # App constants
│
└── backend/                           # FastAPI Python backend
    ├── requirements.txt               # Python dependencies
    ├── app/                           # Application code
    │   ├── main.py                    # Multi-division FastAPI app
    │   ├── database.py                # Database configuration
    │   ├── models/                    # SQLAlchemy models
    │   │   ├── models.py              # Core MOBA models
    │   │   └── division_models.py     # Multi-division models
    │   ├── schemas/                   # Pydantic schemas
    │   │   └── schemas.py             # Request/response models
    │   ├── routers/                   # API route handlers
    │   │   ├── __init__.py
    │   │   ├── auth.py                # Authentication endpoints
    │   │   ├── divisions.py           # Division management
    │   │   ├── players.py             # Player management
    │   │   ├── heroes.py              # MOBA hero operations
    │   │   ├── teams.py               # Team management
    │   │   ├── coaches.py             # Coach system
    │   │   ├── matches.py             # Match handling
    │   │   ├── draft.py               # MOBA draft mechanics
    │   │   ├── training.py            # Player training
    │   │   ├── valorant.py            # Tactical shooter endpoints
    │   │   └── ai_opponents.py        # AI opponent management
    │   ├── services/                  # Business logic services
    │   │   ├── draft_service.py       # MOBA draft mechanics
    │   │   ├── valorant_service.py    # Tactical shooter mechanics
    │   │   ├── ai_opponent_service.py # Adaptive AI system
    │   │   ├── websocket_manager.py   # Real-time updates
    │   │   ├── player_service.py      # Player operations
    │   │   ├── team_service.py        # Team management
    │   │   └── match_service.py       # Match logic
    │   ├── utils/                     # Utility functions
    │   │   ├── auth_utils.py          # Authentication helpers
    │   │   ├── draft_utils.py         # Draft calculations
    │   │   └── validation.py          # Input validation
    │   └── middleware/                # FastAPI middleware
    │       ├── auth_middleware.py     # JWT authentication
    │       └── cors_middleware.py     # CORS configuration
    ├── alembic/                       # Database migrations
    ├── tests/                         # Backend tests
    └── scripts/                       # Deployment scripts
```

## 🎮 Division System Architecture

### **MOBA Division (Mobile Legends Style)**

#### Core Features:
- **Team Composition**: 5 roles (Goldlane, Explane, Midlane, Jungle, Roam)
- **Hero Drafting**: 3-ban system with real-time validation
- **Hero Assignment**: Lane-based hero restrictions
- **Coach Dynamics**: 4 archetypes affecting player performance
- **Player Attributes**: OVR, Hero Power, Focus, Mental, Fatigue
- **Training System**: Hero power development

#### Implementation:
```
Frontend:
- DraftScreen.js (Main interface)
- DraftMap.js (Visual map layout)
- BanPickPanel.js (Draft controls)

Backend:
- DraftService (Core mechanics)
- WebSocketManager (Real-time updates)
```

### **Tactical Shooter Division (Valorant Style)**

#### Core Features:
- **Agent Selection**: Role-based agent system (Duelist, Controller, Initiator, Sentinel)
- **Map Pool**: Tactical map selection with role preferences
- **Timeout System**: Tactical timeouts for strategy adjustment
- **Adaptive AI**: Pattern recognition and strategy adaptation
- **Match Simulation**: Real-time tactical map with agent movements
- **Economic System**: Pistol, Eco, Force, Full-buy rounds

#### Implementation:
```
Frontend:
- ValorantDraftScreen.js (Agent selection)
- ValorantMatchSim.js (Match simulation)
- TacticalMapView.js (Animated map)
- TimeoutInterface.js (Tactical timeouts)

Backend:
- ValorantMatchService (Tactical mechanics)
- AdaptiveAIOpponent (AI behavior)
- AIOpponentService (Pattern recognition)
```

## 🤖 Adaptive AI System

### **AI Opponent Capabilities:**
- **Pattern Recognition**: Analyzes human play patterns
- **Strategy Adaptation**: Rotates tactics based on performance
- **Timeout Usage**: Strategic timeout calls
- **Agent Selection**: Picks counters to human preferences
- **Economic Management**: Adaptive buy/save strategies

### **AI Learning Process:**
```python
AI System Flow:
1. Analyze human patterns (agent preferences, map choices, timeout usage)
2. Select adaptive strategy based on patterns
3. Execute tactical decisions during match
4. Update performance metrics
5. Adjust difficulty and behavior
```

## 🔧 Technical Implementation

### **Multi-Division Architecture:**

```python
# Division Management
class Division(Base):
    division_type: DivisionType  # MOBA or TACTICAL
    has_draft_system: bool
    has_timeout_system: bool
    has_agent_selection: bool
    has_map_pool: bool
    has_ai_opponent: bool

# Division-Specific Models
class Agent(Base):              # Valorant agents
class Map(Base):               # Tactical shooter maps
class AIOpponent(Base):        # Adaptive AI opponents
class Hero(Base):              # MOBA heroes (existing)
```

### **Frontend Navigation Flow:**
```
Authentication → Division Selection → Division-Specific Interface
                                    ├── MOBA Division
                                    │   ├── Team Management
                                    │   ├── Hero Drafting
                                    │   └── Match History
                                    └── Tactical Division
                                        ├── Agent Selection
                                        ├── Map Pool
                                        ├── AI Matches
                                        └── Tactical Simulation
```

### **Backend Service Architecture:**
```
Core Services:
├── DraftService (MOBA mechanics)
├── ValorantMatchService (Tactical mechanics)
├── AIOpponentService (AI behavior)
└── WebSocketManager (Real-time updates)

Division-Specific Features:
MOBA: Hero assignment, lane validation, coach dynamics
TACTICAL: Agent mastery, map advantages, economic system, AI adaptation
```

## 📊 Player Attribute Systems

### **MOBA Attributes:**
```
- OVR (Overall Rating): Base capability
- Hero Power: Per-hero proficiency
- Focus: Concentration level
- Mental: Psychological state
- Fatigue: Current tiredness
- Team Chemistry: Synergy bonus
```

### **Tactical Shooter Attributes:**
```
- OVR (Overall Rating): Base FPS skill
- Tactical Aim: Shooting accuracy
- Tactical Movement: Positioning skill
- Tactical Gamesense: Map awareness
- Tactical Communication: Team coordination
- Agent Mastery: Per-agent proficiency
```

## 🎯 Game Mode System

### **MOBA Game Modes:**
- **Ranked MOBA**: Competitive 5v5 with full draft
- **Casual MOBA**: Quick matches with training-focused AI

### **Tactical Shooter Game Modes:**
- **Ranked Tactical**: Competitive 5v5 with tactical depth
- **Tactical vs AI**: Practice against adaptive AI
- **Tournament Tactical**: High-stakes competitive matches

## 📱 Mobile App Features

### **Division Selection Interface:**
- Visual division cards with feature comparison
- Real-time player statistics per division
- Game mode preview and selection
- Division-specific theming and navigation

### **MOBA Interface:**
- Real-time draft map with team composition
- Hero ban/pick interface with statistics
- Coach assignment and team management
- Training progress and hero development

### **Tactical Shooter Interface:**
- Agent selection with role validation
- Tactical map with animated agent movements
- Real-time timeout and tactical decision interface
- AI opponent behavior and adaptation display
- Match simulation with combat indicators

## 🚀 Real-Time Features

### **WebSocket Integration:**
```javascript
// WebSocket endpoints
/ws/draft/{session_token}     // MOBA draft updates
/ws/match/{match_id}          // General match updates
/ws/valorant/{match_id}       // Tactical match updates

// Real-time capabilities
- Live draft progression
- Match state synchronization
- Tactical decision broadcasting
- AI adaptation notifications
```

## 🔐 Security & Multi-Division Support

### **Division-Based Access Control:**
- Division-specific feature access
- Role-based permissions per division
- Team composition validation
- Game mode restrictions

### **Data Isolation:**
- Division-specific player progression
- Separate match histories
- Independent ranking systems
- Division-specific statistics

## 📈 Analytics & Performance

### **Division Analytics:**
- Cross-division player performance
- Agent vs Hero efficiency comparison
- AI adaptation effectiveness
- Division popularity metrics

### **Performance Monitoring:**
- Real-time match quality metrics
- AI decision effectiveness
- Player engagement per division
- Match completion rates

## 🏆 Key Features Implementation Summary

### **Multi-Division Features:**
- ✅ **Division Selection**: Choose between MOBA and Tactical Shooter
- ✅ **MOBA System**: Complete hero drafting and team management
- ✅ **Tactical System**: Agent selection and match simulation
- ✅ **Adaptive AI**: Pattern recognition and strategy adaptation
- ✅ **Real-time Updates**: Live WebSocket communication
- ✅ **Mobile Optimized**: Touch-friendly interfaces for both divisions
- ✅ **Cross-Division Analytics**: Compare performance across game types

### **Technical Achievements:**
- ✅ **Unified Architecture**: Single codebase supporting multiple genres
- ✅ **Scalable Design**: Easy to add new divisions in the future
- ✅ **Real-time Communication**: WebSocket for instant updates
- ✅ **AI Intelligence**: Adaptive opponents that learn player patterns
- ✅ **Mobile Gaming UX**: Optimized for touch-based tactical gameplay
- ✅ **Performance Analytics**: Detailed metrics for both divisions

This multi-division architecture provides the flexibility to support different eSports genres while maintaining a unified, scalable codebase that can easily expand to include additional game types in the future.

---

**🎮 Two Divisions, One Ultimate eSports Experience! ⚔️🎯**