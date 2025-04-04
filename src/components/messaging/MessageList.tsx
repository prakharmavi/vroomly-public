import { useState, useEffect } from "react";
import { subscribeToConversations } from "@/firebase/db/services/messagingService";
import { ConversationSummary } from "@/firebase/db/model/messagemodel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, User, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface MessageListProps {
  userId: string;
  onSelectConversation: (conversationId: string, otherUserId: string, otherUserName: string) => void;
  selectedConversationId?: string;
}

export function MessageList({ userId, onSelectConversation, selectedConversationId }: MessageListProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedConversation, setHighlightedConversation] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    
    // Set up subscription to conversations
    const unsubscribe = subscribeToConversations(userId, (conversations) => {
      // Check if there's a new message from another conversation
      if (conversations.length > 0 && selectedConversationId) {
        const newMessages = conversations.filter(conv => 
          conv.id !== selectedConversationId && 
          conv.unreadCount > 0
        );
        
        if (newMessages.length > 0) {
          // Highlight the conversation with new messages
          setHighlightedConversation(newMessages[0].id);
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedConversation(null);
          }, 3000);
        }
      }
      
      setConversations(conversations);
      setLoading(false);
    });
    
    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, [userId, selectedConversationId]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    conversation => conversation.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <motion.div
          className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow p-8 text-center text-muted-foreground">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
            {searchQuery ? (
              <p>No conversations found matching "{searchQuery}"</p>
            ) : (
              <>
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with car owners or renters</p>
              </>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence>
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const isHighlighted = highlightedConversation === conversation.id;
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    backgroundColor: isHighlighted ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  layout
                >
                  <Card 
                    className={`border-0 rounded-none hover:bg-accent cursor-pointer transition-colors duration-200 ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                    onClick={() => onSelectConversation(
                      conversation.id, 
                      conversation.otherUserId, 
                      conversation.otherUserName
                    )}
                  >
                    <CardContent className="p-3">
                      <motion.div 
                        className="flex items-start gap-3"
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="h-10 w-10">
                          {conversation.otherUserPhoto ? (
                            <AvatarImage 
                              src={conversation.otherUserPhoto} 
                              alt={conversation.otherUserName} 
                            />
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="font-medium truncate">
                              {conversation.otherUserName}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(conversation.lastMessageDate, { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm truncate text-muted-foreground">
                            {conversation.isLastMessageMine && (
                              <span className="text-xs mr-1 text-primary/70">You:</span>
                            )}
                            {conversation.lastMessage}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 10 }}
                            >
                              <Badge className="mt-1" variant="destructive">
                                {conversation.unreadCount} new
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
