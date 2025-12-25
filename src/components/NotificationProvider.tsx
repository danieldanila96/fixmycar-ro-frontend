import { useQuoteNotifications } from '@/hooks/useQuoteNotifications';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useQuoteNotifications();
  useMessageNotifications();
  
  return <>{children}</>;
};
