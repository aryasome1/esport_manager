"""
WebSocket Manager for real-time updates
Handles real-time communication for draft sessions and match updates
"""
from typing import Dict, List, Set
import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Connection storage: session_id -> set of WebSocket connections
        self.draft_connections: Dict[int, Set[WebSocket]] = {}
        self.match_connections: Dict[int, Set[WebSocket]] = {}
        
    async def connect(self):
        """Initialize WebSocket manager"""
        logger.info("WebSocket Manager initialized")
    
    async def disconnect(self):
        """Clean up all WebSocket connections"""
        logger.info("WebSocket Manager disconnecting...")
        # Close all connections
        for connections in self.draft_connections.values():
            for ws in connections:
                try:
                    await ws.close()
                except:
                    pass
        for connections in self.match_connections.values():
            for ws in connections:
                try:
                    await ws.close()
                except:
                    pass
    
    async def connect_draft_session(self, websocket: WebSocket, session_token: str):
        """Connect to draft session WebSocket"""
        await websocket.accept()
        
        # Add connection to draft session
        if session_token not in self.draft_connections:
            self.draft_connections[session_token] = set()
        self.draft_connections[session_token].add(websocket)
        
        logger.info(f"Client connected to draft session {session_token}")
        
        try:
            while True:
                # Keep connection alive and handle client messages
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    await self.handle_draft_message(websocket, session_token, message)
                except json.JSONDecodeError:
                    await self.send_message(websocket, {"error": "Invalid JSON"})
                except Exception as e:
                    logger.error(f"Error handling draft message: {e}")
                    await self.send_message(websocket, {"error": str(e)})
                    
        except WebSocketDisconnect:
            logger.info(f"Client disconnected from draft session {session_token}")
        except Exception as e:
            logger.error(f"WebSocket error in draft session {session_token}: {e}")
        finally:
            # Clean up connection
            if session_token in self.draft_connections:
                self.draft_connections[session_token].discard(websocket)
                if not self.draft_connections[session_token]:
                    del self.draft_connections[session_token]
    
    async def connect_match(self, websocket: WebSocket, match_id: int):
        """Connect to match WebSocket"""
        await websocket.accept()
        
        # Add connection to match
        if match_id not in self.match_connections:
            self.match_connections[match_id] = set()
        self.match_connections[match_id].add(websocket)
        
        logger.info(f"Client connected to match {match_id}")
        
        try:
            while True:
                # Keep connection alive and handle client messages
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    await self.handle_match_message(websocket, match_id, message)
                except json.JSONDecodeError:
                    await self.send_message(websocket, {"error": "Invalid JSON"})
                except Exception as e:
                    logger.error(f"Error handling match message: {e}")
                    await self.send_message(websocket, {"error": str(e)})
                    
        except WebSocketDisconnect:
            logger.info(f"Client disconnected from match {match_id}")
        except Exception as e:
            logger.error(f"WebSocket error in match {match_id}: {e}")
        finally:
            # Clean up connection
            if match_id in self.match_connections:
                self.match_connections[match_id].discard(websocket)
                if not self.match_connections[match_id]:
                    del self.match_connections[match_id]
    
    async def broadcast_draft_update(self, session_id: int, update_data: dict):
        """Broadcast draft update to all connected clients"""
        if session_id not in self.draft_connections:
            return
        
        message = {
            "type": "draft_update",
            "session_id": session_id,
            "data": update_data
        }
        
        # Send to all connected clients
        disconnected = set()
        for websocket in self.draft_connections[session_id]:
            try:
                await self.send_message(websocket, message)
            except WebSocketDisconnect:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Error sending draft update: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self.draft_connections[session_id].discard(ws)
        
        if not self.draft_connections[session_id]:
            del self.draft_connections[session_id]
    
    async def broadcast_match_update(self, match_id: int, update_data: dict):
        """Broadcast match update to all connected clients"""
        if match_id not in self.match_connections:
            return
        
        message = {
            "type": "match_update",
            "match_id": match_id,
            "data": update_data
        }
        
        # Send to all connected clients
        disconnected = set()
        for websocket in self.match_connections[match_id]:
            try:
                await self.send_message(websocket, message)
            except WebSocketDisconnect:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Error sending match update: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self.match_connections[match_id].discard(ws)
        
        if not self.match_connections[match_id]:
            del self.match_connections[match_id]
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send message to specific WebSocket"""
        try:
            await self.send_message(websocket, message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def send_message(self, websocket: WebSocket, message: dict):
        """Send JSON message to WebSocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except WebSocketDisconnect:
            raise
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            raise
    
    async def handle_draft_message(self, websocket: WebSocket, session_id: int, message: dict):
        """Handle incoming draft-related messages"""
        message_type = message.get("type")
        
        if message_type == "ping":
            # Respond to ping with pong
            await self.send_message(websocket, {"type": "pong", "timestamp": message.get("timestamp")})
        
        elif message_type == "draft_state_request":
            # Client requesting current draft state
            # This would typically fetch current state from database
            await self.send_message(websocket, {
                "type": "draft_state_response",
                "session_id": session_id,
                "data": {"status": "draft_state_acknowledged"}
            })
        
        elif message_type == "player_ready":
            # Player indicating readiness for draft
            player_id = message.get("player_id")
            await self.broadcast_draft_update(session_id, {
                "type": "player_ready",
                "player_id": player_id,
                "ready": True
            })
        
        else:
            await self.send_message(websocket, {
                "error": f"Unknown draft message type: {message_type}"
            })
    
    async def handle_match_message(self, websocket: WebSocket, match_id: int, message: dict):
        """Handle incoming match-related messages"""
        message_type = message.get("type")
        
        if message_type == "ping":
            # Respond to ping with pong
            await self.send_message(websocket, {"type": "pong", "timestamp": message.get("timestamp")})
        
        elif message_type == "match_state_request":
            # Client requesting current match state
            await self.send_message(websocket, {
                "type": "match_state_response",
                "match_id": match_id,
                "data": {"status": "match_state_acknowledged"}
            })
        
        elif message_type == "spectator_join":
            # Spectator joining match
            spectator_id = message.get("spectator_id")
            await self.send_message(websocket, {
                "type": "spectator_joined",
                "match_id": match_id,
                "spectator_id": spectator_id
            })
        
        else:
            await self.send_message(websocket, {
                "error": f"Unknown match message type: {message_type}"
            })
    
    def get_connection_count(self, session_id: int) -> int:
        """Get number of active connections for a draft session"""
        return len(self.draft_connections.get(session_id, set()))
    
    def get_match_connection_count(self, match_id: int) -> int:
        """Get number of active connections for a match"""
        return len(self.match_connections.get(match_id, set()))
    
    async def disconnect_client(self, websocket: WebSocket):
        """Manually disconnect a client from all sessions"""
        # Remove from draft sessions
        for session_id in list(self.draft_connections.keys()):
            if websocket in self.draft_connections[session_id]:
                self.draft_connections[session_id].discard(websocket)
                if not self.draft_connections[session_id]:
                    del self.draft_connections[session_id]
        
        # Remove from match sessions
        for match_id in list(self.match_connections.keys()):
            if websocket in self.match_connections[match_id]:
                self.match_connections[match_id].discard(websocket)
                if not self.match_connections[match_id]:
                    del self.match_connections[match_id]
    
    # Broadcast helper methods for different update types
    async def broadcast_draft_pick(self, session_id: int, team_id: int, hero_id: int, role: str = None):
        """Broadcast draft pick to all subscribers"""
        await self.broadcast_draft_update(session_id, {
            "type": "draft_pick",
            "team_id": team_id,
            "hero_id": hero_id,
            "role": role
        })
    
    async def broadcast_draft_ban(self, session_id: int, team_id: int, hero_id: int):
        """Broadcast draft ban to all subscribers"""
        await self.broadcast_draft_update(session_id, {
            "type": "draft_ban",
            "team_id": team_id,
            "hero_id": hero_id
        })
    
    async def broadcast_draft_phase_change(self, session_id: int, new_phase: str):
        """Broadcast draft phase change"""
        await self.broadcast_draft_update(session_id, {
            "type": "phase_change",
            "new_phase": new_phase
        })
    
    async def broadcast_team_turn(self, session_id: int, team_id: int):
        """Broadcast which team's turn it is"""
        await self.broadcast_draft_update(session_id, {
            "type": "team_turn",
            "team_id": team_id
        })
    
    async def broadcast_match_start(self, match_id: int, match_data: dict):
        """Broadcast match start"""
        await self.broadcast_match_update(match_id, {
            "type": "match_start",
            "match_data": match_data
        })
    
    async def broadcast_match_end(self, match_id: int, winner_team_id: int, scores: dict):
        """Broadcast match end"""
        await self.broadcast_match_update(match_id, {
            "type": "match_end",
            "winner_team_id": winner_team_id,
            "scores": scores
        })