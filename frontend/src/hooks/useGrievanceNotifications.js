import { useEffect, useState } from 'react';

// localStorage key is scoped per user to prevent cross-account leakage
function storage_key(user_id) {
  return `gid_seen_statuses_${user_id}`;
}

/**
 * Compares current grievance statuses against a stored snapshot to detect
 * status changes since the citizen last viewed the list.
 *
 * Storage: localStorage, keyed per user_id. This is purely non-sensitive UI
 * state (a map of grievance ID → last-seen status). No auth data is stored.
 *
 * Returns { unseen_count, mark_all_seen }.
 * mark_all_seen() should be called when the citizen lands on the list page.
 */
export function useGrievanceNotifications(user_id, grievances) {
  const [unseen_count, set_unseen_count] = useState(0);

  const key = user_id ? storage_key(user_id) : null;

  useEffect(() => {
    if (!key || !grievances.length) {
      set_unseen_count(0);
      return;
    }

    let stored = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) stored = JSON.parse(raw);
    } catch {
      // corrupt storage — treat as empty, will be overwritten on mark_all_seen
    }

    if (Object.keys(stored).length === 0) {
      // First visit — no baseline, set count to 0 and snapshot immediately
      set_unseen_count(0);
      return;
    }

    const changed = grievances.filter((g) => {
      const prev = stored[g.id];
      // New grievance not in snapshot, or status changed since snapshot
      return prev === undefined || prev !== g.status;
    });

    set_unseen_count(changed.length);
  }, [key, grievances]);

  function mark_all_seen() {
    if (!key || !grievances.length) return;
    const snapshot = {};
    grievances.forEach((g) => { snapshot[g.id] = g.status; });
    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // ignore write failures (storage quota)
    }
    set_unseen_count(0);
  }

  return { unseen_count, mark_all_seen };
}
