-- Fix infinite recursion in collaboration_sessions policies
-- This migration safely fixes the policy issues without data loss

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view sessions they created or participate in" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can view sessions they participate in" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Session creators can delete their sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can create new sessions" ON collaboration_sessions;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "view_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "create_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "update_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "delete_own_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "view_participant_sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "view_participants_simple" ON session_participants;

-- Create simple, non-recursive policies
CREATE POLICY "view_own_sessions" ON collaboration_sessions
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "create_sessions" ON collaboration_sessions
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_sessions" ON collaboration_sessions
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "delete_own_sessions" ON collaboration_sessions
  FOR DELETE USING (created_by = auth.uid());

-- Create a function-based policy for participant access (avoids recursion)
CREATE OR REPLACE FUNCTION user_can_access_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_participants 
    WHERE session_id = session_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "view_participant_sessions" ON collaboration_sessions
  FOR SELECT USING (user_can_access_session(id));

-- Fix session_participants policies to avoid circular references
DROP POLICY IF EXISTS "Users can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can view participants in sessions they are part of" ON session_participants;

CREATE POLICY "view_participants_simple" ON session_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM collaboration_sessions cs 
      WHERE cs.id = session_participants.session_id 
      AND cs.created_by = auth.uid()
    )
  );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION user_can_access_session(UUID) TO authenticated;

-- Add comment for tracking
COMMENT ON FUNCTION user_can_access_session(UUID) IS 'Function to check if user can access a collaboration session without causing policy recursion';