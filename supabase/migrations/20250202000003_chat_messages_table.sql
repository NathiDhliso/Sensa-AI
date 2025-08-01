-- Chat Messages Table for Phase 2: Interactive Communication
-- Supports real-time chat with AI processing and advanced features

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Can reference users.id or be 'ai-assistant'
    user_name TEXT NOT NULL,
    user_color TEXT NOT NULL DEFAULT '#6B46C1',
    message TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'system', 'ai_suggestion', 'voice_transcript')) DEFAULT 'text',
    processed_content TEXT, -- Backend-processed content
    sentiment_score DECIMAL(3,2), -- AI-analyzed sentiment (-1 to 1)
    mentions TEXT[], -- @mentions extracted by backend
    attachments JSONB DEFAULT '[]', -- File/image/node attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT FALSE,
    thread_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL -- For threaded conversations
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Session participants can view chat messages') THEN
        CREATE POLICY "Session participants can view chat messages"
        ON chat_messages
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Session participants can send chat messages') THEN
        CREATE POLICY "Session participants can send chat messages"
        ON chat_messages
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update their own chat messages') THEN
        CREATE POLICY "Users can update their own chat messages"
        ON chat_messages
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Allow AI assistant messages') THEN
        CREATE POLICY "Allow AI assistant messages"
        ON chat_messages
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- Create trigger for automatic timestamp updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_messages_edited_at') THEN
        CREATE TRIGGER update_chat_messages_edited_at
            BEFORE UPDATE ON chat_messages
            FOR EACH ROW
            WHEN (OLD.message IS DISTINCT FROM NEW.message)
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Enable Realtime for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END
$$;

-- Create function for message cleanup (delete old messages)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    -- Delete messages older than 30 days, except pinned ones
    DELETE FROM chat_messages 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_pinned = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function for message search with full-text search
CREATE OR REPLACE FUNCTION search_chat_messages(
    p_session_id UUID,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_name TEXT,
    message TEXT,
    processed_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.user_name,
        cm.message,
        cm.processed_content,
        cm.created_at,
        ts_rank(to_tsvector('english', COALESCE(cm.processed_content, cm.message)), plainto_tsquery('english', p_search_term)) as relevance
    FROM chat_messages cm
    WHERE cm.session_id = p_session_id
    AND (
        to_tsvector('english', COALESCE(cm.processed_content, cm.message)) @@ plainto_tsquery('english', p_search_term)
        OR cm.message ILIKE '%' || p_search_term || '%'
        OR cm.processed_content ILIKE '%' || p_search_term || '%'
    )
    ORDER BY relevance DESC, cm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE chat_messages IS 'Real-time chat messages for collaborative sessions with AI processing';
COMMENT ON COLUMN chat_messages.processed_content IS 'Backend-processed message content with enhancements';
COMMENT ON COLUMN chat_messages.sentiment_score IS 'AI-analyzed sentiment score from -1 (negative) to 1 (positive)';
COMMENT ON COLUMN chat_messages.mentions IS 'Array of @mentioned user IDs extracted by backend';
COMMENT ON COLUMN chat_messages.attachments IS 'JSON array of file, image, or mindmap node attachments';
COMMENT ON COLUMN chat_messages.thread_id IS 'Reference to parent message for threaded conversations';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '💬 Chat messages table created successfully!';
    RAISE NOTICE '✅ Real-time chat with AI processing enabled';
    RAISE NOTICE '✅ Message threading and pinning supported';
    RAISE NOTICE '✅ Full-text search capabilities added';
    RAISE NOTICE '✅ Automatic cleanup and maintenance functions created';
    RAISE NOTICE '🚀 Phase 2: Interactive Communication ready!';
END
$$;