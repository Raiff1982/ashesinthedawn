"""
Multi-Device Support Module
Tracks devices, manages per-device settings, handles cross-device sync
"""

from typing import Optional, Dict, List, Any
from datetime import datetime, timezone
from dataclasses import dataclass
import json
import uuid

@dataclass
class Device:
    """Represents a device that can access the DAW"""
    device_id: str
    device_name: str
    device_type: str  # "desktop", "tablet", "mobile"
    platform: str    # "windows", "macos", "linux", "ios", "android"
    last_seen: str
    user_id: Optional[str] = None
    is_active: bool = True
    capabilities: Dict[str, bool] = None  # e.g., {"audio_io": True, "vst": False}
    
    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = {}

class MultiDeviceManager:
    """Manages multi-device synchronization and coordination"""
    
    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self.local_devices: Dict[str, Device] = {}
        self.active_sessions: Dict[str, str] = {}  # device_id -> project_id
    
    def register_device(
        self,
        device_name: str,
        device_type: str,
        platform: str,
        user_id: Optional[str] = None,
        capabilities: Optional[Dict[str, bool]] = None
    ) -> Device:
        """Register a new device or update existing"""
        device_id = f"device_{uuid.uuid4().hex[:12]}"
        
        device = Device(
            device_id=device_id,
            device_name=device_name,
            device_type=device_type,
            platform=platform,
            last_seen=datetime.now(timezone.utc).isoformat(),
            user_id=user_id,
            is_active=True,
            capabilities=capabilities or {}
        )
        
        self.local_devices[device_id] = device
        self._persist_device(device)
        
        print(f"[MultiDevice] Registered device: {device_id} ({device_name})")
        return device
    
    def get_device(self, device_id: str) -> Optional[Device]:
        """Get device by ID"""
        return self.local_devices.get(device_id)
    
    def list_user_devices(self, user_id: str) -> List[Device]:
        """Get all devices for a user"""
        if not self.supabase:
            return [d for d in self.local_devices.values() if d.user_id == user_id]
        
        try:
            response = self.supabase.table("devices").select("*").eq("user_id", user_id).execute()
            return [self._device_from_row(row) for row in response.data]
        except Exception as e:
            print(f"[MultiDevice] Error listing devices: {e}")
            return []
    
    def list_active_devices(self) -> List[Device]:
        """Get all currently active devices"""
        return [d for d in self.local_devices.values() if d.is_active]
    
    def update_device_last_seen(self, device_id: str) -> bool:
        """Update device's last activity timestamp"""
        device = self.get_device(device_id)
        if not device:
            return False
        
        device.last_seen = datetime.now(timezone.utc).isoformat()
        self._persist_device(device)
        return True
    
    def set_device_active_project(self, device_id: str, project_id: str) -> bool:
        """Track which project is open on a device"""
        if device_id not in self.local_devices:
            return False
        
        self.active_sessions[device_id] = project_id
        print(f"[MultiDevice] Device {device_id} opened project {project_id}")
        return True
    
    def get_device_active_project(self, device_id: str) -> Optional[str]:
        """Get the currently open project on a device"""
        return self.active_sessions.get(device_id)
    
    def get_devices_with_project_open(self, project_id: str) -> List[str]:
        """Get all devices that have a project open"""
        return [
            dev_id for dev_id, proj_id in self.active_sessions.items()
            if proj_id == project_id
        ]
    
    def detect_device_conflicts(self, project_id: str) -> Dict[str, Any]:
        """Detect if multiple devices are editing the same project"""
        devices_with_project = self.get_devices_with_project_open(project_id)
        
        return {
            "project_id": project_id,
            "device_count": len(devices_with_project),
            "devices": devices_with_project,
            "has_conflict": len(devices_with_project) > 1,
            "devices_info": [
                {
                    "device_id": dev_id,
                    "device_name": self.get_device(dev_id).device_name if self.get_device(dev_id) else "Unknown"
                }
                for dev_id in devices_with_project
            ]
        }
    
    def sync_settings_across_devices(self, user_id: str, settings: Dict[str, Any]) -> bool:
        """Broadcast settings to all user's devices"""
        devices = self.list_user_devices(user_id)
        print(f"[MultiDevice] Syncing settings to {len(devices)} devices")
        
        for device in devices:
            # In a real implementation, this would send to WebSocket connections
            self._broadcast_to_device(device.device_id, "settings_update", settings)
        
        return True
    
    def get_device_sync_status(self, device_id: str) -> Dict[str, Any]:
        """Get sync status for a specific device"""
        device = self.get_device(device_id)
        if not device:
            return {"status": "unknown", "device_id": device_id}
        
        project_id = self.get_device_active_project(device_id)
        
        return {
            "device_id": device_id,
            "device_name": device.device_name,
            "is_active": device.is_active,
            "last_seen": device.last_seen,
            "platform": device.platform,
            "current_project": project_id,
            "capabilities": device.capabilities
        }
    
    def broadcast_project_update(self, project_id: str, update_data: Dict[str, Any]) -> int:
        """Broadcast project updates to all devices except sender"""
        devices_with_project = self.get_devices_with_project_open(project_id)
        sender_device_id = update_data.get("from_device_id")
        
        broadcast_count = 0
        for device_id in devices_with_project:
            if device_id != sender_device_id:  # Don't send to sender
                self._broadcast_to_device(device_id, "project_update", update_data)
                broadcast_count += 1
        
        print(f"[MultiDevice] Broadcast update to {broadcast_count} devices for project {project_id}")
        return broadcast_count
    
    # ========== PRIVATE METHODS ==========
    
    def _persist_device(self, device: Device) -> bool:
        """Persist device to database"""
        if not self.supabase:
            return True
        
        try:
            device_data = {
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_type": device.device_type,
                "platform": device.platform,
                "last_seen": device.last_seen,
                "user_id": device.user_id,
                "is_active": device.is_active,
                "capabilities": json.dumps(device.capabilities)
            }
            
            response = self.supabase.table("devices").upsert(device_data).execute()
            return bool(response.data)
        except Exception as e:
            print(f"[MultiDevice] Error persisting device: {e}")
            return False
    
    def _device_from_row(self, row: Dict[str, Any]) -> Device:
        """Convert database row to Device object"""
        return Device(
            device_id=row.get("device_id"),
            device_name=row.get("device_name"),
            device_type=row.get("device_type"),
            platform=row.get("platform"),
            last_seen=row.get("last_seen"),
            user_id=row.get("user_id"),
            is_active=row.get("is_active", True),
            capabilities=json.loads(row.get("capabilities", "{}"))
        )
    
    def _broadcast_to_device(self, device_id: str, message_type: str, data: Dict[str, Any]) -> None:
        """Broadcast message to device (implementation would use WebSocket)"""
        print(f"[MultiDevice] Broadcasting {message_type} to {device_id}")
        # In production: send via WebSocket connection pool


# Singleton instance
multi_device_manager = None

def get_multi_device_manager(supabase_client=None):
    """Get or create multi-device manager instance"""
    global multi_device_manager
    if multi_device_manager is None:
        multi_device_manager = MultiDeviceManager(supabase_client)
    return multi_device_manager
