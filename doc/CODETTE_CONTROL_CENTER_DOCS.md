# CodetteControlCenter Component Documentation

## Overview

The `CodetteControlCenter` component provides a unified interface for managing Codette AI's activity, permissions, statistics, and settings within your CoreLogic Studio DAW. It includes real-time activity logging, granular permission controls, and comprehensive analytics.

## Component Location

```
src/components/CodetteControlCenter.tsx
```

## Features

### 1. **Activity Log Tab**
- Real-time tracking of AI and user actions
- Time-stamped entries with source attribution
- Undo capability for recent actions
- CSV export functionality for audit trails
- Auto-scrolling activity display (newest first)

**Sample Output:**
```
Time       | Source      | Action
-----------|-------------|------------------------------------------
18:42:01   | Codette2.0  | Adjusted EQ on Bass (+1.5 dB)
18:42:07   | Codette2.0  | Created track: Lead Synth
18:42:10   | User        | Denied render request
```

### 2. **Permissions Tab**
- Fine-grained permission controls for AI actions
- Three-level permission model: Allow, Ask, Deny
- Permissions for: LoadPlugin, CreateTrack, RenderMixdown, AdjustParameters, SaveProject
- Reset to defaults option
- Persistent storage ready

**Permission Levels:**
- **Allow**: Action proceeds without user confirmation
- **Ask**: Codette requests user approval before proceeding
- **Deny**: Action is blocked; Codette cannot perform this operation

### 3. **Stats Tab**
- Actions performed counter
- Parameters changed tracking
- User approval/denial statistics
- Visual progress indicator
- AI activity level gauge

**Displayed Metrics:**
- Actions Performed: Total count of all AI operations
- Parameters Changed: Count of parameter modifications
- User Approvals: Count of approved AI actions
- Denied Actions: Count of blocked AI actions

### 4. **Settings Tab**
- Enable/disable Codette per project
- Activity logging toggle
- Auto-render permissions
- Backup inclusion options
- History management
- Clear history button with confirmation

**Available Settings:**
1. Enable Codette 2.0 in this project
2. Log AI activity
3. Allow Codette to render automatically
4. Include AI logs in backups
5. Clear AI history on project close

### 5. **Live Status Bar**
- Real-time status updates
- Animated indicator pulse
- Current action display
- Total action count

## Usage

### Basic Integration

```typescript
import CodetteControlCenter from '@/components/CodetteControlCenter';

export function MyComponent() {
  return (
    <div className="w-full h-full">
      <CodetteControlCenter />
    </div>
  );
}
```

### Integration with DAW Context

```typescript
import { useDAW } from '@/contexts/DAWContext';
import CodetteControlCenter from '@/components/CodetteControlCenter';

export function ControlPanel() {
  const { selectedTrack, tracks } = useDAW();

  return (
    <div>
      <CodetteControlCenter />
      {/* Additional UI */}
    </div>
  );
}
```

### As a Modal or Panel

```typescript
import { useState } from 'react';
import CodetteControlCenter from '@/components/CodetteControlCenter';

export function Dashboard() {
  const [showControl, setShowControl] = useState(false);

  return (
    <>
      <button onClick={() => setShowControl(true)}>
        Open Control Center
      </button>
      
      {showControl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CodetteControlCenter />
          </div>
        </div>
      )}
    </>
  );
}
```

## Component Architecture

### State Management

```typescript
// Tab selection
const [tab, setTab] = useState<'log' | 'permissions' | 'stats' | 'settings'>('log');

// Permissions configuration
const [permissions, setPermissions] = useState<PermissionSetting>({...});

// Activity history
const [activity, setActivity] = useState<ActivityLog[]>([]);

// Live status updates
const [liveStatus, setLiveStatus] = useState<LiveStatus>({...});

// Settings toggles
const [settings, setSettings] = useState({...});
```

### Interfaces

```typescript
interface ActivityLog {
  time: string;
  source: 'Codette2.0' | 'User';
  action: string;
}

interface PermissionSetting {
  [key: string]: 'allow' | 'ask' | 'deny';
}

interface LiveStatus {
  message: string;
  active: boolean;
  actions: number;
}
```

## Styling & Customization

### Theme Integration

The component uses Tailwind CSS classes consistent with CoreLogic Studio's dark theme:

- **Background**: `bg-gray-950`, `bg-gray-900`
- **Text**: `text-gray-100`, `text-gray-300`, `text-gray-400`
- **Borders**: `border-gray-800`
- **Accent**: `cyan-400`, `cyan-600`
- **Status Colors**:
  - Codette actions: `blue-300`
  - User actions: `green-300`
  - Approvals: `green-400`
  - Denials: `red-400`

### Responsive Design

The component adapts to container width:

```typescript
<div className="w-full max-w-4xl mx-auto">
  <CodetteControlCenter />
</div>
```

- Stats grid becomes responsive on smaller screens
- Tables scroll horizontally on mobile
- Full-width on desktop

## Real-Time Features

### Activity Updates

