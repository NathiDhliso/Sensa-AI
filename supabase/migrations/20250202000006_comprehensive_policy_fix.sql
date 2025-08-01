-- Comprehensive fix for all infinite recursion issues in collaboration policies
-- This migration removes ALL conflicting policies and creates clean, non-recursive ones

-- ===== COLLABORATION_SESSIONS POLICIES =====
-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Users can view sessions they created or participate in" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can view sessions they participate in" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can create new sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Session creators can delete their sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "view_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "create_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "update_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "delete_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "view_participant_sessions" ON collaboration_sessions;

-- Create clean collaboration_sessions policies
CREATE POLICY "collaboration_sessions_select" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "collaboration_sessions_insert" ON collaboration_sessions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "collaboration_sessions_update" ON collaboration_sessions
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "collaboration_sessions_delete" ON collaboration_sessions
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ===== SESSION_PARTICIPANTS POLICIES =====
-- Drop ALL existing session_participants policies
DROP POLICY IF EXISTS "Users can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can view participants in sessions they are part of" ON session_participants;
DROP POLICY IF EXISTS "Participants can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON session_participants;
DROP POLICY IF EXISTS "Users can join sessions as themselves" ON session_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON session_participants;
DROP POLICY IF EXISTS "view_participants_simple" ON session_participants;

-- Create clean session_participants policies WITHOUT any circular references
CREATE POLICY "session_participants_select" ON session_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM collaboration_sessions cs 
      WHERE cs.id = session_participants.session_id 
      AND cs.created_by = auth.uid()
    )
  );

CREATE POLICY "session_participants_insert" ON session_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_participants_update" ON session_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_participants_delete" ON session_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===== MINDMAP_OPERATIONS POLICIES =====
-- Drop existing mindmap_operations policies
DROP POLICY IF EXISTS "Session participants can view all operations" ON mindmap_operations;
DROP POLICY IF EXISTS "Session participants can create operations" ON mindmap_operations;
DROP POLICY IF EXISTS "Participants can view operations" ON mindmap_operations;
DROP POLICY IF EXISTS "Participants can create operations" ON mindmap_operations;
DROP POLICY IF EXISTS "Users can update their own operations" ON mindmap_operations;

-- Create clean mindmap_operations policies
CREATE POLICY "mindmap_operations_select" ON mindmap_operations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_sessions cs 
      WHERE cs.id = mindmap_operations.session_id 
      AND cs.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = mindmap_operations.session_id 
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "mindmap_operations_insert" ON mindmap_operations
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM collaboration_sessions cs 
        WHERE cs.id = mindmap_operations.session_id 
        AND cs.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM session_participants sp 
        WHERE sp.session_id = mindmap_operations.session_id 
        AND sp.user_id = auth.uid() 
        AND sp.role IN ('facilitator', 'participant')
      )
    )
  );

CREATE POLICY "mindmap_operations_update" ON mindmap_operations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===== MINDMAP_SNAPSHOTS POLICIES =====
-- Drop existing mindmap_snapshots policies
DROP POLICY IF EXISTS "Session participants can view all snapshots" ON mindmap_snapshots;
DROP POLICY IF EXISTS "Session participants can create snapshots" ON mindmap_snapshots;
DROP POLICY IF EXISTS "Participants can view snapshots" ON mindmap_snapshots;
DROP POLICY IF EXISTS "Participants can create snapshots" ON mindmap_snapshots;

-- Create clean mindmap_snapshots policies
CREATE POLICY "mindmap_snapshots_select" ON mindmap_snapshots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_sessions cs 
      WHERE cs.id = mindmap_snapshots.session_id 
      AND cs.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = mindmap_snapshots.session_id 
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "mindmap_snapshots_insert" ON mindmap_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM collaboration_sessions cs 
        WHERE cs.id = mindmap_snapshots.session_id 
        AND cs.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM session_participants sp 
        WHERE sp.session_id = mindmap_snapshots.session_id 
        AND sp.user_id = auth.uid() 
        AND sp.role IN ('facilitator', 'participant')
      )
    )
  );

-- ===== CHAT_MESSAGES POLICIES (if table exists) =====
-- Drop existing chat_messages policies
DROP POLICY IF EXISTS "Session participants can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Session participants can send chat messages" ON chat_messages;

-- Create clean chat_messages policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    EXECUTE 'CREATE POLICY "chat_messages_select" ON chat_messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM collaboration_sessions cs 
          WHERE cs.id = chat_messages.session_id 
          AND cs.created_by = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM session_participants sp 
          WHERE sp.session_id = chat_messages.session_id 
          AND sp.user_id = auth.uid()
        )
      )';
    
    EXECUTE 'CREATE POLICY "chat_messages_insert" ON chat_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        user_id = auth.uid() AND
        (
          EXISTS (
            SELECT 1 FROM collaboration_sessions cs 
            WHERE cs.id = chat_messages.session_id 
            AND cs.created_by = auth.uid()
          ) OR
          EXISTS (
            SELECT 1 FROM session_participants sp 
            WHERE sp.session_id = chat_messages.session_id 
            AND sp.user_id = auth.uid() 
            AND sp.role IN (''facilitator'', ''participant'')
          )
        )
      )';
  END IF;
END
$$;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS user_can_access_session(UUID);

-- Add comment for tracking
COMMENT ON TABLE collaboration_sessions IS 'Comprehensive policy fix applied - 2025-02-02';
COMMENT ON TABLE session_participants IS 'Comprehensive policy fix applied - 2025-02-02';