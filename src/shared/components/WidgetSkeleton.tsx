import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface WidgetSkeletonProps {
  title?: boolean
  rows?: number
  height?: number
  showFooter?: boolean
}

export default function WidgetSkeleton({
  title = true,
  rows = 4,
  height = 220,
  showFooter = false,
}: WidgetSkeletonProps) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: height,
      }}
    >
      {/* Header */}
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Skeleton width={140} height={20} />

          <Skeleton
            width={32}
            height={32}
            borderRadius={999}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
        }}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            height={18}
            width={
              index === rows - 1
                ? '65%'
                : '100%'
            }
          />
        ))}
      </div>

      {/* Footer */}
      {showFooter && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}
        >
          <Skeleton width={80} height={16} />

          <Skeleton width={60} height={16} />
        </div>
      )}
    </section>
  )
}