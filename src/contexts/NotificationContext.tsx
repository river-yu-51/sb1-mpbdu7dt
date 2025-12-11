import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type: NotificationType) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};