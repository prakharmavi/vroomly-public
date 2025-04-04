import { Timestamp } from "firebase/firestore";

/**
 * Represents a conversation between two users
 */
export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Represents a message within a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  readAt?: Timestamp;
}

/**
 * Summary of conversations for a user
 */
export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: string;
  lastMessageDate: Date;
  unreadCount: number;
  isLastMessageMine: boolean;
}
