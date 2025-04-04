import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/auth/AuthContext';
import { subscribeToUnreadCount } from '@/firebase/db/services/messagingService';
import { usePageTitle } from '@/hooks/usePageTitle';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Subscribe to unread message count when authenticated
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (user?.uid) {
      unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
        setUnreadCount(count);
      });
    }
    
    return () => unsubscribe();
  }, [user]);
  
  // Update page title with unread count
  usePageTitle(unreadCount);
  
  return (
    <div>
      {children}
    </div>
  );
}