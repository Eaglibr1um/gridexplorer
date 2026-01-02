# Group Chat Read Receipts Implementation

## Problem
For group chats with multiple participants, we need to track read receipts **per user** rather than a simple boolean. Each message can have multiple receivers, and we need to know which users have read it.

## Solution: Separate `read_receipts` Table

### Database Schema

```sql
-- Read receipts table
CREATE TABLE read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- 'admin' or tutee.id
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id) -- One receipt per user per message
);

-- Indexes for performance
CREATE INDEX idx_read_receipts_message ON read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON read_receipts(user_id);
CREATE INDEX idx_read_receipts_user_message ON read_receipts(user_id, message_id);

-- Optional: For group chats, you might also want a conversations/threads table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, -- Optional group name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- 'admin' or tutee.id
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Updated messages table (if supporting group chats)
-- Keep receiver_id for backward compatibility with 1-to-1 chats
-- OR use conversation_id for group chats
ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
```

## Updated TypeScript Interfaces

```typescript
// src/services/messagingService.ts

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string; // Optional for backward compatibility
  conversation_id?: string; // For group chats
  content: string;
  is_read?: boolean; // Keep for backward compatibility with 1-to-1
  created_at: string;
  // Joined data
  read_receipts?: ReadReceipt[];
  read_by?: string[]; // Array of user IDs who have read
}

export interface ReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface Conversation {
  id: string;
  name?: string;
  participants: string[]; // Array of user IDs
  created_at: string;
  updated_at: string;
}
```

## Updated Service Methods

```typescript
export const messagingService = {
  /**
   * Mark a message as read by a specific user
   */
  markAsRead: async (messageId: string, userId: string): Promise<void> => {
    try {
      // Use upsert to avoid duplicates (UNIQUE constraint handles this)
      const { error } = await supabase
        .from('read_receipts')
        .upsert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  },

  /**
   * Mark multiple messages as read (when user opens chat)
   */
  markConversationAsRead: async (
    conversationId: string, 
    userId: string
  ): Promise<void> => {
    try {
      // Get all unread messages in this conversation
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId); // Don't mark own messages as read

      if (fetchError) throw fetchError;
      if (!messages || messages.length === 0) return;

      // Create read receipts for all messages
      const receipts = messages.map(msg => ({
        message_id: msg.id,
        user_id: userId,
        read_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('read_receipts')
        .upsert(receipts, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  /**
   * Get unread count for a user in a conversation
   */
  getUnreadCount: async (
    conversationId: string, 
    userId: string
  ): Promise<number> => {
    try {
      // Count messages in conversation that user hasn't read
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId) // Don't count own messages
        .not('id', 'in', 
          supabase
            .from('read_receipts')
            .select('message_id')
            .eq('user_id', userId)
            .select('message_id')
        );

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Better approach: Use a LEFT JOIN query
   */
  getUnreadCountOptimized: async (
    conversationId: string,
    userId: string
  ): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_count', {
          p_conversation_id: conversationId,
          p_user_id: userId
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Fetch conversation with read receipts
   */
  fetchConversation: async (
    conversationId: string,
    userId: string
  ): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          read_receipts!left (
            id,
            user_id,
            read_at
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform to include read_by array
      return (data || []).map(msg => ({
        ...msg,
        read_by: (msg.read_receipts || []).map((rr: ReadReceipt) => rr.user_id),
        is_read: (msg.read_receipts || []).some(
          (rr: ReadReceipt) => rr.user_id === userId
        )
      }));
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  /**
   * Check if a specific user has read a message
   */
  hasUserReadMessage: async (
    messageId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('read_receipts')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return !!data;
    } catch (error) {
      console.error('Error checking read status:', error);
      return false;
    }
  },

  /**
   * Get read receipts for a message (who has read it)
   */
  getReadReceipts: async (messageId: string): Promise<ReadReceipt[]> => {
    try {
      const { data, error } = await supabase
        .from('read_receipts')
        .select('*')
        .eq('message_id', messageId)
        .order('read_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting read receipts:', error);
      return [];
    }
  }
};
```

## Database Function (Optional, for better performance)

```sql
-- PostgreSQL function for efficient unread count
CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id TEXT
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM read_receipts rr
        WHERE rr.message_id = m.id
          AND rr.user_id = p_user_id
      )
  );
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Option 1: Hybrid Approach (Recommended)
Keep `is_read` for backward compatibility with 1-to-1 chats, add `read_receipts` for group chats:

```typescript
// Check if it's a group chat or 1-to-1
const isGroupChat = !!message.conversation_id;

if (isGroupChat) {
  // Use read_receipts table
  await messagingService.markAsRead(messageId, userId);
} else {
  // Use legacy is_read field
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .eq('receiver_id', userId);
}
```

### Option 2: Full Migration
Migrate all existing 1-to-1 chats to use `read_receipts`:

```sql
-- Migration script
INSERT INTO read_receipts (message_id, user_id, read_at)
SELECT 
  id as message_id,
  receiver_id as user_id,
  created_at as read_at -- Approximate read time
FROM messages
WHERE is_read = true
  AND receiver_id IS NOT NULL
ON CONFLICT (message_id, user_id) DO NOTHING;
```

## UI Updates

```typescript
// In ChatModule.tsx - show read status per user
const MessageBubble = ({ message, currentUserId, participants }) => {
  const hasRead = message.read_by?.includes(currentUserId) || false;
  const readByOthers = message.read_by?.filter(id => id !== message.sender_id) || [];
  
  return (
    <div>
      {/* Message content */}
      {message.sender_id === currentUserId && (
        <div className="read-status">
          {readByOthers.length === participants.length - 1 ? (
            <CheckCheck /> // All read
          ) : readByOthers.length > 0 ? (
            <Check /> // Some read
          ) : (
            <Clock /> // Not read
          )}
          {readByOthers.length > 0 && (
            <span>Read by {readByOthers.length}</span>
          )}
        </div>
      )}
    </div>
  );
};
```

## Benefits of Separate Table

1. ✅ **Scalable**: Works for any number of participants
2. ✅ **Flexible**: Can track read timestamps
3. ✅ **Queryable**: Easy to query "who has read what"
4. ✅ **Normalized**: Follows database best practices
5. ✅ **Efficient**: Indexed for fast lookups
6. ✅ **Extensible**: Can add more metadata later (e.g., read location, device)

## Performance Considerations

- Use indexes on `(message_id, user_id)` for fast lookups
- Consider batch operations when marking many messages as read
- Use database functions for complex queries
- Cache read receipts in frontend state to reduce queries



