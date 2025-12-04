-- Codette AI Conversation Storage Schema
-- Create tables for Codette's persistent knowledge and conversation history

-- Note: If you already have a chat_history table, this migration will extend it
-- with additional Codette-specific tables without modifying existing chat_history

-- Table: codette_conversations (NEW - dedicated to Codette AI)
-- Stores all Codette interactions for learning and context
CREATE TABLE IF NOT EXISTS codette_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Links to Supabase auth
    user_name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    personality_mode TEXT DEFAULT 'technical_expert',
    metadata JSONB DEFAULT '{}',
    sentiment_score JSONB,
    key_concepts TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Link to existing chat_history table
-- Add column to chat_history to mark Codette-generated messages
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history') THEN
        -- Add codette_generated flag to existing chat_history
        ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS codette_generated BOOLEAN DEFAULT false;
        ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS codette_personality TEXT;
        
        -- Add index for Codette messages
        CREATE INDEX IF NOT EXISTS idx_chat_history_codette ON chat_history(codette_generated) WHERE codette_generated = true;
    END IF;
END $$;

-- Table: codette_knowledge_base
-- Stores curated DAW knowledge entries
CREATE TABLE IF NOT EXISTS codette_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'mixing', 'eq', 'compression', 'effects', etc.
    subcategory TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    technical_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    tags TEXT[],
    frequency_range TEXT, -- For frequency-related entries
    parameters JSONB, -- For plugin/effect parameters
    examples TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: codette_user_preferences
-- Stores user-specific preferences and learning history
CREATE TABLE IF NOT EXISTS codette_user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT UNIQUE NOT NULL,
    preferred_personality TEXT DEFAULT 'technical_expert',
    interaction_count INTEGER DEFAULT 0,
    favorite_topics TEXT[],
    skill_level TEXT DEFAULT 'intermediate',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: codette_learning_patterns
-- Tracks common patterns and user learning progress
CREATE TABLE IF NOT EXISTS codette_learning_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    question_pattern TEXT,
    successful_response_ids UUID[],
    improvement_metrics JSONB,
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON codette_conversations(user_name);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON codette_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON codette_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON codette_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON codette_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_prefs_name ON codette_user_preferences(user_name);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON codette_user_preferences(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE codette_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE codette_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE codette_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE codette_learning_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY user_conversations_policy ON codette_conversations
    FOR ALL
    USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

-- Policy: Everyone can read knowledge base (public knowledge)
CREATE POLICY knowledge_read_policy ON codette_knowledge_base
    FOR SELECT
    USING (true);

-- Policy: Only service role can write to knowledge base
CREATE POLICY knowledge_write_policy ON codette_knowledge_base
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Users can manage their own preferences
CREATE POLICY user_prefs_policy ON codette_user_preferences
    FOR ALL
    USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

-- Policy: Users can see their own learning patterns
CREATE POLICY learning_patterns_policy ON codette_learning_patterns
    FOR ALL
    USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

-- Insert initial knowledge base entries
INSERT INTO codette_knowledge_base (category, subcategory, title, content, technical_level, tags, frequency_range) VALUES
('eq', 'frequency_ranges', 'Sub-Bass Fundamentals', 'Sub-bass (20-60Hz) is felt more than heard. Critical for EDM, hip-hop, and modern production. Keep mono for club system compatibility. Use high-pass filter at 30Hz to remove DC offset and rumble.', 'intermediate', ARRAY['bass', 'low-end', 'frequency'], '20-60Hz'),
('eq', 'frequency_ranges', 'Presence Range', 'Presence (2-4kHz) makes vocals cut through mix without increasing volume. Boost here for intelligibility, cut for smoothness. Most critical frequency range for vocal mixing.', 'beginner', ARRAY['vocal', 'eq', 'presence'], '2000-4000Hz'),
('compression', 'technique', 'Parallel Compression', 'Parallel (New York) compression: blend heavily compressed signal with dry signal. Preserves transients while adding density. Essential for drums, bass, vocals. Ratio 10:1+, blend 20-40%.', 'advanced', ARRAY['compression', 'drums', 'mixing'], NULL),
('mixing', 'workflow', 'Gain Staging Best Practices', 'Target -18dBFS RMS for optimal analog emulation plugin performance. Maintains headroom, prevents internal plugin clipping, ensures consistent sonic character. Check levels before and after each processor.', 'intermediate', ARRAY['gain', 'workflow', 'mixing'], NULL),
('effects', 'reverb', 'Reverb Pre-Delay Timing', 'Pre-delay 20-50ms creates separation between dry signal and reverb tail. Prevents wash/mud while maintaining spaciousness. Sync to tempo: 1/16 note = rhythmic pre-delay. Critical for vocal clarity.', 'advanced', ARRAY['reverb', 'effects', 'vocal'], NULL)
ON CONFLICT DO NOTHING;

-- Function: Get conversation context for AI
CREATE OR REPLACE FUNCTION get_conversation_context(
    p_user_name TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    prompt TEXT,
    response TEXT,
    personality_mode TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.prompt,
        c.response,
        c.personality_mode,
        c.created_at
    FROM codette_conversations c
    WHERE c.user_name = p_user_name
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get conversation context by user_id (auth integration)
CREATE OR REPLACE FUNCTION get_conversation_context_by_user(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    prompt TEXT,
    response TEXT,
    personality_mode TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.prompt,
        c.response,
        c.personality_mode,
        c.created_at
    FROM codette_conversations c
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get knowledge by category
CREATE OR REPLACE FUNCTION get_knowledge_by_category(
    p_category TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    title TEXT,
    content TEXT,
    technical_level TEXT,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.title,
        kb.content,
        kb.technical_level,
        kb.tags
    FROM codette_knowledge_base kb
    WHERE kb.category = p_category
    ORDER BY kb.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user interaction count
CREATE OR REPLACE FUNCTION increment_user_interactions(p_user_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO codette_user_preferences (user_name, interaction_count)
    VALUES (p_user_name, 1)
    ON CONFLICT (user_name)
    DO UPDATE SET 
        interaction_count = codette_user_preferences.interaction_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Link codette conversation to existing chat_history (if table exists)
CREATE OR REPLACE FUNCTION link_codette_to_chat_history(
    p_codette_conv_id UUID,
    p_chat_history_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Check if chat_history table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history') THEN
        -- Update chat_history to mark as Codette-generated
        UPDATE chat_history 
        SET 
            codette_generated = true,
            codette_personality = (
                SELECT personality_mode 
                FROM codette_conversations 
                WHERE id = p_codette_conv_id
            )
        WHERE id = p_chat_history_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE codette_conversations IS 'Stores all Codette AI conversations for learning and context (separate from general chat_history)';
COMMENT ON TABLE codette_knowledge_base IS 'Curated DAW knowledge base with technical audio engineering content';
COMMENT ON TABLE codette_user_preferences IS 'User-specific preferences and learning progress tracking';
COMMENT ON COLUMN codette_conversations.personality_mode IS 'Which personality mode was used: technical_expert, creative_mentor, practical_guide, analytical_teacher, innovative_explorer';
COMMENT ON COLUMN codette_knowledge_base.technical_level IS 'Target audience skill level: beginner, intermediate, advanced, expert';

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '? Codette AI schema created successfully!';
    RAISE NOTICE '   • codette_conversations table ready';
    RAISE NOTICE '   • codette_knowledge_base seeded with 5 entries';
    RAISE NOTICE '   • Integration with existing chat_history (if present)';
    RAISE NOTICE '   • RLS policies enabled for security';
END $$;
