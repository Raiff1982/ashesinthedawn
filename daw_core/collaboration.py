"""
Real-Time Collaboration Module
Enables multi-user collaborative editing with operational transformation
"""

from typing import Optional, Dict, List, Any, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
import uuid
from enum import Enum

class OperationType(Enum):
    """Types of collaborative operations"""
    TRACK_ADD = "track_add"
    TRACK_UPDATE = "track_update"
    TRACK_DELETE = "track_delete"
    EFFECT_ADD = "effect_add"
    EFFECT_REMOVE = "effect_remove"
    PARAMETER_CHANGE = "parameter_change"
    AUTOMATION_POINT = "automation_point"
    MARKER_ADD = "marker_add"
    VOLUME_CHANGE = "volume_change"

@dataclass
class Operation:
    """Represents a collaborative operation"""
    operation_id: str
    type: OperationType
    user_id: str
    device_id: str
    project_id: str
    timestamp: str
    data: Dict[str, Any]
    version: int = 1
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "type": self.type.value,
            "user_id": self.user_id,
            "device_id": self.device_id,
            "project_id": self.project_id,
            "timestamp": self.timestamp,
            "data": self.data,
            "version": self.version
        }

@dataclass
class OperationTransform:
    """Result of transforming two concurrent operations"""
    operation_a: Operation
    operation_b: Operation
    transformed_a: Operation
    transformed_b: Operation

class OperationalTransform:
    """Operational Transformation for conflict-free editing"""
    
    @staticmethod
    def transform(op1: Operation, op2: Operation) -> OperationTransform:
        """Transform two concurrent operations to maintain consistency"""
        
        # Simple strategy: timestamp-based precedence
        # In production: implement full OT algorithm
        
        if op1.timestamp < op2.timestamp:
            # op1 happened first
            transformed_a = op1
            transformed_b = OperationalTransform._adjust_operation(op2, op1)
        else:
            # op2 happened first
            transformed_b = op2
            transformed_a = OperationalTransform._adjust_operation(op1, op2)
        
        return OperationTransform(
            operation_a=op1,
            operation_b=op2,
            transformed_a=transformed_a,
            transformed_b=transformed_b
        )
    
    @staticmethod
    def _adjust_operation(op: Operation, prior_op: Operation) -> Operation:
        """Adjust operation based on prior operation"""
        
        # Simple adjustments based on operation types
        if prior_op.type == OperationType.TRACK_DELETE:
            if op.data.get("track_id") == prior_op.data.get("track_id"):
                # Can't modify deleted track
                return None
        
        # Create adjusted operation
        adjusted = Operation(
            operation_id=op.operation_id,
            type=op.type,
            user_id=op.user_id,
            device_id=op.device_id,
            project_id=op.project_id,
            timestamp=op.timestamp,
            data=op.data.copy(),
            version=op.version + 1
        )
        
        return adjusted

class CollaborationSession:
    """Represents an active collaboration session"""
    
    def __init__(self, project_id: str, session_id: Optional[str] = None):
        self.project_id = project_id
        self.session_id = session_id or f"session_{uuid.uuid4().hex[:12]}"
        self.participants: Dict[str, Dict[str, Any]] = {}  # user_id -> user_info
        self.operations: List[Operation] = []
        self.operation_history: List[Operation] = []
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.last_activity = self.created_at
    
    def add_participant(
        self,
        user_id: str,
        device_id: str,
        user_name: str,
        color: str = "#3B82F6"
    ) -> bool:
        """Add a user to the collaboration session"""
        if user_id not in self.participants:
            self.participants[user_id] = {
                "device_ids": set(),
                "user_name": user_name,
                "color": color,
                "joined_at": datetime.now(timezone.utc).isoformat(),
                "cursor_position": 0,
                "last_activity": datetime.now(timezone.utc).isoformat()
            }
        
        # Add device to user's device list
        self.participants[user_id]["device_ids"].add(device_id)
        print(f"[Collaboration] User {user_name} ({user_id}) joined session {self.session_id}")
        return True
    
    def remove_participant(self, user_id: str) -> bool:
        """Remove a user from the session"""
        if user_id in self.participants:
            del self.participants[user_id]
            print(f"[Collaboration] User {user_id} left session {self.session_id}")
            return True
        return False
    
    def get_participants(self) -> List[Dict[str, Any]]:
        """Get list of active participants"""
        return [
            {
                "user_id": uid,
                "user_name": info["user_name"],
                "color": info["color"],
                "device_count": len(info["device_ids"]),
                "last_activity": info["last_activity"]
            }
            for uid, info in self.participants.items()
        ]
    
    def add_operation(self, operation: Operation) -> bool:
        """Add operation to session and apply OT"""
        
        # Apply operational transformation against pending operations
        for pending_op in self.operations:
            transform_result = OperationalTransform.transform(pending_op, operation)
            operation = transform_result.transformed_b
        
        self.operations.append(operation)
        self.operation_history.append(operation)
        self.last_activity = datetime.now(timezone.utc).isoformat()
        
        print(f"[Collaboration] Operation added: {operation.type.value}")
        return True
    
    def get_operations_since(self, version: int) -> List[Operation]:
        """Get all operations since a specific version"""
        return [op for op in self.operation_history if op.version > version]
    
    def get_session_state(self) -> Dict[str, Any]:
        """Get complete session state for new participants"""
        return {
            "session_id": self.session_id,
            "project_id": self.project_id,
            "participants": self.get_participants(),
            "operation_count": len(self.operation_history),
            "created_at": self.created_at,
            "last_activity": self.last_activity
        }

