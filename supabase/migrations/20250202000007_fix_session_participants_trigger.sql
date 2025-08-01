-- Fix session_participants trigger to update last_seen instead of updated_at

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_session_participants_last_seen ON session_participants;

-- Create a proper function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the correct trigger for session_participants
CREATE TRIGGER update_session_participants_last_seen
    BEFORE UPDATE ON session_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen_column();