# Collaborative Mind Mapping Features - Implementation Guide

## Overview

This document outlines the implementation of collaborative features for the Epistemic Driver mindmap in Sensa AI. The implementation follows a multi-phase approach, with Phase 1 (Foundation & Core Sync) now complete.

## Phase 1: Foundation & Core Sync ✅ COMPLETED

### Features Implemented

#### 1. Database Schema
- **Collaboration Sessions**: Manage collaborative mindmap sessions
- **Session Participants**: Track users in each session with roles and permissions
- **Mindmap Operations**: Store real-time operations for operational transform
- **Mindmap Snapshots**: Version control and backup system
- **Real-time Subscriptions**: Supabase Realtime integration

#### 2. Core Components

##### CollaborativeMindMapEditor (`src/features/MindMapEditor/CollaborativeMindMapEditor.tsx`)
- Full-featured collaborative mindmap editor
- Real-time cursor tracking
- Participant management panel
- Voice/video controls (UI ready for Phase 2)
- Chat panel (UI ready for Phase 2)
- Session management (create, join, leave)

##### CollaborationService (`src/services/collaborationService.ts`)
- WebSocket and Supabase Realtime integration
- Operational transform for conflict resolution
- Session lifecycle management
- Real-time cursor updates
- Snapshot creation and management

##### CollaborationStore (`src/stores/collaborationStore.ts`)
- Zustand-based state management
- Real-time synchronization
- Participant tracking
- Operation history
- UI state management

##### CollaborationPage (`src/pages/CollaborationPage.tsx`)
- Session creation and joining interface
- Invite link generation
- Error handling and loading states
- Seamless integration with existing routing

#### 3. Integration Points

##### Dashboard Integration
- Added "Collaborate" button to quick actions
- Seamless navigation to collaboration features
- Consistent UI/UX with existing design system

##### Routing Integration
- `/collaborate` - Create new collaboration session
- `/collaborate/:sessionId` - Join existing session
- Protected routes with authentication

### Technical Architecture

#### Real-time Communication
```typescript
// Supabase Realtime channels for:
- Session participants updates
- Mindmap operations (add/edit/delete nodes/edges)
- Cursor position updates
- Connection status management
```

#### Operational Transform
```typescript
// Conflict resolution strategy:
- Timestamp-based operation ordering
- Last-writer-wins for simple conflicts
- Operation queue processing
- Automatic retry mechanisms
```

#### State Management
```typescript
// Zustand store structure:
- currentSession: CollaborationSession
- participants: SessionParticipant[]
- operationHistory: MindmapOperation[]
- connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
```

## How to Use

### Creating a Collaboration Session

1. **From Dashboard**:
   - Click the "Collaborate" button in the quick actions grid
   - Enter session name and select privacy level
   - Click "Create Session"

2. **Session Types**:
   - **Private**: Invite-only access
   - **Invite Only**: Shareable link required
   - **Public**: Anyone can join (future feature)

### Joining a Session

1. **Via Invite Link**:
   - Click on shared link: `https://app.sensa.ai/collaborate/session-id`
   - Choose role: Editor or Observer
   - Click "Join Session"

2. **Via Session ID**:
   - Navigate to `/collaborate`
   - Enter session ID manually
   - Join as participant

### Collaborative Features

#### Real-time Editing
- **Node Operations**: Add, edit, delete, move nodes
- **Edge Operations**: Create, modify, delete connections
- **Live Cursors**: See other participants' cursor positions
- **Conflict Resolution**: Automatic handling of simultaneous edits

#### Participant Management
- **Role-based Access**: Facilitator, Editor, Observer
- **Online Status**: Real-time presence indicators
- **Color-coded Cursors**: Unique colors for each participant
- **Participant List**: View all session members

#### Version Control
- **Auto-snapshots**: Automatic saves during collaboration
- **Manual Snapshots**: Create named save points
- **History Tracking**: View operation timeline
- **Restore Points**: Rollback to previous versions

## Database Schema

### Tables Created

