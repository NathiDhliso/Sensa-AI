-- Fix infinite recursion in collaboration_sessions policy
-- The previous policy created circular dependency, this simplifies it

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "collaboration_sessions_select" ON collaboration_sessions;
DROP POLICY IF EXISTS "collaboration_sessions_select_public" ON collaboration_sessions;
DROP POLICY IF EXISTS "collaboration_sessions_insert" ON collaboration_sessions;
DROP POLICY IF EXISTS "collaboration_sessions_update" ON collaboration_sessions;
DROP POLICY IF EXISTS "collaboration_sessions_delete" ON collaboration_sessions;

-- Create simple, non-recursive policies
-- Allow users to view sessions they created
CREATE POLICY "sessions_view_own" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Allow users to view public sessions
CREATE POLICY "sessions_view_public" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (session_type = 'public' AND is_active = true);

-- Allow users to create sessions
CREATE POLICY "sessions_create" ON collaboration_sessions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow session creators to update their sessions
CREATE POLICY "sessions_update_own" ON collaboration_sessions
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow session creators to delete their sessions
CREATE POLICY "sessions_delete_own" ON collaboration_sessions
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Create a function to check if user is participant (to avoid recursion)
CREATE OR REPLACE FUNCTION is_session_participant(session_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM session_participants 
    WHERE session_id = session_uuid 
    AND user_id = user_uuid
  );
$$;

-- Allow participants to view sessions they're part of (using function to avoid recursion)
CREATE POLICY "sessions_view_participant" ON collaboration_sessions
  FOR SELECT TO authenticated
  USING (is_session_participant(id, auth.uid()));