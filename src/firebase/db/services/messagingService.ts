import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  orderBy,
  limit,
  onSnapshot,
  setDoc
} from "firebase/firestore";
import db from "../firestore";
import { Conversation, Message, ConversationSummary } from "../model/messagemodel";
import { getUserProfile } from "./userProfileService";

/**
 * Gets or creates a conversation between two users
 * @param userId Current user ID
 * @param otherUserId ID of the other user
 * @returns The conversation ID
 */
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  try {
    // Look for existing conversation between these users
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Check if a conversation already exists with these participants
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.participants && Array.isArray(data.participants) && data.participants.includes(otherUserId)) {
        return docSnapshot.id;
      }
    }
    
    // Otherwise, create a new conversation
    const newConversation = {
      participants: [userId, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    return docRef.id;
    
  } catch (error) {
    console.error("Error getting or creating conversation:", error);
    throw error;
  }
}

/**
 * Sends a message in a conversation
 * @param conversationId ID of the conversation
 * @param senderId ID of the sender
 * @param text Message text
 * @returns ID of the sent message
 */
export async function sendMessage(
  conversationId: string, 
  senderId: string, 
  text: string
): Promise<string> {
  try {
    // Create new message with client-side timestamp first for better optimistic updates
    const clientTimestamp = Timestamp.now();
    const messagesRef = collection(db, "messages");
    const newMessage = {
      conversationId,
      senderId,
      text,
      timestamp: clientTimestamp, // Use client timestamp for immediate display
      read: false
    };
    
    // Add message to Firestore
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update the message with server timestamp after it's created
    await updateDoc(doc(db, "messages", docRef.id), {
      timestamp: serverTimestamp()
    });
    
    // Update the conversation's last message
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text,
        senderId,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
    
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Marks messages as read
 * @param conversationId ID of the conversation
 * @param userId ID of the current user (recipient)
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    // Use simpler queries to avoid composite index requirements
    // First, just query messages by conversationId
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Then filter the results client-side by sender and read status
    const unreadMessages = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.senderId !== userId && data.read === false;
    });
    
    // Update each unread message
    const updatePromises = unreadMessages.map(async (document) => {
      const messageRef = doc(db, "messages", document.id);
      await updateDoc(messageRef, {
        read: true,
        readAt: serverTimestamp()
      });
    });
    
    await Promise.all(updatePromises);
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

/**
 * Gets all conversations for a user
 * @param userId ID of the user
 * @returns Array of conversation summaries
 */
export async function getUserConversations(userId: string): Promise<ConversationSummary[]> {
  try {
    if (!userId) {
      console.error("getUserConversations called with empty userId");
      return [];
    }

    // Query conversations where the user is a participant
    // Note: Using a simple query first to avoid index requirements
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // If no conversations found, return empty array
    if (querySnapshot.empty) {
      return [];
    }
    
    // Manual client-side sorting by updatedAt (avoids index requirements)
    const sortedConversations = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime; // descending order
      });
    
    // Batch fetch all user profiles at once
    const otherUserIds = sortedConversations
      .map(conv => conv.participants.find(id => id !== userId) || "")
      .filter(id => id !== "");
    
    const uniqueUserIds = [...new Set(otherUserIds)];
    const userProfilesMap = new Map();
    
    // Pre-fetch all user profiles in parallel 
    if (uniqueUserIds.length > 0) {
      try {
        const userProfiles = await Promise.all(
          uniqueUserIds.map(id => getUserProfile(id))
        );
        
        uniqueUserIds.forEach((id, index) => {
          if (userProfiles[index]) {
            userProfilesMap.set(id, userProfiles[index]);
          }
        });
      } catch (err) {
        console.error("Error batch fetching user profiles:", err);
      }
    }
    
    // Process conversations with pre-fetched profiles
    const conversationPromises = sortedConversations.map(async (conversation) => {
      try {
        // Find the other participant's ID
        const otherUserId = conversation.participants.find(id => id !== userId) || "";
        
        if (!otherUserId) {
          console.warn(`No other participant found in conversation ${conversation.id}`);
          return null;
        }
        
        // Get the other user's profile from our pre-fetched map
        const otherUser = userProfilesMap.get(otherUserId);
        
        if (!otherUser) {
          console.warn(`User profile not found for ${otherUserId} in conversation ${conversation.id}`);
        }
        
        // Count unread messages
        const unreadQuery = query(
          collection(db, "messages"),
          where("conversationId", "==", conversation.id),
          where("senderId", "==", otherUserId),
          where("read", "==", false)
        );
        
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.size;
        
        // Format last message date
        const lastMessageDate = conversation.lastMessage?.timestamp 
          ? conversation.lastMessage.timestamp.toDate() 
          : new Date(0);
        
        return {
          id: conversation.id,
          otherUserId,
          otherUserName: otherUser?.displayName || otherUser?.username || "Unknown User",
          otherUserPhoto: otherUser?.profileImageUrl,
          lastMessage: conversation.lastMessage?.text || "No messages yet",
          lastMessageDate,
          unreadCount,
          isLastMessageMine: conversation.lastMessage?.senderId === userId
        } as ConversationSummary;
      } catch (err) {
        console.error(`Error processing conversation: ${conversation.id}`, err);
        return null;
      }
    });
    
    const results = await Promise.all(conversationPromises);
    // Filter out any null results from errors and cast to the correct type
    return results.filter((result): result is ConversationSummary => result !== null);
    
  } catch (error) {
    console.error("Error getting user conversations:", error);
    // Display the Firestore index creation link if available
    if (error instanceof Error && error.message.includes("index")) {
      console.info("You need to create an index for this query. Follow the link in the error message above.");
    }
    return [];
  }
}

