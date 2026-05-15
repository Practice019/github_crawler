import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fadeIn } from '../utils/animations';
import PropTypes from 'prop-types';

/**
 * 页面过渡动画包装器
 */
function PageTransition({ children }) {
  const location = useLocation();
  const pageRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      // 页面切换时的淡入动画
      fadeIn(pageRef.current, { duration: 400 });
    }
  }, [location.pathname]);

  return (
    <div
      ref={pageRef}
      style={{
        opacity: 0,
        transform: 'translateY(20px)'
      }}
    >
      {children}
    </div>
  );
}

PageTransition.propTypes = {
  children: PropTypes.node.isRequired
};

export default PageTransition;
