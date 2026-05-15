import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as animations from '../utils/animations';

/**
 * 动画容器组件
 * 自动为子元素添加进入动画
 */
function AnimatedContainer({
  children,
  animation = 'fadeIn',
  delay = 0,
  stagger = false,
  className = '',
  ...props
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const animationFn = animations[animation];
    if (!animationFn) {
      console.warn(`Animation "${animation}" not found`);
      return;
    }

    // 如果是交错动画，直接对容器内的子元素应用
    if (stagger) {
      const children = containerRef.current.children;
      if (children.length > 0) {
        animationFn(Array.from(children), { delay });
      }
    } else {
      // 否则对容器本身应用动画
      animationFn(containerRef.current, { delay });
    }
  }, [animation, delay, stagger]);

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  );
}

AnimatedContainer.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.string,
  delay: PropTypes.number,
  stagger: PropTypes.bool,
  className: PropTypes.string
};

export default AnimatedContainer;