/**
 * Gets messages for a specific conversation
 * @param conversationId ID of the conversation
 * @param limit Maximum number of messages to retrieve
 * @returns Array of messages
 */
export async function getConversationMessages(
  conversationId: string, 
  messageLimit = 50
): Promise<Message[]> {
  try {
    if (!conversationId) {
      console.error("getConversationMessages called with empty conversationId");
      return [];
    }

    // Simpler query that only filters by conversationId to avoid index requirements
    // We'll add client-side filtering if needed
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      // Only use orderBy with timestamp to avoid composite index requirements
      orderBy("timestamp", "desc"),
      limit(messageLimit)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Handle messages with pending timestamps (like optimistic updates)
        timestamp: data.timestamp instanceof Timestamp 
          ? data.timestamp 
          : data.timestamp === null
            ? Timestamp.fromMillis(Date.now()) // Handle null timestamps from pending messages
            : Timestamp.now()
      } as Message;
    });
    
    // Return in chronological order (oldest first)
    return messages.reverse();
    
  } catch (error) {
    console.error(`Error getting messages for conversation ${conversationId}:`, error);
    if (error instanceof Error && error.message.includes("index")) {
      console.info("You need to create an index for this query. Follow the link in the error message above.");
    }
    return [];
  }
}

/**
 * Subscribe to messages for a specific conversation
 * This is more efficient than polling and avoids message disappearing
 * @param conversationId ID of the conversation
 * @param callback Function to call with updated messages
 * @returns Unsubscribe function
 */
export function subscribeToConversationMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  if (!conversationId) {
    console.error("subscribeToConversationMessages called with empty conversationId");
    callback([]);
    return () => {};
  }

  // Use a simple query to avoid index requirements
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId)
  );

  let lastProcessedMessages: Message[] = [];

  // Subscribe to message updates
  const unsubscribe = onSnapshot(q, (snapshot) => {
    try {
      // Check if there are actual changes before processing
      if (snapshot.empty && lastProcessedMessages.length === 0) {
        callback([]);
        return;
      }

      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp 
            : data.timestamp === null
              ? Timestamp.fromMillis(Date.now()) // Handle null timestamps
              : Timestamp.now()
        } as Message;
      });

      // Sort by timestamp manually (client-side)
      const sortedMessages = messages.sort((a, b) => {
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      });

      // Only update if there are real changes
      const hasChanges = sortedMessages.length !== lastProcessedMessages.length ||
        sortedMessages.some((msg, i) => 
          i >= lastProcessedMessages.length || 
          msg.id !== lastProcessedMessages[i].id || 
          msg.read !== lastProcessedMessages[i].read
        );

      if (hasChanges) {
        lastProcessedMessages = sortedMessages;
        callback(sortedMessages);
      }
    } catch (error) {
      console.error(`Error in message subscription for ${conversationId}:`, error);
      callback(lastProcessedMessages); // Return the last known good set of messages
    }
  }, (error) => {
    console.error(`Error in message subscription for ${conversationId}:`, error);
    callback(lastProcessedMessages); // Return the last known good set of messages
  });

  return unsubscribe;
}

