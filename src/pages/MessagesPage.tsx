import { useState, useEffect } from "react";
import {  useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/firebase/auth/AuthContext";
import { MessageList } from "@/components/messaging/MessageList";
import { ConversationView } from "@/components/messaging/ConversationView";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/firebase/db/services/messagingService";
import { getUserProfileByUsername } from "@/firebase/db/services/userServices";
import { motion, AnimatePresence } from "framer-motion";

export function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // The username parameter is optional and used when starting a new conversation
  const { username, conversationId: routeConversationId } = useParams<{ 
    username?: string;
    conversationId?: string;
  }>();
  
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUserId: string;
    otherUserName: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'conversation'>('list');

  // Handle initializing a conversation with a user from the URL
  useEffect(() => {
    // If no user, don't proceed with initialization
    if (!user) return;
    async function initConversation() {
      // If a username is provided in the URL, start a conversation with that user
      if (username && user) {
        setLoading(true);
        try {
          // Look up the user by username
          const targetUser = await getUserProfileByUsername(username);
          if (!targetUser) {
            setError(`User "${username}" not found`);
            return;
          }

          // Create or get a conversation with this user
          const conversationId = await getOrCreateConversation(user.uid, targetUser.uid);
          
          // Set the selected conversation
          setSelectedConversation({
            id: conversationId,
            otherUserId: targetUser.uid,
            otherUserName: targetUser.displayName || targetUser.username
          });
          
          // Update the URL to include the conversation ID without reloading
          navigate(`/messages/${conversationId}`, { replace: true });
          
          // Switch to conversation view
          setViewMode('conversation');
        } catch (err) {
          console.error("Error initializing conversation:", err);
          setError("Failed to start conversation. Please try again.");
        } finally {
          setLoading(false);
        }
      }
      // If a conversation ID is provided in the URL
      else if (routeConversationId) {
        setLoading(true);
        // We don't have the other user details yet, but will get them from the MessageList component
        setViewMode('conversation');
        setLoading(false);
      }
    }

    initConversation();
  }, [username, user, navigate, routeConversationId]);

  // Handle conversation selection
  const handleSelectConversation = (
    conversationId: string, 
    otherUserId: string, 
    otherUserName: string
  ) => {
    setSelectedConversation({
      id: conversationId,
      otherUserId,
      otherUserName
    });
    
    // Update URL to show the selected conversation
    navigate(`/messages/${conversationId}`);
    
    // On mobile, switch to conversation view
    setViewMode('conversation');
  };

  // Handle going back to the list on mobile
  const handleBackToList = () => {
    setViewMode('list');
    navigate('/messages');
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <motion.h1 
          className="text-2xl font-bold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Messages
        </motion.h1>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md"
        >
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={() => navigate('/messages')}
          >
            Back to Messages
          </Button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-16">
          <motion.div 
            className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : user ? (
        <motion.div 
          className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Message list (hidden on mobile when viewing a conversation) */}
          <AnimatePresence mode="wait">
            {viewMode !== 'conversation' || window.innerWidth >= 768 ? (
              <motion.div 
                key="message-list"
                className={`md:col-span-1 border rounded-lg overflow-hidden ${
                  viewMode === 'conversation' ? 'hidden md:block' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MessageList 
                  userId={user.uid}
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id || routeConversationId}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Conversation view */}
          <AnimatePresence mode="wait">
            {(selectedConversation || routeConversationId) && (viewMode === 'conversation' || window.innerWidth >= 768) ? (
              <motion.div 
                key="conversation-view"
                className={`md:col-span-2 border rounded-lg overflow-hidden ${
                  viewMode === 'list' ? 'hidden md:block' : ''
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {selectedConversation ? (
                  <ConversationView
                    conversationId={selectedConversation.id}
                    userId={user.uid}
                    otherUserId={selectedConversation.otherUserId}
                    otherUserName={selectedConversation.otherUserName}
                    onBack={handleBackToList}
                  />
                ) : routeConversationId ? (
                  // If we have a conversation ID from the URL but no details yet,
                  // show a placeholder that will be replaced when the conversation is loaded
                  <div className="flex justify-center items-center h-full">
                    <motion.div 
                      className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                className="md:col-span-2 border rounded-lg overflow-hidden hidden md:flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                  <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-xl font-medium">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation from the list to start chatting</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-xl font-medium">Please log in</p>
          <p className="text-sm mt-2">You need to be logged in to view messages</p>
        </motion.div>
      )}
    </div>
  );
}
