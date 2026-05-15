import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { progressBar } from '../utils/animations';
import './ProgressBar.css';

/**
 * 进度条组件
 */
function ProgressBar({
  current,
  total,
  label = '',
  showPercentage = true,
  color = '#667eea',
  height = 8
}) {
  const barRef = useRef(null);
  const prevPercentageRef = useRef(0);

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  useEffect(() => {
    if (barRef.current && percentage !== prevPercentageRef.current) {
      progressBar(barRef.current, percentage, { duration: 500 });
      prevPercentageRef.current = percentage;
    }
  }, [percentage]);

  return (
    <div className="progress-container">
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && (
            <span className="progress-percentage">{percentage}%</span>
          )}
        </div>
      )}
      <div
        className="progress-track"
        style={{ height: `${height}px` }}
      >
        <div
          ref={barRef}
          className="progress-bar"
          style={{
            backgroundColor: color,
            width: '0%'
          }}
        />
      </div>
      {current !== undefined && total !== undefined && (
        <div className="progress-info">
          <span>{current} / {total}</span>
        </div>
      )}
    </div>
  );
}

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  color: PropTypes.string,
  height: PropTypes.number
};

export default ProgressBar;
