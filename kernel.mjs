// kernel.mjs
// DayFold: fold multiple per-window activity summaries into one true daily total.
// Deduplicates by windowId so a rerun of the same window (or an overlapping report
// of it) never double-counts — the exact bug class that once let a dead window's
// writeMorning silently erase a REAL window's acts for the day.
//
// Pure. No I/O. Bad input returns {ok:false, why:...} instead of throwing.

const FIELDS = ['dream', 'render', 'gate', 'note'];

function isNonNegInt(n) {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= 0;
}

function validateEntry(e, i) {
  if (e === null || typeof e !== 'object' || Array.isArray(e)) {
    return `entry at index ${i} must be an object`;
  }
  if (typeof e.windowId !== 'string' || e.windowId.length === 0) {
    return `entry at index ${i} must have a non-empty string windowId`;
  }
  for (const f of FIELDS) {
    if (!isNonNegInt(e[f])) {
      return `entry at index ${i} field "${f}" must be a non-negative integer`;
    }
  }
  return null;
}

// foldDay(entries) -> { ok:true, value:{ dream, render, gate, note, windows } }
//                    | { ok:false, why:string }
//
// entries: array of { windowId, dream, render, gate, note }.
// Dedup rule: the LAST entry for a given windowId wins outright (it replaces,
// not adds to, that window's own counts) — this is how a rerun's corrected
// report supersedes an earlier partial one for the same window. Distinct
// windowIds are then summed together to make the true daily total.
export function foldDay(entries) {
  if (!Array.isArray(entries)) {
    return { ok: false, why: 'entries must be an array' };
  }

  const byWindow = new Map();

  for (let i = 0; i < entries.length; i++) {
    const err = validateEntry(entries[i], i);
    if (err) return { ok: false, why: err };
    byWindow.set(entries[i].windowId, entries[i]);
  }

  const total = { dream: 0, render: 0, gate: 0, note: 0, windows: byWindow.size };
  for (const e of byWindow.values()) {
    for (const f of FIELDS) total[f] += e[f];
  }

  return { ok: true, value: total };
}
