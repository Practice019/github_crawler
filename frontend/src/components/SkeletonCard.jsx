import './SkeletonCard.css';

/**
 * 骨架屏卡片组件
 */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-avatar skeleton"></div>
        <div className="skeleton-info">
          <div className="skeleton-title skeleton"></div>
          <div className="skeleton-description skeleton"></div>
        </div>
      </div>

      <div className="skeleton-badges">
        <div className="skeleton-badge skeleton"></div>
        <div className="skeleton-badge skeleton"></div>
        <div className="skeleton-badge skeleton"></div>
      </div>

      <div className="skeleton-content">
        <div className="skeleton-line skeleton"></div>
        <div className="skeleton-line skeleton"></div>
        <div className="skeleton-line short skeleton"></div>
      </div>

      <div className="skeleton-footer">
        <div className="skeleton-stat skeleton"></div>
        <div className="skeleton-stat skeleton"></div>
        <div className="skeleton-button skeleton"></div>
      </div>
    </div>
  );
}

/**
 * 骨架屏网格
 */
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="project-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export { SkeletonCard, SkeletonGrid };
export default SkeletonCard;
