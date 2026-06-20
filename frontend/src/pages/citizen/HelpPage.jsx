import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './HelpPage.module.css';

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6'];

export function HelpPage() {
  const { t } = useTranslation();
  const [open, set_open] = useState(null);

  function toggle(key) {
    set_open((prev) => (prev === key ? null : key));
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('citizen.help_title')}</h1>
        <p className={styles.page_sub}>{t('citizen.help_sub')}</p>
      </div>

      <dl className={styles.faq_list}>
        {FAQ_KEYS.map((k) => {
          const is_open = open === k;
          return (
            <div key={k} className={`${styles.faq_item} ${is_open ? styles.faq_item_open : ''}`}>
              <dt>
                <button
                  type="button"
                  className={styles.faq_question}
                  aria-expanded={is_open}
                  aria-controls={`faq-answer-${k}`}
                  id={`faq-question-${k}`}
                  onClick={() => toggle(k)}
                >
                  <span>{t(`citizen.help_q${k}`)}</span>
                  <span className={styles.faq_chevron} aria-hidden="true">
                    {is_open ? '−' : '+'}
                  </span>
                </button>
              </dt>
              <dd
                id={`faq-answer-${k}`}
                role="region"
                aria-labelledby={`faq-question-${k}`}
                className={styles.faq_answer}
                hidden={!is_open}
              >
                <p>{t(`citizen.help_a${k}`)}</p>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
