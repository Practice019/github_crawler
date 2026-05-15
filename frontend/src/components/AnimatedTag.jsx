import { useRef } from 'react';
import PropTypes from 'prop-types';
import { pulse, scaleIn } from '../utils/animations';
import './AnimatedTag.css';

/**
 * 带动画的标签按钮组件
 */
function AnimatedTag({
  label,
  color,
  count,
  active = false,
  onClick,
  onEdit,
  onDelete,
  editable = false
}) {
  const tagRef = useRef(null);

  const handleClick = () => {
    if (tagRef.current) {
      pulse(tagRef.current, { duration: 200 });
    }
    if (onClick) onClick();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <button
      ref={tagRef}
      className={`animated-tag ${active ? 'active' : ''}`}
      style={{
        backgroundColor: active ? color : 'transparent',
        borderColor: color,
        color: active ? 'white' : color
      }}
      onClick={handleClick}
    >
      <span className="tag-label">{label}</span>
      {count !== undefined && (
        <span className="tag-count">{count}</span>
      )}
      {editable && (
        <div className="tag-actions">
          {onEdit && (
            <button
              className="tag-action-btn"
              onClick={handleEdit}
              title="重命名"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="tag-action-btn"
              onClick={handleDelete}
              title="删除"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </button>
  );
}

AnimatedTag.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  count: PropTypes.number,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  editable: PropTypes.bool
};

export default AnimatedTag;
