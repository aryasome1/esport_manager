"""
Team Management Router
Handles team CRUD operations, player assignments, chemistry calculations, and team analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Team, Player, Coach, Match, User
from ..schemas.schemas import (
    TeamCreate, TeamUpdate, Team as TeamSchema,
    TeamWithDetails, RoleType, DivisionType, PaginationParams, 
    PaginatedResponse, BaseResponse, ErrorResponse
)

router = APIRouter(prefix="/teams", tags=["Teams"])
logger = logging.getLogger(__name__)

def get_team_or_404(db: Session, team_id: int) -> Team:
    """Helper function to get team or raise 404"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found"
        )
    return team

@router.get("/", response_model=PaginatedResponse)
async def get_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    division: Optional[DivisionType] = Query(None),
    search: Optional[str] = Query(None),
    min_wins: Optional[int] = Query(None, ge=0),
    coach_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all teams with optional filtering and pagination
    """
    try:
        query = db.query(Team)
        
        # Apply filters
        if division:
            query = query.filter(Team.division_type == division.value)
        
        if coach_id:
            query = query.filter(Team.coach_id == coach_id)
        
        if min_wins is not None:
            query = query.filter(Team.wins >= min_wins)
        
        if search:
            search_filter = or_(
                Team.name.ilike(f"%{search}%"),
                Team.name_short.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering (sort by win rate)
        teams = query.order_by(
            (Team.wins / func.nullif(Team.total_matches, 0)).desc(),
            Team.wins.desc()
        ).offset(skip).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=teams,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching teams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch teams"
        )

@router.get("/{team_id}", response_model=TeamWithDetails)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get team details with players and coach
    """
    try:
        team = get_team_or_404(db, team_id)
        
        # Get team with relationships
        team_with_players = db.query(Team).filter(Team.id == team_id).first()
        players = db.query(Player).filter(Player.team_id == team_id).all()
        coach = None
        if team.coach_id:
            coach = db.query(Coach).filter(Coach.id == team.coach_id).first()
        
        response_data = {
            **team_with_players.__dict__,
            'players': players,
            'coach': coach
        }
        
        return TeamWithDetails(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team {team_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch team details"
        )

@router.post("/", response_model=TeamSchema, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new team
    """
    try:
        # Check if team name already exists
        existing_team = db.query(Team).filter(
            or_(Team.name == team_data.name, Team.name_short == team_data.name_short)
        ).first()
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team with this name or abbreviation already exists"
            )
        
        # Validate coach if provided
        if team_data.coach_id:
            coach = db.query(Coach).filter(Coach.id == team_data.coach_id).first()
            if not coach:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coach not found"
                )
        
        # Create team
        db_team = Team(
            name=team_data.name,
            name_short=team_data.name_short,
            coach_id=team_data.coach_id,
            division_type=team_data.division_type.value if team_data.division_type else "moba"
        )
        
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        
        logger.info(f"Team created: {team_data.name}")
        return db_team
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create team"
        )

@router.put("/{team_id}", response_model=TeamSchema)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update team details
    """
    try:
        team = get_team_or_404(db, team_id)
        update_data = team_update.dict(exclude_unset=True)
        
        # Validate coach if updating
        if "coach_id" in update_data and update_data["coach_id"]:
            coach = db.query(Coach).filter(Coach.id == update_data["coach_id"]).first()
            if not coach:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coach not found"
                )
        
        # Update fields
        for field, value in update_data.items():
            if field == "division_type" and value:
                setattr(team, field, value.value)
            else:
                setattr(team, field, value)
        
        team.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(team)
        
        logger.info(f"Team updated: {team.name}")
        return team
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating team {team_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update team"
        )

@router.delete("/{team_id}", response_model=BaseResponse)
async def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete team
    """
    try:
        team = get_team_or_404(db, team_id)
        
        # Check if team has players
        players_count = db.query(Player).filter(Player.team_id == team_id).count()
        if players_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete team that has players. Remove players first."
            )
        
        # Check if team has matches
        matches_count = db.query(Match).filter(
            or_(Match.team1_id == team_id, Match.team2_id == team_id)
        ).count()
        if matches_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete team that has matches. Remove matches first."
            )
        
        db.delete(team)
        db.commit()
        
        logger.info(f"Team deleted: {team.name}")
        return BaseResponse(message="Team deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting team {team_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete team"
        )

@router.post("/{team_id}/add-player/{player_id}", response_model=BaseResponse)
async def add_player_to_team(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add player to team
    """
    try:
        team = get_team_or_404(db, team_id)
        player = db.query(Player).filter(Player.id == player_id).first()
        
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with id {player_id} not found"
            )
        
        # Check if player is already in another team
        if player.team_id and player.team_id != team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player is already in another team"
            )
        
        # Check if team already has a player for this role
        existing_player_role = db.query(Player).filter(
            and_(Player.team_id == team_id, Player.current_role == player.current_role)
        ).first()
        
        if existing_player_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team already has a {player.current_role} player"
            )
        
        # Add player to team
        player.team_id = team_id
        player.updated_at = datetime.utcnow()
        
        # Recalculate team chemistry
        await recalculate_team_chemistry(team_id, db)
        
        db.commit()
        
        logger.info(f"Player {player.name} added to team {team.name}")
        return BaseResponse(message=f"Player {player.name} added to team successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding player to team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add player to team"
        )

