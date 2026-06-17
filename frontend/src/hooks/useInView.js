import { useEffect, useRef, useState } from 'react';

/**
 * useInView — tracks whether an element has scrolled into the viewport.
 *
 * Implementation: native IntersectionObserver API — zero external dependency.
 * Supported in all modern browsers; falls back gracefully (returns true
 * immediately) in environments where IntersectionObserver is unavailable.
 *
 * @param {object} options
 * @param {string} [options.threshold=0.12]  — fraction of element visible to trigger
 * @param {string} [options.rootMargin='0px'] — margin around the root
 * @param {boolean} [options.once=true]      — stop observing once visible (default)
 *
 * @returns {{ ref: React.RefObject, inView: boolean }}
 *
 * Usage:
 *   const { ref, inView } = useInView();
 *   return <div ref={ref} className={inView ? 'visible' : 'hidden'} />;
 */
export function useInView({ threshold = 0.12, rootMargin = '0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Graceful fallback for environments without IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
