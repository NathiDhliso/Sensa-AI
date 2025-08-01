-- Fix collaboration_sessions policy to allow participants to view sessions they're part of
-- This addresses the 406 error when trying to join sessions

-- Drop the restrictive policy
DROP POLICY IF EXISTS "collaboration_sessions_select" ON collaboration_sessions;

-- Create a new policy that allows both creators and participants to view sessions
CREATE POLICY "collaboration_sessions_select" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = collaboration_sessions.id 
      AND sp.user_id = auth.uid()
    )
  );

-- Also create a policy for public sessions (if needed)
CREATE POLICY "collaboration_sessions_select_public" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (session_type = 'public' AND is_active = true);