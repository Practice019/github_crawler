import { useRef } from 'react';
import PropTypes from 'prop-types';
import { buttonClick, pulse } from '../utils/animations';

/**
 * 带动画效果的按钮组件
 */
function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (disabled || loading) return;

    // 播放点击动画
    if (buttonRef.current) {
      buttonClick(buttonRef.current);
    }

    // 调用原始点击处理函数
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = {
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    border: 'none',
    borderRadius: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    secondary: {
      background: '#f5f5f5',
      color: '#333'
    },
    success: {
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      color: 'white'
    },
    danger: {
      background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      color: 'white'
    },
    outline: {
      background: 'transparent',
      color: '#667eea',
      border: '2px solid #667eea'
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant]
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      )}
      {children}
    </button>
  );
}

AnimatedButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default AnimatedButton;
