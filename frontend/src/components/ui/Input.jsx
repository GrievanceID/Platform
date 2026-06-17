import styles from './Input.module.css';

/**
 * Input — text input or select wrapper.
 *
 * Props:
 *   type      'text' | 'email' | 'password' | 'search' | 'select'  default: 'text'
 *   label     string (renders <label> above)
 *   hint      string (renders small hint below)
 *   error     string (renders error message; adds error styling)
 *   id        string (required for label association)
 *   options   Array<{value, label}> — used when type='select'
 *   All other props forwarded to the underlying <input> or <select>.
 */
export function Input({
  type = 'text',
  label,
  hint,
  error,
  id,
  options,
  className,
  ...rest
}) {
  const field_cls = [styles.field, error ? styles.error : ''].filter(Boolean).join(' ');

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      {type === 'select' ? (
        <select id={id} className={field_cls} {...rest}>
          {(options ?? []).map(({ value, label: opt_label }) => (
            <option key={value} value={value}>
              {opt_label}
            </option>
          ))}
        </select>
      ) : (
        <input id={id} type={type} className={field_cls} {...rest} />
      )}

      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error_msg} role="alert">{error}</span>}
    </div>
  );
}
