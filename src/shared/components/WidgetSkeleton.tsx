interface WidgetSkeletonProps {
  height?: number;
  /** Show a chart-style placeholder instead of row lines */
  chart?: boolean;
}

export default function WidgetSkeleton({ height = 300, chart = false }: WidgetSkeletonProps) {
  return (
    <div
      className="card"
      aria-busy="true"
      aria-live="polite"
      style={{ minHeight: height }}
    >
      {/* Card header skeleton */}
      <div className="card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: 140, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: 90, borderRadius: 4 }} />
        </div>
      </div>

      {/* Card body skeleton */}
      <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
        {chart ? (
          /* Chart shape — mimic an area/bar chart */
          <div style={{ position: 'relative', height: height - 100, overflow: 'hidden' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 20 }}>
              {[0,1,2,3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 10, width: 32, borderRadius: 3 }} />
              ))}
            </div>
            {/* Chart area */}
            <div style={{ marginLeft: 44, height: '100%', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const heights = [55, 72, 48, 85, 60, 78, 52, 90];
                return (
                  <div
                    key={i}
                    className="skeleton"
                    style={{
                      flex: 1,
                      height: `${heights[i]}%`,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Row lines */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 16, width: i === 4 ? '60%' : '100%', borderRadius: 4 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
