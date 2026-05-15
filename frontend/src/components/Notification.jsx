import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Notification.css';

function Notification({ message, type = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  return createPortal(
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        {message.split('\n').map((line, index) => (
          <div key={index} className="notification-line">
            {line}
          </div>
        ))}
      </div>
      <button className="notification-close" onClick={onClose}>
        ✕
      </button>
    </div>,
    document.body
  );
}

export default Notification;
