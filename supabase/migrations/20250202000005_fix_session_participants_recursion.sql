-- Fix infinite recursion in session_participants policies
-- This migration fixes the circular reference in the session_participants SELECT policy

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view participants in sessions they are part of" ON session_participants;

-- Create a new policy without circular reference
-- This policy allows users to see participants in sessions where they are either:
-- 1. The session creator, or
-- 2. A participant themselves (direct user_id match)
CREATE POLICY "Users can view participants in sessions they are part of"
ON session_participants
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    session_id IN (
        SELECT id FROM collaboration_sessions 
        WHERE created_by = auth.uid()
    )
);

-- Also ensure the other policies are clean and don't have recursion issues
DROP POLICY IF EXISTS "Users can join sessions as themselves" ON session_participants;
CREATE POLICY "Users can join sessions as themselves"
ON session_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own participation" ON session_participants;
CREATE POLICY "Users can update their own participation"
ON session_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add a policy for users to leave sessions
DROP POLICY IF EXISTS "Users can leave sessions" ON session_participants;
CREATE POLICY "Users can leave sessions"
ON session_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add comment for tracking
COMMENT ON TABLE session_participants IS 'Fixed infinite recursion in policies - 2025-02-02';