@router.post("/{team_id}/remove-player/{player_id}", response_model=BaseResponse)
async def remove_player_from_team(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove player from team
    """
    try:
        team = get_team_or_404(db, team_id)
        player = db.query(Player).filter(
            and_(Player.id == player_id, Player.team_id == team_id)
        ).first()
        
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with id {player_id} not found in this team"
            )
        
        # Remove player from team
        player.team_id = None
        player.updated_at = datetime.utcnow()
        
        # Recalculate team chemistry
        await recalculate_team_chemistry(team_id, db)
        
        db.commit()
        
        logger.info(f"Player {player.name} removed from team {team.name}")
        return BaseResponse(message=f"Player {player.name} removed from team successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing player from team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove player from team"
        )

async def recalculate_team_chemistry(team_id: int, db: Session):
    """
    Recalculate team chemistry based on player compatibility
    """
    try:
        players = db.query(Player).filter(Player.team_id == team_id).all()
        
        if len(players) < 2:
            # Default chemistry for teams with fewer than 2 players
            team = db.query(Team).filter(Team.id == team_id).first()
            team.team_chemistry = 50.0
            return
        
        # Calculate chemistry based on player attributes
        total_chemistry = 0.0
        comparisons = 0
        
        for i in range(len(players)):
            for j in range(i + 1, len(players)):
                player1 = players[i]
                player2 = players[j]
                
                # Role synergy (complementary roles increase chemistry)
                role_synergy = calculate_role_synergy(player1.current_role, player2.current_role)
                
                # Experience level similarity
                exp_similarity = 1.0 - abs(player1.experience_level - player2.experience_level) / 10.0
                
                # Attribute compatibility (focus, mental, etc.)
                attr_compatibility = (
                    1.0 - abs(player1.focus - player2.focus) / 100.0 +
                    1.0 - abs(player1.mental - player2.mental) / 100.0 +
                    1.0 - abs(player1.fatigue - player2.fatigue) / 100.0
                ) / 3.0
                
                player_chemistry = (role_synergy + exp_similarity + attr_compatibility) / 3.0
                total_chemistry += player_chemistry
                comparisons += 1
        
        # Calculate average chemistry
        if comparisons > 0:
            avg_chemistry = (total_chemistry / comparisons) * 100.0
        else:
            avg_chemistry = 50.0
        
        # Update team chemistry
        team = db.query(Team).filter(Team.id == team_id).first()
        team.team_chemistry = round(avg_chemistry, 2)
        
    except Exception as e:
        logger.error(f"Error recalculating team chemistry: {e}")

def calculate_role_synergy(role1: str, role2: str) -> float:
    """
    Calculate chemistry between two roles
    """
    # Define role synergies (0.0 to 1.0)
    synergies = {
        ('jungle', 'roam'): 0.9,
        ('midlane', 'goldlane'): 0.8,
        ('midlane', 'exp_su'): 0.7,
        ('jungle', 'goldlane'): 0.6,
        ('jungle', 'midlane'): 0.7,
        ('jungle', 'exp_su'): 0.8,
        ('roam', 'goldlane'): 0.6,
        ('roam', 'exp_su'): 0.7,
        ('midlane', 'jungle'): 0.7,
        ('goldlane', 'exp_su'): 0.8,
    }
    
    # Check both directions
    if (role1, role2) in synergies:
        return synergies[(role1, role2)]
    elif (role2, role1) in synergies:
        return synergies[(role2, role1)]
    else:
        return 0.5  # Default neutral chemistry

@router.get("/{team_id}/analytics")
async def get_team_analytics(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive team analytics
    """
    try:
        team = get_team_or_404(db, team_id)
        
        # Get team members
        players = db.query(Player).filter(Player.team_id == team_id).all()
        coach = None
        if team.coach_id:
            coach = db.query(Coach).filter(Coach.id == team.coach_id).first()
        
        # Get team matches
        team_matches = db.query(Match).filter(
            or_(Match.team1_id == team_id, Match.team2_id == team_id)
        ).all()
        
        # Calculate analytics
        total_matches = len(team_matches)
        win_rate = (team.wins / team.total_matches * 100) if team.total_matches > 0 else 0
        
        # Player statistics
        player_stats = []
        for player in players:
            # Calculate player contribution to team performance
            player_matches_won = sum(1 for match in team_matches if match.winner_team_id == team_id)
            player_impact = (player.ovr * player_matches_won) / max(total_matches, 1)
            
            player_stats.append({
                "player": player,
                "role": player.current_role,
                "ovr": player.ovr,
                "impact_score": round(player_impact, 2),
                "focus": player.focus,
                "mental": player.mental,
                "fatigue": player.fatigue
            })
        
        # Sort players by impact
        player_stats.sort(key=lambda x: x["impact_score"], reverse=True)
        
        # Role distribution
        role_distribution = {}
        for player in players:
            role = player.current_role
            role_distribution[role] = role_distribution.get(role, 0) + 1
        
        # Recent form (last 5 matches)
        recent_matches = sorted(team_matches, key=lambda x: x.scheduled_at, reverse=True)[:5]
        recent_wins = sum(1 for match in recent_matches if match.winner_team_id == team_id)
        recent_form = (recent_wins / len(recent_matches) * 100) if recent_matches else 0
        
        # Coach impact
        coach_impact = None
        if coach:
            coach_impact = {
                "coach": coach,
                "tactical_knowledge": coach.tactical_knowledge,
                "experience_years": coach.experience_years,
                "motivational_impact": coach.motivational_impact,
                "strategic_impact": coach.strategic_impact
            }
        
        analytics = {
            "team": team,
            "coach": coach_impact,
            "player_count": len(players),
            "total_matches": total_matches,
            "win_rate": round(win_rate, 2),
            "team_chemistry": team.team_chemistry,
            "recent_form": round(recent_form, 2),
            "role_distribution": role_distribution,
            "player_stats": player_stats,
            "strengths": identify_team_strengths(player_stats, role_distribution),
            "weaknesses": identify_team_weaknesses(player_stats, role_distribution),
            "recommendations": generate_team_recommendations(player_stats, team.team_chemistry)
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team analytics {team_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch team analytics"
        )

def identify_team_strengths(player_stats: List[Dict], role_distribution: Dict) -> List[str]:
    """Identify team strengths based on player statistics"""
    strengths = []
    
    # Check for high OVR players
    high_ovr_players = [p for p in player_stats if p["ovr"] >= 80]
    if len(high_ovr_players) >= 2:
        strengths.append(f"Strong individual players ({len(high_ovr_players)} players with OVR 80+)")
    
    # Check team chemistry
    # This would need the actual team chemistry value
    # For now, return placeholder
    
    # Check role distribution balance
    if len(role_distribution) >= 4:
        strengths.append("Well-balanced team composition")
    
    return strengths

def identify_team_weaknesses(player_stats: List[Dict], role_distribution: Dict) -> List[str]:
    """Identify team weaknesses based on player statistics"""
    weaknesses = []
    
    # Check for low OVR players
    low_ovr_players = [p for p in player_stats if p["ovr"] < 60]
    if len(low_ovr_players) > 0:
        weaknesses.append(f"Players needing improvement ({len(low_ovr_players)} players with OVR < 60)")
    
    # Check role gaps
    required_roles = ["jungle", "midlane", "goldlane", "exp_su", "roam"]
    missing_roles = [role for role in required_roles if role not in role_distribution]
    if missing_roles:
        weaknesses.append(f"Missing roles: {', '.join(missing_roles)}")
    
    return weaknesses

def generate_team_recommendations(player_stats: List[Dict], team_chemistry: float) -> List[str]:
    """Generate recommendations for team improvement"""
    recommendations = []
    
    # Chemistry recommendations
    if team_chemistry < 60:
        recommendations.append("Focus on team building exercises to improve chemistry")
    
    # Player development recommendations
    low_focus_players = [p for p in player_stats if p["focus"] < 70]
    if low_focus_players:
        recommendations.append("Provide focus training for players with low concentration")
    
    # Fatigue management
    high_fatigue_players = [p for p in player_stats if p["fatigue"] > 80]
    if high_fatigue_players:
        recommendations.append("Implement rest schedules for players with high fatigue levels")
    
    return recommendations

# Import necessary modules
from datetime import datetime
from sqlalchemy import or_