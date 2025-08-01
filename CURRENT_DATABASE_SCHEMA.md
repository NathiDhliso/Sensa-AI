# Current Database Schema Documentation

This document provides a comprehensive overview of your current Supabase database schema.

## Tables Overview

Based on the database inspection, here are the current tables in your `public` schema:

### 1. **users**
- **Purpose**: User profiles and authentication data
- **Columns**:
  - `id` (uuid, primary key, auto-generated)
  - `auth_id` (uuid, not null) - Links to Supabase auth.users
  - `email` (text, not null)
  - `full_name` (text, nullable)
  - `learning_profile` (jsonb, nullable) - Stores user learning preferences
  - `created_at` (timestamp with time zone, default: now())
  - `updated_at` (timestamp with time zone, default: now())

### 2. **memories**
- **Purpose**: Stores user memories and learning content
- **Columns**: (Structure to be detailed based on your specific implementation)

### 3. **courses**
- **Purpose**: Course information and metadata
- **Columns**: (Structure to be detailed based on your specific implementation)

### 4. **course_analyses**
- **Purpose**: Analysis results for courses
- **Columns**: (Structure to be detailed based on your specific implementation)

### 5. **epistemic_driver_history**
- **Purpose**: Tracks history of epistemic driver sessions
- **Columns**: (Recently added table for tracking user interactions)

### 6. **mindmap_results**
- **Purpose**: Stores generated mindmap data and results
- **Columns**: (Stores mindmap generation outputs)

### 7. **collaboration_sessions** ✨ *NEW*
- **Purpose**: Manages collaborative mindmap editing sessions
- **Columns**:
  - `id` (uuid, primary key, auto-generated)
  - `epistemic_driver_id` (uuid, nullable) - Links to epistemic driver sessions
  - `created_by` (uuid, nullable) - User who created the session
  - `session_name` (text, not null) - Display name for the session
  - `description` (text, nullable) - Session description
  - `is_active` (boolean, default: true) - Whether session is currently active
  - `max_participants` (integer, default: 10) - Maximum allowed participants
  - `created_at` (timestamp with time zone, default: now())
  - `updated_at` (timestamp with time zone, default: now())
  - `expires_at` (timestamp with time zone, nullable) - Session expiration
  - `session_settings` (jsonb, default: '{}') - Session configuration
  - `session_type` (text, nullable) - Type: 'public', 'private', 'invite_only'

### 8. **session_participants** ✨ *NEW*
- **Purpose**: Tracks users participating in collaboration sessions
- **Columns**:
  - `id` (uuid, primary key, auto-generated)
  - `session_id` (uuid, not null) - References collaboration_sessions.id
  - `user_id` (uuid, not null) - References users.id
  - `role` (text, default: 'participant') - 'facilitator' or 'participant'
  - `joined_at` (timestamp with time zone, default: now())
  - `last_seen` (timestamp with time zone, default: now())
  - `is_online` (boolean, default: true)
  - `cursor_position` (jsonb, nullable) - Real-time cursor position
  - `email` (text, nullable) - Participant email
  - `name` (text, nullable) - Participant display name
  - `color` (text, default: '#6B46C1') - Participant color for UI

### 9. **mindmap_operations** ✨ *NEW*
- **Purpose**: Stores real-time operations for operational transform
- **Columns**:
  - `id` (uuid, primary key, auto-generated)
  - `session_id` (uuid, not null) - References collaboration_sessions.id
  - `user_id` (uuid, not null) - User who performed the operation
  - `operation_type` (text, not null) - Type of operation (add_node, update_node, etc.)
  - `operation_data` (jsonb, not null) - Operation payload
  - `sequence_number` (bigint, auto-increment) - For ordering operations
  - `timestamp` (timestamp with time zone, default: now())
  - `applied` (boolean, default: false) - Whether operation has been applied
  - `conflict_resolution` (jsonb, nullable) - Conflict resolution data

### 10. **mindmap_snapshots** ✨ *NEW*
- **Purpose**: Stores mindmap snapshots for version control
- **Columns**:
  - `id` (uuid, primary key, auto-generated)
  - `session_id` (uuid, not null) - References collaboration_sessions.id
  - `created_by` (uuid, not null) - User who created the snapshot
  - `snapshot_data` (jsonb, not null) - Complete mindmap state
  - `version_number` (integer, not null) - Version identifier
  - `description` (text, nullable) - Snapshot description
  - `created_at` (timestamp with time zone, default: now())
  - `is_auto_generated` (boolean, default: false) - Auto vs manual snapshot

## Sequences

### mindmap_operation_sequence
- **Purpose**: Provides sequential numbering for mindmap operations
- **Used by**: `mindmap_operations.sequence_number`

## Security Features

### Row Level Security (RLS)
All collaboration tables have RLS enabled with the following policies:

#### collaboration_sessions
- Users can view sessions they created or participate in
- Users can create new sessions
- Session creators can update their sessions

#### session_participants
- Users can view participants in sessions they are part of
- Users can join sessions as themselves
- Users can update their own participation

#### mindmap_operations
- Session participants can view all operations
- Session participants can create operations
- Users can update their own operations

#### mindmap_snapshots
- Session participants can view all snapshots
- Session participants can create snapshots

### Real-time Features
All collaboration tables are enabled for Supabase Realtime:
- `collaboration_sessions`
- `session_participants`
- `mindmap_operations`
- `mindmap_snapshots`

## Indexes

Performance indexes are created for:
- Session lookups by creator and activity status
- Participant lookups by session and user
- Operation lookups by session and timestamp
- Snapshot lookups by session and creation time

## Triggers

Automatic timestamp updates:
- `collaboration_sessions.updated_at` on UPDATE
- `session_participants.last_seen` on UPDATE

## Current Status

✅ **All collaboration tables are successfully deployed**  
✅ **RLS policies are active and secure**  
✅ **Real-time subscriptions are enabled**  
✅ **Indexes and triggers are configured**  
✅ **Ready for collaborative mindmap editing**  

## Notes for Future Migrations

1. **Existing Data Preserved**: All your existing users, memories, courses, and other data remain untouched
2. **Safe Migration Strategy**: Used conditional table creation and policy management
3. **No Downtime**: Database remained operational throughout the migration
4. **Backward Compatible**: Existing features continue to work normally

This schema supports the full collaborative mindmap editing feature set while maintaining data integrity and security.