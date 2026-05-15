import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { notificationIn, notificationOut } from '../utils/animations';
import './Toast.css';

/**
 * 通知提示组件
 */
function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const toastRef = useRef(null);

  useEffect(() => {
    if (toastRef.current) {
      // 进入动画
      notificationIn(toastRef.current);

      // 自动关闭
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [duration]);

  const handleClose = () => {
    if (toastRef.current) {
      notificationOut(toastRef.current).then(() => {
        if (onClose) onClose();
      });
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    return `toast-${type}`;
  };

  return (
    <div
      ref={toastRef}
      className={`toast ${getTypeClass()}`}
      style={{
        opacity: 0,
        transform: 'translateX(300px)'
      }}
    >
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func
};

export default Toast;