The component automatically generates realistic activity updates every 6 seconds:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const events = [
      'Analyzing spectral balance...',
      'Boosting clarity in vocals...',
      'Monitoring loudness levels...',
      'Synchronizing tempo map...',
      'Optimizing plugin chain...',
      'Analyzing harmonic content...',
    ];
    // Updates activity log and live status
  }, 6000);
  return () => clearInterval(interval);
}, []);
```

### Live Status Bar

The persistent status bar at the bottom shows:
- Current Codette activity
- Animated pulse indicator
- Real-time action counter

## Events & Handlers

### handlePermissionChange(key: string, value: 'allow' | 'ask' | 'deny')
Updates a single permission setting.

```typescript
handlePermissionChange('LoadPlugin', 'deny');
```

### handleSettingToggle(key: keyof typeof settings)
Toggles a boolean setting on/off.

```typescript
handleSettingToggle('enableCodette');
```

### handleUndoLastAction()
Removes the most recent activity entry.

### handleExportLog()
Downloads activity history as CSV file with timestamp in filename.

```
codette-activity-2024-12-01.csv
```

### handleClearHistory()
Clears all activity with confirmation dialog.

### handleResetPermissions()
Restores permissions to default values.

## Integration with Backend

### Future Backend Integration

To connect with actual Codette backend:

```typescript
// In useCodette hook
const { activity, permissions, stats } = useCodette();

// Pass to component via props
<CodetteControlCenter 
  activity={activity}
  permissions={permissions}
  onPermissionChange={updatePermissions}
  onActivityLog={logActivity}
/>
```

### Data Persistence

Export log as JSON for database storage:

```typescript
const exportAsJSON = () => {
  const data = {
    timestamp: new Date().toISOString(),
    activity,
    permissions,
    stats: liveStatus,
  };
  return JSON.stringify(data, null, 2);
};
```

## Performance Considerations

1. **Activity Limit**: Stores max 50 entries to prevent memory issues
2. **Update Interval**: 6-second updates balance responsiveness with performance
3. **Table Virtualization**: Consider adding for large activity logs (100+ entries)
4. **CSV Export**: Efficient streaming for large datasets

## Accessibility

- Semantic HTML with proper labels
- Keyboard navigation support (Tab through tabs and controls)
- ARIA labels for screen readers
- Color-blind friendly status indicators (icons + color)
- High contrast text on dark backgrounds

## TypeScript Support

Full TypeScript support with proper interfaces:

```typescript
type ActivityLog = {
  time: string;
  source: 'Codette2.0' | 'User';
  action: string;
};

type PermissionLevel = 'allow' | 'ask' | 'deny';

interface CodetteControlCenterProps {
  // Component is self-contained, no required props
}
```

## Common Use Cases

### 1. Audit Trail
Export activity log for compliance and review:
```typescript
// User clicks "Export Log" → CSV download
// Contains: time, source, action for all operations
```

### 2. Permission Management
Control what Codette can do automatically:
```typescript
// Set RenderMixdown to 'ask' → Codette asks before rendering
// Set CreateTrack to 'allow' → Codette creates tracks without asking
```

### 3. Real-Time Monitoring
Watch Codette's live activity:
```typescript
// Live status bar shows current operation
// Activity log updates in real-time
// Action counter increments per operation
```

### 4. Settings Management
Configure per-project Codette behavior:
```typescript
// Toggle 'autoRender' for hands-off mastering
// Enable 'logActivity' for detailed audit trail
```

## Troubleshooting

### Activity not updating?
- Check that component is mounted and not in a collapsed state
- Verify useEffect interval is running (check browser console)

### Permissions not persisting?
- Add localStorage or database integration:
```typescript
useEffect(() => {
  localStorage.setItem('codettePermissions', JSON.stringify(permissions));
}, [permissions]);
```

### Performance issues with large logs?
- Implement virtual scrolling for tables
- Add pagination (show 10/25/50 entries)
- Archive old entries

## Future Enhancements

1. **Backend Integration**: Connect to actual Codette AI service
2. **Persistence**: Save permissions and settings to database
3. **Advanced Filtering**: Filter activity by source, time range, action type
4. **Export Formats**: JSON, XML export options
5. **Webhooks**: Real-time updates via WebSocket
6. **Analytics Dashboard**: Charts and graphs for activity trends
7. **Role-Based Access**: Different permission sets per user role
8. **Undo/Redo History**: Full transaction rollback capability

## Example: Complete Integration

```typescript
import { useState } from 'react';
import CodetteControlCenter from '@/components/CodetteControlCenter';
import { useDAW } from '@/contexts/DAWContext';

export function ControlDashboard() {
  const { selectedTrack } = useDAW();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white"
      >
        Show Control Center
      </button>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1>DAW Control</h1>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          Close
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <CodetteControlCenter />
      </div>
    </div>
  );
}
```

## Support

For issues or questions about the CodetteControlCenter component, refer to:
- `src/contexts/DAWContext.tsx` - DAW state management
- `src/hooks/useCodette.ts` - Codette AI integration
- `src/types/index.ts` - Type definitions

