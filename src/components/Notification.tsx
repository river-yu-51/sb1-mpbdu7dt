import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Notification = () => {
  const { notification, hideNotification } = useNotification();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    if (notification) {
      setShow(true);
      // Main timer to hide notification and reset state
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000); // Changed from 5000ms to 3000ms
      // Small delay to ensure the exit animation can play
      hideTimer = setTimeout(() => {
        setShow(false);
      }, 2700); // Trigger setShow(false) slightly before hideNotification for smooth fade out

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    } else {
      setShow(false); // Ensure it's hidden when no notification is present
    }
  }, [notification, hideNotification]);

  if (!notification && !show) return null; // Only render if notification is active or in fading out state

  const handleClose = () => {
      setShow(false);
      // Give it time to animate out before removing from DOM completely
      setTimeout(hideNotification, 300); // Match animation duration for clean unmount
  }

  const typeStyles = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: <CheckCircle className="h-6 w-6 text-green-500" />
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: <AlertCircle className="h-6 w-6 text-red-500" />
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: <Info className="h-6 w-6 text-blue-500" />
    }
  };

  const styles = typeStyles[notification?.type || 'info']; // Use notification.type if available, otherwise default

  return (
    <div
      // Adjust transition duration and ease if needed for faster animation.
      // Current `duration-300` seems reasonable for a short popup.
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-transform duration-300 ease-out ${show ? 'translate-y-0' : '-translate-y-20'}`}
    >
      <div
        className={`w-auto max-w-lg p-4 rounded-lg shadow-2xl border-l-4 ${styles.bg} ${styles.border} ${styles.text} flex items-center justify-between space-x-4`}
      >
        <div className="flex items-center space-x-3">
          <div>{styles.icon}</div>
          <p className="font-medium">{notification?.message}</p> {/* Use optional chaining */}
        </div>
        <button type="button" onClick={handleClose} className="p-1 rounded-full hover:bg-black/10">
            <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;