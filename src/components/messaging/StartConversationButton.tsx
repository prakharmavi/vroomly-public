import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { getOrCreateConversation } from "@/firebase/db/services/messagingService";
interface StartConversationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  targetUserId: string;
  targetUsername?: string;
}
            

export function StartConversationButton({ 
  targetUserId, 
  targetUsername,
  children,
  ...props
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      // Redirect to auth if not logged in
      navigate("/auth");
      return;
    }

    // Don't start a conversation with yourself
    if (user.uid === targetUserId) {
      return;
    }

    setLoading(true);
    try {
      // If we have a username, navigate directly to start the conversation
      if (targetUsername) {
        navigate(`/messages/user/${targetUsername}`);
      } else {
        // Otherwise, create the conversation first then navigate
        const conversationId = await getOrCreateConversation(user.uid, targetUserId);
        navigate(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading || user?.uid === targetUserId}
      {...props}
    >
      {loading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      {children || "Message"}
    </Button>
  );
}
