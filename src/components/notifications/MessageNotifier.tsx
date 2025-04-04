import { useEffect } from 'react';
import { useAuth } from '@/firebase/auth/AuthContext';
import { getNewMessages } from '@/firebase/db/services/messagingService';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';

export function MessageNotifier() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) return;
    
    let messageCheck: ReturnType<typeof setInterval>;
    
    // Set up a periodic check for new messages (in addition to unread count)
    // This runs outside of the current conversation view
    const setupMessageChecker = () => {
      messageCheck = setInterval(async () => {
        try {
          // Get any new messages in the last 10 seconds
          const newMessages = await getNewMessages(user.uid, 10000);
          
          // If we have new messages, show notifications
          if (newMessages && newMessages.length > 0) {
            // Group by sender to avoid multiple notifications from the same person
            const messageBySender = newMessages.reduce((acc, message) => {
              if (!acc[message.senderName]) {
                acc[message.senderName] = {
                  senderId: message.senderId,
                  conversationId: message.conversationId,
                  messages: []
                };
              }
              acc[message.senderName].messages.push(message.text);
              return acc;
            }, {} as Record<string, { senderId: string, conversationId: string, messages: string[] }>);
            
            // Show a notification for each sender
            Object.entries(messageBySender).forEach(([senderName, data]) => {
              // Only show the most recent message in the notification
              const latestMessage = data.messages[data.messages.length - 1];
              
              toast({
                title: `Message from ${senderName}`,
                description: latestMessage,
                variant: "default", 
                action: (
                  <ToastAction altText="View" onClick={() => navigate(`/messages/${data.conversationId}`)}>
                    View
                  </ToastAction>
                ),
              });
              
              // Play notification sound if page is not focused
              if (document.visibilityState !== 'visible') {
                const audio = new Audio('/message-notification.mp3');
                audio.volume = 0.4;
                audio.play().catch(e => console.log('Unable to play sound', e));
              }
            });
          }
        } catch (err) {
          console.error("Error checking for new messages:", err);
        }
      }, 15000); // Check every 15 seconds
    };
    
    setupMessageChecker();
    
    return () => {
      // Clean up interval on unmount
      clearInterval(messageCheck);
    };
  }, [user, toast, navigate]);
  
  // This is a hidden component that just provides functionality
  return null;
}
