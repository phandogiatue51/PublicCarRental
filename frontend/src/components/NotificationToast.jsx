import { useEffect, useState } from 'react';
import signalRService from './../services/signalRService';
import { useAuth } from '../hooks/useAuth'; // Import your auth hook
import '../styles/NotificationToast.css';

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated } = useAuth(); // Use your auth hook

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    signalRService.registerNotificationHandler((notification) => {
      console.log('🔔 NotificationToast received notification:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, 10000);
    });

    signalRService.startConnection();

    return () => {
      signalRService.stopConnection();
    };
  }, [isAuthenticated]); // Re-run when auth status changes

  const removeNotification = (notification) => {
    setNotifications(prev => prev.filter(n => n !== notification));
  };

  return (
    <div className="notification-container">
      {notifications.map((notification, index) => (
        <div 
          key={index} 
          className={`notification-toast ${notification.type.toLowerCase()}`}
          onClick={() => removeNotification(notification)}
        >
          <div className="notification-header">
            <span className="notification-type">{notification.type}</span>
            <button className="close-btn">&times;</button>
          </div>
          <div className="notification-message">{notification.message}</div>
          <div className="notification-time">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </div>
          {notification.booking && (
            <div className="notification-details">
              <small>Booking #{notification.booking.BookingId}</small>
            </div>
          )}
          {notification.stationId && (
            <div className="notification-details">
              <small>Station #{notification.stationId}</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;