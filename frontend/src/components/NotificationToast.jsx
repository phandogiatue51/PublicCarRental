import { useEffect, useState } from 'react';
import signalRService from '../services/signalRService';
import '../styles/NotificationToast.css';

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    signalRService.registerNotificationHandler((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, 5000);
    });

    signalRService.startConnection();

    return () => {
      signalRService.stopConnection();
    };
  }, []);

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
              <small>Booking #{notification.booking.bookingId}</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;