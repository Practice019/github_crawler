import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { countUp } from '../utils/animations';

/**
 * 数字计数动画组件
 */
function CountUp({ end, duration = 1000, suffix = '', prefix = '', className = '' }) {
  const elementRef = useRef(null);
  const prevEndRef = useRef(0);

  useEffect(() => {
    if (elementRef.current && end !== prevEndRef.current) {
      const obj = { value: prevEndRef.current };

      countUp(null, end, {
        duration,
        onUpdate: () => {
          if (elementRef.current) {
            const displayValue = Math.round(obj.value).toLocaleString();
            elementRef.current.textContent = `${prefix}${displayValue}${suffix}`;
          }
        }
      });

      prevEndRef.current = end;
    }
  }, [end, duration, prefix, suffix]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

CountUp.propTypes = {
  end: PropTypes.number.isRequired,
  duration: PropTypes.number,
  suffix: PropTypes.string,
  prefix: PropTypes.string,
  className: PropTypes.string
};

export default CountUp;