/**
 * Subscribe to conversations for a user
 * Using real-time updates to avoid refreshes and constant API calls
 * @param userId ID of the user
 * @param callback Function to call with updated conversations
 * @returns Unsubscribe function
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: ConversationSummary[]) => void
): () => void {
  if (!userId) {
    console.error("subscribeToConversations called with empty userId");
    callback([]);
    return () => {};
  }

  // Create a cache for user profiles to avoid repetitive fetches
  const userProfileCache = new Map();

  // Query conversations where the user is a participant
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    try {
      // Manually sort the conversations by updatedAt
      const sortedConversations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime; // descending order
        });

      if (sortedConversations.length === 0) {
        callback([]);
        return;
      }

      // Get all other user IDs that we need to fetch
      const otherUserIds = sortedConversations
        .map(conv => conv.participants.find(id => id !== userId))
        .filter(Boolean) as string[];
      const uniqueOtherUserIds = [...new Set(otherUserIds)];

      // Fetch profiles for users we don't have cached yet
      const profilesToFetch = uniqueOtherUserIds.filter(id => !userProfileCache.has(id));
      if (profilesToFetch.length > 0) {
        const profiles = await Promise.all(
          profilesToFetch.map(id => getUserProfile(id))
        );
        profilesToFetch.forEach((id, index) => {
          if (profiles[index]) {
            userProfileCache.set(id, profiles[index]);
          }
        });
      }

      // Build the conversation summaries with unread counts
      const summaryPromises = sortedConversations.map(async (conversation) => {
        try {
          const otherUserId = conversation.participants.find(id => id !== userId) || "";
          if (!otherUserId) return null;

          const otherUser = userProfileCache.get(otherUserId);

          // Count unread messages
          const unreadQuery = query(
            collection(db, "messages"),
            where("conversationId", "==", conversation.id),
            where("senderId", "==", otherUserId),
            where("read", "==", false)
          );
          
          const unreadSnapshot = await getDocs(unreadQuery);
          const unreadCount = unreadSnapshot.size;
          
          // Format last message date
          const lastMessageDate = conversation.lastMessage?.timestamp 
            ? conversation.lastMessage.timestamp.toDate() 
            : new Date(0);
          
          return {
            id: conversation.id,
            otherUserId,
            otherUserName: otherUser?.displayName || otherUser?.username || "Unknown User",
            otherUserPhoto: otherUser?.profileImageUrl,
            lastMessage: conversation.lastMessage?.text || "No messages yet",
            lastMessageDate,
            unreadCount,
            isLastMessageMine: conversation.lastMessage?.senderId === userId
          } as ConversationSummary;
        } catch (err) {
          console.error(`Error processing conversation: ${conversation.id}`, err);
          return null;
        }
      });

      const results = await Promise.all(summaryPromises);
      callback(results.filter((result): result is ConversationSummary => result !== null));

    } catch (error) {
      console.error("Error in conversation subscription:", error);
      callback([]);
    }
  }, (error) => {
    console.error("Error in conversation subscription:", error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Gets the total count of unread messages for a user
 * @param userId ID of the user
 * @returns Total count of unread messages
 */
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    if (!userId) {
      console.error("getUnreadMessagesCount called with empty userId");
      return 0;
    }

    // Get all conversations for this user
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0;
    }
    
    const conversationIds = querySnapshot.docs.map(doc => doc.id);
    
    // Count all unread messages not sent by this user
    let totalUnread = 0;
    
    for (const conversationId of conversationIds) {
      // Query all messages in the conversation
      const messageQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId)
      );
      
      const messageSnapshot = await getDocs(messageQuery);
      
      // Filter client-side instead of using multiple where clauses
      const unreadCount = messageSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.senderId !== userId && data.read === false;
      }).length;
      
      totalUnread += unreadCount;
    }
    
    return totalUnread;
    
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    return 0;
  }
}

/**
 * Subscribe to unread message count updates
 * @param userId ID of the user
 * @param callback Function to call with updated count
 * @returns Unsubscribe function
 */
export function subscribeToUnreadCount(
  userId: string, 
  callback: (count: number) => void
): () => void {
  // We can't directly query like this in Firestore, so we'll use a workaround
  // First, get all conversations for this user
  const conversationsRef = collection(db, "conversations");
  const conversationsQuery = query(
    conversationsRef,
    where("participants", "array-contains", userId)
  );
  
  // Subscribe to conversation updates
  const unsubscribe = onSnapshot(conversationsQuery, async () => {
    try {
      const count = await getUnreadMessagesCount(userId);
      callback(count);
    } catch (error) {
      console.error("Error in unread count subscription:", error);
      callback(0);
    }
  });
  
  return unsubscribe;
}

/**
 * Mark messages from a specific sender in a conversation as read
 * Simpler version that doesn't require compound queries
 * @param conversationId ID of the conversation
 * @param currentUserId ID of the current user (recipient)
 * @param otherUserId ID of the other user (sender)
 */
