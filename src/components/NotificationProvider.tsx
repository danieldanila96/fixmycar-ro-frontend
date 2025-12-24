import { useQuoteNotifications } from '@/hooks/useQuoteNotifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useQuoteNotifications();
  
  return <>{children}</>;
};
