"""
Draft Service - Core logic for MOBA draft mechanics
Handles hero assignment, lane preferences, and ban/pick phase management
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import uuid
from datetime import datetime, timedelta

from app.models.models import (
    Player, Hero, Team, Match, DraftSession, DraftPick,
    RoleType, MatchStatus, HeroStat
)
from app.schemas.schemas import (
    DraftSessionResponse, DraftPickResponse, DraftState,
    DraftPickRequest, HeroResponse, TeamResponse
)
from app.services.websocket_manager import WebSocketManager

class DraftService:
    """Service handling all draft-related operations"""
    
    def __init__(self, db: Session, websocket_manager: WebSocketManager = None):
        self.db = db
        self.websocket_manager = websocket_manager
    
    async def create_draft_session(self, match_id: int) -> DraftSessionResponse:
        """Initialize a new draft session for a match"""
        # Validate match exists and teams are ready
        match = self.db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise ValueError(f"Match {match_id} not found")
        
        # Create session token
        session_token = str(uuid.uuid4())
        
        # Create draft session
        draft_session = DraftSession(
            match_id=match_id,
            session_token=session_token,
            phase="waiting",
            started_at=datetime.utcnow()
        )
        
        self.db.add(draft_session)
        self.db.commit()
        self.db.refresh(draft_session)
        
        return self._draft_session_to_response(draft_session)
    
    def validate_hero_lane_assignment(self, hero_id: int, role: RoleType) -> Tuple[bool, str]:
        """Validate if hero can be assigned to specific lane"""
        hero = self.db.query(Hero).filter(Hero.id == hero_id).first()
        if not hero:
            return False, "Hero not found"
        
        # Check if hero has preferred lanes
        if not hero.preferred_lanes:
            return True, "Hero has no lane restrictions"
        
        # Check if hero is role-specific and doesn't match
        if hero.role_specific and role not in hero.preferred_lanes:
            return False, f"Hero {hero.name} is role-specific and cannot play {role.value}"
        
        return True, "Valid assignment"
    
    def check_hero_availability(self, session_id: int, hero_id: int) -> bool:
        """Check if hero is available for pick (not banned or already picked)"""
        # Check if hero is banned
        banned = self.db.query(DraftPick).filter(
            and_(
                DraftPick.session_id == session_id,
                DraftPick.hero_id == hero_id,
                DraftPick.is_ban == True
            )
        ).first()
        
        if banned:
            return False
        
        # Check if hero is already picked
        picked = self.db.query(DraftPick).filter(
            and_(
                DraftPick.session_id == session_id,
                DraftPick.hero_id == hero_id,
                DraftPick.is_ban == False
            )
        ).first()
        
        if picked:
            return False
        
        return True
    
    def validate_team_lineup(self, team_id: int, hero_assignments: Dict[RoleType, int]) -> Tuple[bool, List[str]]:
        """Validate team lineup against role requirements"""
        errors = []
        required_roles = set(RoleType)
        provided_roles = set(hero_assignments.keys())
        
        # Check if all required roles are present
        missing_roles = required_roles - provided_roles
        if missing_roles:
            errors.append(f"Missing roles: {', '.join([role.value for role in missing_roles])}")
        
        # Check if each role is filled by exactly one hero
        if len(provided_roles) != len(required_roles):
            errors.append(f"Team must have exactly {len(required_roles)} roles filled")
        
        return len(errors) == 0, errors
    
    def calculate_player_effectiveness(self, player_id: int, hero_id: int) -> float:
        """Calculate player's effectiveness with specific hero"""
        # Get player's base attributes
        player = self.db.query(Player).filter(Player.id == player_id).first()
        if not player:
            return 0.0
        
        # Get hero-specific stats
        hero_stat = self.db.query(HeroStat).filter(
            and_(
                HeroStat.player_id == player_id,
                HeroStat.hero_id == hero_id
            )
        ).first()
        
        # Calculate effectiveness
        base_effectiveness = player.ovr * 0.4  # Base OVR contributes 40%
        
        # Hero power contribution
        hero_power = hero_stat.hero_power if hero_stat else 0.0
        hero_effectiveness = hero_power * 0.3  # Hero power contributes 30%
        
        # Mental and focus state contribution
        mental_factor = player.mental * 0.15  # Mental contributes 15%
        focus_factor = player.focus * 0.15    # Focus contributes 15%
        
        # Fatigue penalty
        fatigue_penalty = player.fatigue * 0.1  # Fatigue reduces by 10%
        
        total_effectiveness = (
            base_effectiveness + 
            hero_effectiveness + 
            mental_factor + 
            focus_factor - 
            fatigue_penalty
        )
        
        return min(100.0, max(0.0, total_effectiveness))
    
    def predict_team_strength(self, team_id: int, hero_assignments: Dict[RoleType, int]) -> float:
        """Predict overall team strength based on current draft"""
        total_strength = 0.0
        player_count = 0
        
        for role, hero_id in hero_assignments.items():
            # Get player in this role (simplified - in reality, you'd need team composition)
            # For now, we'll use the first available player
            player = self.db.query(Player).filter(
                Player.team_id == team_id
            ).first()
            
            if player:
                effectiveness = self.calculate_player_effectiveness(player.id, hero_id)
                total_strength += effectiveness
                player_count += 1
        
        return total_strength / player_count if player_count > 0 else 0.0
    
    async def make_pick_or_ban(self, session_token: str, team_id: int, pick_request: DraftPickRequest) -> DraftSessionResponse:
        """Process a pick or ban in the draft"""
        # Get draft session
        session = self.db.query(DraftSession).filter(
            DraftSession.session_token == session_token
        ).first()
        
        if not session:
            raise ValueError("Draft session not found")
        
        # Validate it's the team's turn
        if session.current_team_id != team_id:
            raise ValueError("Not your team's turn")
        
        # Validate phase
        if pick_request.is_ban and session.phase != "ban":
            raise ValueError("Cannot ban during pick phase")
        elif not pick_request.is_ban and session.phase != "pick":
            raise ValueError("Cannot pick during ban phase")
        
        # Check ban count
        if pick_request.is_ban and session.ban_count_left <= 0:
            raise ValueError("No bans remaining")
        
        # Validate hero availability
        if not self.check_hero_availability(session.id, pick_request.hero_id):
            raise ValueError("Hero is not available")
        
        # If it's a pick, validate lane assignment
        if not pick_request.is_ban and pick_request.role_assigned:
            is_valid, error_msg = self.validate_hero_lane_assignment(
                pick_request.hero_id, pick_request.role_assigned
            )
            if not is_valid:
                raise ValueError(f"Invalid lane assignment: {error_msg}")
        
        # Create draft pick record
        draft_pick = DraftPick(
            session_id=session.id,
            hero_id=pick_request.hero_id,
            team_id=team_id,
            is_ban=pick_request.is_ban,
            role_assigned=pick_request.role_assigned,
            turn_number=session.turn_number + 1
        )
        
        self.db.add(draft_pick)
        
        # Update session state
        session.turn_number += 1
        if pick_request.is_ban:
            session.ban_count_left -= 1
        
        # Switch to next team
        match = self.db.query(Match).filter(Match.id == session.match_id).first()
        if team_id == match.team1_id:
            session.current_team_id = match.team2_id
        else:
            session.current_team_id = match.team1_id
        
        # Determine next phase
        self._determine_next_phase(session, match)
        
        self.db.commit()
        self.db.refresh(session)
        
        # Broadcast update via WebSocket
        if self.websocket_manager:
            await self.websocket_manager.broadcast_draft_update(session.id, {
                "type": "pick" if not pick_request.is_ban else "ban",
                "team_id": team_id,
                "hero_id": pick_request.hero_id,
                "role": pick_request.role_assigned.value if pick_request.role_assigned else None,
                "turn_number": draft_pick.turn_number
            })
        
        return self._draft_session_to_response(session)
    
    def _determine_next_phase(self, session: DraftSession, match: Match):
        """Determine the next phase of the draft"""
        # Simple phase progression - in a real implementation, this would be more complex
        if session.phase == "waiting":
            session.phase = "ban"
        elif session.phase == "ban":
            # Check if all bans are complete
            total_bans = self.db.query(DraftPick).filter(
                and_(
                    DraftPick.session_id == session.id,
                    DraftPick.is_ban == True
                )
            ).count()
            
            if total_bans >= 6:  # 3 bans per team
                session.phase = "pick"
        elif session.phase == "pick":
            # Check if draft is complete (5 picks per team = 10 total)
            total_picks = self.db.query(DraftPick).filter(
                and_(
                    DraftPick.session_id == session.id,
                    DraftPick.is_ban == False
                )
            ).count()
            
            if total_picks >= 10:
                session.phase = "completed"
                session.completed_at = datetime.utcnow()
    
    def get_draft_state(self, session_token: str) -> DraftState:
        """Get current draft state with all necessary information"""
        session = self.db.query(DraftSession).filter(
            DraftSession.session_token == session_token
        ).first()
        
        if not session:
            raise ValueError("Draft session not found")
        
        # Get all draft picks
        draft_picks = self.db.query(DraftPick).filter(
            DraftPick.session_id == session.id
        ).all()
        
        # Get available heroes (not banned or picked)
        banned_hero_ids = [dp.hero_id for dp in draft_picks if dp.is_ban]
        picked_hero_ids = [dp.hero_id for dp in draft_picks if not dp.is_ban]
        unavailable_hero_ids = banned_hero_ids + picked_hero_ids
        
        available_heroes = self.db.query(Hero).filter(
            ~Hero.id.in_(unavailable_hero_ids)
        ).all()
        
        # Build team lineups
        match = self.db.query(Match).filter(Match.id == session.match_id).first()
        team1_lineup = self._build_team_lineup(match.team1_id, draft_picks)
        team2_lineup = self._build_team_lineup(match.team2_id, draft_picks)
        
        return DraftState(
            session=self._draft_session_to_response(session),
            available_heroes=available_heroes,
            team1_lineup=team1_lineup,
            team2_lineup=team2_lineup,
            banned_heroes=banned_hero_ids
        )
    
    def _build_team_lineup(self, team_id: int, draft_picks: List[DraftPick]) -> Dict[RoleType, int]:
        """Build current team lineup from draft picks"""
        lineup = {}
        team_picks = [dp for dp in draft_picks if dp.team_id == team_id and not dp.is_ban]
        
        for pick in team_picks:
            if pick.role_assigned:
                lineup[pick.role_assigned] = pick.hero_id
        
        return lineup
    
    def _draft_session_to_response(self, session: DraftSession) -> DraftSessionResponse:
        """Convert DraftSession to response model"""
        # Get draft picks
        draft_picks = self.db.query(DraftPick).filter(
            DraftPick.session_id == session.id
        ).all()
        
        pick_responses = []
        for dp in draft_picks:
            hero = self.db.query(Hero).filter(Hero.id == dp.hero_id).first()
            team = self.db.query(Team).filter(Team.id == dp.team_id).first()
            
            pick_responses.append(DraftPickResponse(
                id=dp.id,
                hero_id=dp.hero_id,
                team_id=dp.team_id,
                is_ban=dp.is_ban,
                role_assigned=dp.role_assigned,
                turn_number=dp.turn_number,
                hero=hero,
                team=team
            ))
        
        # Get current team if exists
        current_team = None
        if session.current_team_id:
            current_team = self.db.query(Team).filter(
                Team.id == session.current_team_id
            ).first()
        
        return DraftSessionResponse(
            id=session.id,
            match_id=session.match_id,
            session_token=session.session_token,
            phase=session.phase,
            current_team_id=session.current_team_id,
            ban_count_left=session.ban_count_left,
            turn_number=session.turn_number,
            max_turns=session.max_turns,
            started_at=session.started_at,
            completed_at=session.completed_at,
            current_team=current_team,
            draft_picks=pick_responses
        )
    
    async def force_complete_draft(self, session_token: str) -> DraftSessionResponse:
        """Force complete a draft session"""
        session = self.db.query(DraftSession).filter(
            DraftSession.session_token == session_token
        ).first()
        
        if not session:
            raise ValueError("Draft session not found")
        
        session.phase = "completed"
        session.completed_at = datetime.utcnow()
        
        # Update match status
        match = self.db.query(Match).filter(Match.id == session.match_id).first()
        match.status = MatchStatus.COMPLETED
        
        self.db.commit()
        self.db.refresh(session)
        
        return self._draft_session_to_response(session)