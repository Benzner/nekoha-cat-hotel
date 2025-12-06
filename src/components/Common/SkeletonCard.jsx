export default function SkeletonCard({ height = '150px', className = '' }) {
    return (
        <div
            className={`skeleton skeleton-card ${className}`}
            style={{ height }}
        ></div>
    );
}