```sql
-- Collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  mindmap_id UUID REFERENCES mindmap_results(id),
  facilitator_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  session_type TEXT CHECK (session_type IN ('public', 'private', 'invite_only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('facilitator', 'editor', 'observer')),
  color TEXT NOT NULL,
  is_online BOOLEAN DEFAULT true,
  cursor_position JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Mindmap operations for operational transform
CREATE TABLE mindmap_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  operation_type TEXT NOT NULL,
  operation_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  applied BOOLEAN DEFAULT false,
  sequence_number SERIAL
);

-- Mindmap snapshots for version control
CREATE TABLE mindmap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  snapshot_name TEXT,
  is_auto_save BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security & Permissions

### Row Level Security (RLS)
- **Session Access**: Users can only access sessions they're participants in
- **Operation Permissions**: Only session participants can create operations
- **Snapshot Access**: Read access for participants, write for editors/facilitators
- **Real-time Subscriptions**: Filtered by session membership

### Role-based Access Control
- **Facilitator**: Full control (create, edit, delete, manage participants)
- **Editor**: Edit mindmap, create snapshots, view participants
- **Observer**: View-only access, see real-time changes

## Performance Optimizations

### Real-time Updates
- **Cursor Throttling**: 100ms throttle for cursor position updates
- **Operation Batching**: Group related operations
- **Selective Subscriptions**: Only subscribe to relevant channels
- **Connection Pooling**: Efficient WebSocket management

### Data Management
- **Operation Cleanup**: Automatic cleanup of old operations
- **Snapshot Compression**: Efficient storage of mindmap states
- **Lazy Loading**: Load participants and history on demand
- **Caching Strategy**: Local state caching for offline resilience

## Future Phases

### Phase 2: Interactive Communication (Planned)
- **Real-time Chat**: Text messaging within sessions
- **Voice Communication**: WebRTC voice chat
- **Video Calls**: Optional video communication
- **Screen Sharing**: Share screens during collaboration
- **Annotation Tools**: Highlight and comment on mindmap elements

### Phase 3: Rich Media & Advanced Collaboration (Planned)
- **File Sharing**: Upload and share documents
- **Multimedia Nodes**: Images, videos, audio in mindmap
- **Advanced Drawing**: Freehand drawing and sketching
- **Templates**: Collaborative mindmap templates
- **Export Options**: Collaborative export formats

### Phase 4: Pedagogical Integration & Polish (Planned)
- **Learning Analytics**: Track collaborative learning patterns
- **Assessment Integration**: Collaborative assessments
- **Gamification**: Collaborative achievements and rewards
- **Mobile Optimization**: Full mobile collaboration support
- **Offline Sync**: Work offline and sync when connected

## Troubleshooting

### Common Issues

1. **Connection Problems**:
   - Check internet connectivity
   - Verify Supabase configuration
   - Check browser WebSocket support

2. **Permission Errors**:
   - Ensure user is authenticated
   - Verify session membership
   - Check role permissions

3. **Sync Issues**:
   - Refresh the page
   - Check operation queue
   - Verify real-time subscriptions

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('collaboration-debug', 'true');

// Check connection status
console.log(collaborationService.isConnected());

// View operation queue
console.log(useCollaborationStore.getState().pendingOperations);
```

## API Reference

### CollaborationService Methods

```typescript
// Session management
createSess ion(name: string, type: SessionType): Promise<CollaborationSession>
joinSession(sessionId: string, role: ParticipantRole): Promise<void>
leaveSession(): Promise<void>

// Real-time operations
sendOperation(operation: MindmapOperation): Promise<void>
sendCursorUpdate(x: number, y: number): Promise<void>

// Snapshots
createSnapshot(data: MindmapData, name?: string): Promise<MindmapSnapshot>
getSnapshots(sessionId: string): Promise<MindmapSnapshot[]>
```

### Store Actions

```typescript
// Session actions
const { createSession, joinSession, leaveSession } = useCollaborationStore();

// Real-time updates
const { updateCursorPosition, addOperation } = useCollaborationStore();

// State access
const { currentSession, participants, isConnected } = useCollaborationStore();
```

## Contributing

When contributing to collaborative features:

1. **Test Real-time Sync**: Always test with multiple browser tabs
2. **Handle Edge Cases**: Network disconnections, rapid operations
3. **Maintain Security**: Verify RLS policies and permissions
4. **Performance**: Monitor WebSocket connections and memory usage
5. **User Experience**: Ensure smooth collaboration experience

## Conclusion

Phase 1 of the collaborative features provides a solid foundation for real-time collaborative mindmap editing. The implementation includes:

- ✅ Real-time synchronization
- ✅ Participant management
- ✅ Operational transform
- ✅ Version control
- ✅ Security & permissions
- ✅ Performance optimizations

The architecture is designed to scale and support the advanced features planned for future phases, making Sensa AI a powerful platform for collaborative learning and knowledge mapping.