import styles from './Button.module.css';

/**
 * Button — primary / secondary / danger variants.
 *
 * All colours from tokens.css. Never hardcoded values here.
 *
 * Props:
 *   variant   'primary' | 'secondary' | 'danger'   default: 'primary'
 *   size      'sm' | 'md' | 'lg'                   default: 'md'
 *   disabled  bool
 *   type      'button' | 'submit' | 'reset'        default: 'button'
 *   onClick   fn
 *   children  ReactNode
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  children,
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
