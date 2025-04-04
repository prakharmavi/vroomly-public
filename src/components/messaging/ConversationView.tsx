import { useState, useEffect, useRef, useCallback } from "react";
import { 
  subscribeToConversationMessages as subscribeToMessages, 
  sendMessage as sendMessageToFirebase,
  markMessagesFromSenderAsRead
} from "@/firebase/db/services/messagingService";
import { Message } from "@/firebase/db/model/messagemodel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ChevronLeft, Send, User, Loader2, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile } from "@/firebase/db/services/userProfileService";
import { UserProfile } from "@/firebase/db/model/usermodel";

interface ConversationViewProps {
  conversationId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
}

export function ConversationView({
  conversationId,
  userId,
  otherUserId,
  otherUserName,
  onBack
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Updated scrollToBottom function to only scroll the container, not the whole page
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, []);
  
  // Subscribe to messages in this conversation
  useEffect(() => {
    if (!conversationId || !userId) return;
    
    setLoading(true);
    
    // Mark messages as read when conversation is opened
    markMessagesFromSenderAsRead(conversationId, otherUserId);
    
    // Subscribe to messages
    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      
      // Only auto-scroll if user is already at the bottom
      if (messagesContainerRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isAtBottom) {
          // Use setTimeout to let the messages render first
          setTimeout(() => scrollToBottom(), 0);
        }
      }
    });
    
    // Fetch other user's profile data
    const fetchOtherUserProfile = async () => {
      try {
        const profile = await getUserProfile(otherUserId);
        if (profile) {
          setOtherUserProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching other user profile:", error);
      }
    };
    
    fetchOtherUserProfile();
    
    return () => unsubscribe();
  }, [conversationId, userId, otherUserId, scrollToBottom]);
  
  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Use setTimeout to let the messages render first
      setTimeout(() => scrollToBottom(), 0);
    }
  }, [loading, messages.length, scrollToBottom]);
  
  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isNotAtBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
    
  // Animation variants for messages
  const incomingMessageVariants = {
    hidden: { opacity: 0, x: -20, y: 0 },
    visible: { opacity: 1, x: 0, y: 0, transition: { type: "spring", stiffness: 500, damping: 35 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  const outgoingMessageVariants = {
    hidden: { opacity: 0, x: 20, y: 0 },
    visible: { opacity: 1, x: 0, y: 0, transition: { type: "spring", stiffness: 500, damping: 35 } },
    sent: { scale: [1, 1.03, 1], transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !userId) return;
    
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    
    try {
      await sendMessageToFirebase(conversationId, userId, messageContent);
      
      // Focus back on the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      
      // Use setTimeout to scroll after message has been added to the UI
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error("Error sending message:", error);
      // Could restore the message content here if sending fails
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };
  
  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: Date, messages: Message[] }[] = [];
    
    messages.forEach(message => {
      const messageDate = message.timestamp.toDate();
      const dateString = format(messageDate, 'yyyy-MM-dd');
      
      const existingGroup = groups.find(group => 
        format(group.date, 'yyyy-MM-dd') === dateString
      );
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        });
      }
    });
    
    return groups;
  };
  
  const formatDateHeading = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="border-b p-2 flex items-center gap-2 bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-8 w-8" 
          onClick={onBack}
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-7 w-7">
          {otherUserProfile?.profileImageUrl ? (
            <AvatarImage src={otherUserProfile.profileImageUrl} alt={otherUserName} />
          ) : (
            <AvatarFallback>
              <User className="h-3.5 w-3.5" />
            </AvatarFallback>
          )}
        </Avatar>
        
        
        
         </header>
      
      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow overflow-y-auto p-3 space-y-3 relative"
        style={{ overscrollBehavior: 'contain' }} // Prevent scroll chaining
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <motion.div 
              className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-3">
            <Send className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to send a message</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {groupMessagesByDate().map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <div className="sticky top-2 z-10 flex justify-center">
                  <div className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">
                    {formatDateHeading(group.date)}
                  </div>
                </div>
                
                {group.messages.map((message, index) => {
                  const isMine = message.senderId === userId;
                  const showAvatar = index === 0 || group.messages[index - 1]?.senderId !== message.senderId;
                  const isConsecutive = index > 0 && group.messages[index - 1]?.senderId === message.senderId;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={isMine ? outgoingMessageVariants : incomingMessageVariants}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}
                    >
                      <div className={`flex items-end gap-1.5 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMine && showAvatar && (
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            {otherUserProfile?.profileImageUrl ? (
                              <AvatarImage src={otherUserProfile.profileImageUrl} alt={otherUserName} />
                            ) : (
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        
                        {!isMine && !showAvatar && (
                          <div className="w-6 flex-shrink-0" />
                        )}
                        
                        <div className={`space-y-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={`px-2.5 py-2 rounded-2xl text-sm shadow-sm ${
                              isMine 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-muted rounded-tl-none'
                            } ${isConsecutive ? (isMine ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}`}
                          >
                            <div className="whitespace-pre-wrap break-words text-xs">{message.text}</div>
                          </motion.div>
                          
                          <div className={`text-[10px] text-muted-foreground ${isMine ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(message.timestamp.toDate())}
                            {message.read && isMine && (
                              <span className="ml-1 text-primary/70">• Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-3 right-3"
            >
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full shadow-lg p-1.5 h-8 w-8"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Message input */}
      <div className="border-t p-2 bg-background/95 backdrop-blur sticky bottom-0 z-10">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] max-h-[100px] resize-none text-sm py-2"
            disabled={sending}
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              disabled={!newMessage.trim() || sending}
              className="flex-shrink-0 h-9 w-9"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
