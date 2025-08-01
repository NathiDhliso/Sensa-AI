-- Phase 1: Foundation & Core Sync - Database Schema for Collaborative Epistemic Driver
-- This migration creates the foundational tables for real-time collaborative mindmap editing

-- Collaboration Sessions Table
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epistemic_driver_id UUID REFERENCES epistemic_driver_history(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  session_settings JSONB DEFAULT '{}'
);

-- Session Participants Table
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('facilitator', 'participant', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  UNIQUE(session_id, user_id)
);

-- Mindmap Operations Table (for operational transform)
CREATE TABLE mindmap_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'add_node', 'edit_node', 'delete_node', 'move_node',
    'add_edge', 'edit_edge', 'delete_edge',
    'batch_operation', 'undo', 'redo'
  )),
  operation_data JSONB NOT NULL,
  sequence_number BIGINT NOT NULL,
  parent_operation_id UUID REFERENCES mindmap_operations(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied BOOLEAN DEFAULT false,
  conflict_resolved BOOLEAN DEFAULT false
);

-- Mindmap State Snapshots (for version control)
CREATE TABLE mindmap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  snapshot_name TEXT,
  nodes_data JSONB NOT NULL DEFAULT '[]',
  edges_data JSONB NOT NULL DEFAULT '[]',
  operation_sequence BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_checkpoint BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_collaboration_sessions_active ON collaboration_sessions(is_active, created_at);
CREATE INDEX idx_collaboration_sessions_creator ON collaboration_sessions(created_by);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);
CREATE INDEX idx_session_participants_online ON session_participants(session_id, is_online);
CREATE INDEX idx_mindmap_operations_session ON mindmap_operations(session_id, sequence_number);
CREATE INDEX idx_mindmap_operations_timestamp ON mindmap_operations(timestamp);
CREATE INDEX idx_mindmap_snapshots_session ON mindmap_snapshots(session_id, created_at);

-- Sequence for operation ordering
CREATE SEQUENCE mindmap_operation_sequence;

-- Function to auto-increment sequence number
CREATE OR REPLACE FUNCTION set_operation_sequence()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sequence_number := nextval('mindmap_operation_sequence');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-incrementing sequence
CREATE TRIGGER trigger_set_operation_sequence
  BEFORE INSERT ON mindmap_operations
  FOR EACH ROW
  EXECUTE FUNCTION set_operation_sequence();

-- Function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating last_seen
CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE ON session_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_last_seen();

-- Row Level Security (RLS) Policies
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view sessions they participate in" ON collaboration_sessions
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM session_participants 
      WHERE session_id = collaboration_sessions.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions" ON collaboration_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can update their sessions" ON collaboration_sessions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Session creators can delete their sessions" ON collaboration_sessions
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for session_participants
CREATE POLICY "Participants can view session participants" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_participants.session_id
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions" ON session_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON session_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions" ON session_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mindmap_operations
CREATE POLICY "Participants can view operations in their sessions" ON mindmap_operations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = mindmap_operations.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create operations" ON mindmap_operations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = mindmap_operations.session_id
      AND user_id = auth.uid()
      AND role IN ('facilitator', 'participant')
    )
  );

-- RLS Policies for mindmap_snapshots
CREATE POLICY "Participants can view snapshots" ON mindmap_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = mindmap_snapshots.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create snapshots" ON mindmap_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = mindmap_snapshots.session_id
      AND user_id = auth.uid()
      AND role IN ('facilitator', 'participant')
    )
  );

-- Enable realtime for all collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE mindmap_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE mindmap_snapshots;

-- Comments for documentation
COMMENT ON TABLE collaboration_sessions IS 'Stores collaborative mindmap editing sessions';
COMMENT ON TABLE session_participants IS 'Tracks users participating in collaboration sessions';
COMMENT ON TABLE mindmap_operations IS 'Stores all mindmap operations for operational transform';
COMMENT ON TABLE mindmap_snapshots IS 'Stores mindmap state snapshots for version control';