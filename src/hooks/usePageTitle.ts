import { useEffect } from 'react';

/**
 * Hook to update the page title with unread message count
 * @param count Number of unread messages
 */
export function usePageTitle(count: number): void {
  useEffect(() => {
    const defaultTitle = 'CarShare';
    
    if (count > 0) {
      document.title = `(${count}) ${defaultTitle}`;
    } else {
      document.title = defaultTitle;
    }
    
    return () => {
      document.title = defaultTitle;
    };
  }, [count]);
}