export async function markMessagesFromSenderAsRead(
  conversationId: string,
  otherUserId: string
): Promise<void> {
  try {
    // Simple query to avoid index requirements
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter client-side to find unread messages from the other user to the current user
      const unreadMessages = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.senderId === otherUserId && data.read === false;
      });
    
    // If no unread messages, exit early
    if (unreadMessages.length === 0) {
      return;
    }
    
    console.log(`Marking ${unreadMessages.length} messages as read from ${otherUserId} in conversation ${conversationId}`);
    
    // Update each unread message
    const updatePromises = unreadMessages.map(async (document) => {
      try {
        const messageRef = doc(db, "messages", document.id);
        await updateDoc(messageRef, {
          read: true,
          readAt: serverTimestamp()
        });
      } catch (e) {
        console.error(`Failed to update message ${document.id}:`, e);
      }
    });
    
    await Promise.all(updatePromises);
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

/**
 * Send typing status to conversation
 * @param conversationId ID of the conversation
 * @param userId ID of the user who is typing
 * @param isTyping boolean indicating if the user is typing
 */
export async function sendTypingStatus(
  conversationId: string, 
  userId: string, 
  isTyping: boolean
): Promise<void> {
  try {
    const typingRef = doc(db, "typingStatus", `${conversationId}_${userId}`);
    
    await setDoc(typingRef, {
      conversationId,
      userId,
      isTyping,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating typing status:", error);
    throw error;
  }
}

/**
 * Subscribe to typing status updates for a specific user in a conversation
 * @param conversationId ID of the conversation
 * @param userId ID of the user to watch typing status for
 * @param callback Function to call with updated typing status
 * @returns Unsubscribe function
 */
export function subscribeToTypingStatus(
  conversationId: string,
  userId: string,
  callback: (isTyping: boolean) => void
): () => void {
  const typingRef = doc(db, "typingStatus", `${conversationId}_${userId}`);
  
  const unsubscribe = onSnapshot(typingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      
      // Check if the typing status is recent (within last 10 seconds)
      // This helps prevent "stuck" typing indicators
      const timestamp = data.timestamp?.toMillis() || Date.now();
      const isRecent = Date.now() - timestamp < 10000;
      
      callback(data.isTyping && isRecent);
    } else {
      callback(false);
    }
  }, (error) => {
    console.error("Error in typing status subscription:", error);
    callback(false);
  });
  
  return unsubscribe;
}

/**
 * Get new messages received within the specified timeframe
 * @param userId ID of the current user
 * @param timeWindowMs Time window in milliseconds to check for new messages
 * @returns Array of new messages with sender information
 */
export async function getNewMessages(
  userId: string,
  timeWindowMs: number = 60000 // Default to last minute
): Promise<Array<{
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
}>> {
  try {
    if (!userId) return [];
    
    // Get all conversations for this user first
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return [];
    
    const conversationIds = querySnapshot.docs.map(doc => doc.id);
    const timeThreshold = new Date(Date.now() - timeWindowMs);
    
    // Find all new messages across all conversations
    const newMessages: Array<{
      id: string;
      conversationId: string;
      senderId: string;
      senderName: string;
      text: string;
      timestamp: Timestamp;
    }> = [];
    
    // Create a map to avoid fetching the same user profile multiple times
    const userProfileCache = new Map();
    
    // For each conversation, find recent messages not from the current user
    for (const conversationId of conversationIds) {
      // Get messages in this conversation
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Filter client-side for messages:
      // 1. Not from the current user
      // 2. Within the time window
      // 3. Not already seen (we'll use unread status)
      const recentMessages = messagesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => 
          msg.senderId !== userId && 
          msg.timestamp.toDate() > timeThreshold &&
          !msg.read
        );
      
      // If we found recent messages, add them to our results with sender info
      for (const msg of recentMessages) {
        // Get sender profile (using cache if available)
        let senderProfile = userProfileCache.get(msg.senderId);
        if (!senderProfile) {
          senderProfile = await getUserProfile(msg.senderId);
          if (senderProfile) {
            userProfileCache.set(msg.senderId, senderProfile);
          }
        }
        
        const senderName = senderProfile?.displayName || 
                           senderProfile?.username || 
                           "Unknown User";
        
        newMessages.push({
          id: msg.id,
          conversationId,
          senderId: msg.senderId,
          senderName,
          text: msg.text,
          timestamp: msg.timestamp
        });
      }
    }
    
    // Sort by timestamp (newest first)
    return newMessages.sort((a, b) => 
      b.timestamp.toMillis() - a.timestamp.toMillis()
    );
    
  } catch (error) {
    console.error("Error getting new messages:", error);
    return [];
  }
}