class CollaborationManager:
    """Manages all active collaboration sessions"""
    
    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self.sessions: Dict[str, CollaborationSession] = {}  # project_id -> session
        self.message_handlers: Dict[str, List[Callable]] = {}  # message_type -> handlers
    
    def create_session(self, project_id: str) -> CollaborationSession:
        """Create a new collaboration session"""
        session = CollaborationSession(project_id)
        self.sessions[project_id] = session
        print(f"[Collaboration] Created session {session.session_id} for project {project_id}")
        return session
    
    def get_session(self, project_id: str) -> Optional[CollaborationSession]:
        """Get existing collaboration session"""
        return self.sessions.get(project_id)
    
    def join_session(
        self,
        project_id: str,
        user_id: str,
        device_id: str,
        user_name: str
    ) -> Optional[CollaborationSession]:
        """Join a collaboration session (create if doesn't exist)"""
        if project_id not in self.sessions:
            session = self.create_session(project_id)
        else:
            session = self.sessions[project_id]
        
        session.add_participant(user_id, device_id, user_name)
        return session
    
    def leave_session(self, project_id: str, user_id: str) -> bool:
        """Leave a collaboration session"""
        session = self.get_session(project_id)
        if not session:
            return False
        
        session.remove_participant(user_id)
        
        # Remove session if no participants
        if not session.participants:
            del self.sessions[project_id]
            print(f"[Collaboration] Session ended: {project_id}")
        
        return True
    
    def broadcast_operation(
        self,
        project_id: str,
        operation: Operation,
        exclude_user: Optional[str] = None
    ) -> int:
        """Broadcast operation to all users in session"""
        session = self.get_session(project_id)
        if not session:
            return 0
        
        session.add_operation(operation)
        
        # Count recipients (all except sender)
        recipient_count = sum(
            1 for uid in session.participants
            if uid != exclude_user
        )
        
        print(f"[Collaboration] Broadcasting operation to {recipient_count} users")
        return recipient_count
    
    def sync_participant_cursor(
        self,
        project_id: str,
        user_id: str,
        cursor_position: int
    ) -> bool:
        """Update participant's cursor position for real-time feedback"""
        session = self.get_session(project_id)
        if not session or user_id not in session.participants:
            return False
        
        session.participants[user_id]["cursor_position"] = cursor_position
        return True
    
    def get_session_statistics(self, project_id: str) -> Dict[str, Any]:
        """Get statistics about a collaboration session"""
        session = self.get_session(project_id)
        if not session:
            return {}
        
        return {
            "project_id": project_id,
            "session_id": session.session_id,
            "participant_count": len(session.participants),
            "operation_count": len(session.operation_history),
            "created_at": session.created_at,
            "last_activity": session.last_activity,
            "participants": session.get_participants()
        }
    
    def register_message_handler(
        self,
        message_type: str,
        handler: Callable
    ) -> None:
        """Register handler for message type"""
        if message_type not in self.message_handlers:
            self.message_handlers[message_type] = []
        self.message_handlers[message_type].append(handler)
    
    def emit_message(self, message_type: str, data: Dict[str, Any]) -> None:
        """Emit message to all registered handlers"""
        if message_type in self.message_handlers:
            for handler in self.message_handlers[message_type]:
                try:
                    handler(data)
                except Exception as e:
                    print(f"[Collaboration] Handler error: {e}")
    
    def cleanup_inactive_sessions(self, timeout_minutes: int = 60) -> int:
        """Remove sessions inactive for longer than timeout"""
        now = datetime.now(timezone.utc)
        sessions_to_remove = []
        
        for project_id, session in self.sessions.items():
            last_activity = datetime.fromisoformat(session.last_activity)
            elapsed_minutes = (now - last_activity).total_seconds() / 60
            
            if elapsed_minutes > timeout_minutes and not session.participants:
                sessions_to_remove.append(project_id)
        
        for project_id in sessions_to_remove:
            del self.sessions[project_id]
            print(f"[Collaboration] Cleaned up inactive session: {project_id}")
        
        return len(sessions_to_remove)

# Singleton instance
collaboration_manager = None

def get_collaboration_manager(supabase_client=None):
    """Get or create collaboration manager instance"""
    global collaboration_manager
    if collaboration_manager is None:
        collaboration_manager = CollaborationManager(supabase_client)
    return collaboration_manager
