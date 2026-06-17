import { useInView } from '../../hooks/useInView';
import styles from './InView.module.css';

/**
 * InView — wrapper component that fades and slides its children into view
 * when the element scrolls into the viewport.
 *
 * Built on the useInView hook (native IntersectionObserver — no external lib).
 * The animation is pure CSS transition driven by a class toggle — no JS
 * animation library, no requestAnimationFrame loop.
 *
 * Props:
 *   direction  'up' | 'down' | 'left' | 'right' | 'none'  default: 'up'
 *   delay      CSS delay string e.g. '0ms', '100ms'        default: '0ms'
 *   duration   CSS duration string                          default: uses --transition-reveal token
 *   threshold  0–1 fraction visible before triggering      default: 0.12
 *   once       bool — only animate in once                  default: true
 *   children   ReactNode
 *   className  string (merged onto root element)
 *
 * Usage:
 *   <InView direction="up" delay="100ms">
 *     <Card>...</Card>
 *   </InView>
 */
export function InView({
  direction = 'up',
  delay = '0ms',
  duration,
  threshold = 0.12,
  once = true,
  children,
  className,
  ...rest
}) {
  const { ref, inView } = useInView({ threshold, once });

  return (
    <div
      ref={ref}
      className={[
        styles.reveal,
        styles[`dir_${direction}`],
        inView ? styles.visible : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        transitionDelay: delay,
        ...(duration ? { transitionDuration: duration } : {}),
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
