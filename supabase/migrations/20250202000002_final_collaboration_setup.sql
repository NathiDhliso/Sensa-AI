-- Final Collaboration Setup - Handle remaining configuration safely
-- This migration completes the collaboration setup without conflicts

-- Add missing columns to session_participants for collaboration features (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_participants' AND column_name = 'email') THEN
        ALTER TABLE session_participants ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_participants' AND column_name = 'name') THEN
        ALTER TABLE session_participants ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_participants' AND column_name = 'color') THEN
        ALTER TABLE session_participants ADD COLUMN color TEXT DEFAULT '#6B46C1';
    END IF;
END
$$;

-- Add session_type column to collaboration_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaboration_sessions' AND column_name = 'session_type') THEN
        ALTER TABLE collaboration_sessions ADD COLUMN session_type TEXT CHECK (session_type IN ('public', 'private', 'invite_only')) DEFAULT 'private';
    END IF;
END
$$;

-- Update session_participants to populate email from auth.users if missing
UPDATE session_participants 
SET email = COALESCE(email, (
  SELECT email FROM auth.users WHERE id = session_participants.user_id
))
WHERE email IS NULL;

-- Create missing indexes safely
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_epistemic_driver ON collaboration_sessions(epistemic_driver_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_operations_applied ON mindmap_operations(applied);
CREATE INDEX IF NOT EXISTS idx_mindmap_operations_sequence ON mindmap_operations(sequence_number);
CREATE INDEX IF NOT EXISTS idx_mindmap_snapshots_created_at ON mindmap_snapshots(created_at);

-- Enable Row Level Security on all collaboration tables
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely (using DO blocks to avoid conflicts)

-- Collaboration Sessions Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_sessions' AND policyname = 'Users can view sessions they created or participate in') THEN
        CREATE POLICY "Users can view sessions they created or participate in"
        ON collaboration_sessions
        FOR SELECT
        TO authenticated
        USING (
            created_by = auth.uid() OR
            id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_sessions' AND policyname = 'Users can create new sessions') THEN
        CREATE POLICY "Users can create new sessions"
        ON collaboration_sessions
        FOR INSERT
        TO authenticated
        WITH CHECK (created_by = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_sessions' AND policyname = 'Session creators can update their sessions') THEN
        CREATE POLICY "Session creators can update their sessions"
        ON collaboration_sessions
        FOR UPDATE
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    END IF;
END
$$;

-- Session Participants Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_participants' AND policyname = 'Users can view participants in sessions they are part of') THEN
        CREATE POLICY "Users can view participants in sessions they are part of"
        ON session_participants
        FOR SELECT
        TO authenticated
        USING (
            user_id = auth.uid() OR
            session_id IN (
                SELECT id FROM collaboration_sessions 
                WHERE created_by = auth.uid()
            ) OR
            session_id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_participants' AND policyname = 'Users can join sessions as themselves') THEN
        CREATE POLICY "Users can join sessions as themselves"
        ON session_participants
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_participants' AND policyname = 'Users can update their own participation') THEN
        CREATE POLICY "Users can update their own participation"
        ON session_participants
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

-- Mindmap Operations Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mindmap_operations' AND policyname = 'Session participants can view all operations') THEN
        CREATE POLICY "Session participants can view all operations"
        ON mindmap_operations
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mindmap_operations' AND policyname = 'Session participants can create operations') THEN
        CREATE POLICY "Session participants can create operations"
        ON mindmap_operations
        FOR INSERT
        TO authenticated
        WITH CHECK (
            user_id = auth.uid() AND
            session_id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid() AND role IN ('facilitator', 'participant')
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mindmap_operations' AND policyname = 'Users can update their own operations') THEN
        CREATE POLICY "Users can update their own operations"
        ON mindmap_operations
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

-- Mindmap Snapshots Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mindmap_snapshots' AND policyname = 'Session participants can view all snapshots') THEN
        CREATE POLICY "Session participants can view all snapshots"
        ON mindmap_snapshots
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mindmap_snapshots' AND policyname = 'Session participants can create snapshots') THEN
        CREATE POLICY "Session participants can create snapshots"
        ON mindmap_snapshots
        FOR INSERT
        TO authenticated
        WITH CHECK (
            created_by = auth.uid() AND
            session_id IN (
                SELECT session_id FROM session_participants 
                WHERE user_id = auth.uid() AND role IN ('facilitator', 'participant')
            )
        );
    END IF;
END
$$;

-- Enable Realtime for collaboration tables (safely)
DO $$
BEGIN
    -- Check if tables are already in the publication before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'collaboration_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'session_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'mindmap_operations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE mindmap_operations;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'mindmap_snapshots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE mindmap_snapshots;
    END IF;
END
$$;

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates (safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collaboration_sessions_updated_at') THEN
        CREATE TRIGGER update_collaboration_sessions_updated_at
            BEFORE UPDATE ON collaboration_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_participants_last_seen') THEN
        CREATE TRIGGER update_session_participants_last_seen
            BEFORE UPDATE ON session_participants
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Add helpful comments
COMMENT ON TABLE collaboration_sessions IS 'Stores collaborative mindmap sessions with real-time editing capabilities';
COMMENT ON TABLE session_participants IS 'Tracks users participating in collaboration sessions with roles and presence';
COMMENT ON TABLE mindmap_operations IS 'Stores real-time operations for operational transform and conflict resolution';
COMMENT ON TABLE mindmap_snapshots IS 'Stores mindmap snapshots for version control and backup';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Collaboration features setup completed successfully!';
    RAISE NOTICE '✅ All collaboration tables are properly configured';
    RAISE NOTICE '✅ Row Level Security policies are in place';
    RAISE NOTICE '✅ Real-time subscriptions are enabled';
    RAISE NOTICE '✅ Indexes and triggers are configured';
    RAISE NOTICE '🚀 Ready for collaborative mindmap editing!';
END
$$;