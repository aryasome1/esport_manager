"""
API routers for eSports Manager
"""

from .draft import router as draft_router
from .auth import router as auth_router
from .players import router as players_router
from .heroes import router as heroes_router
from .teams import router as teams_router
from .coaches import router as coaches_router
from .matches import router as matches_router
from .training import router as training_router
from .divisions import router as divisions_router
from .valorant import router as valorant_router
from .ai_opponents import router as ai_opponents_router