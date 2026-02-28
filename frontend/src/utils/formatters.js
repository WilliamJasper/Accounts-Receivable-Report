/**
 * Utility functions for formatting dates, numbers, and parsing values.
 */

/** Format ISO date string to dd/mm/yyyy */
export function formatDate(iso) {
    if (!iso || !String(iso).trim()) return '-';
    const s = String(iso).trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}

/** Format number with Thai locale (2 decimal places) */
export function formatNum(v) {
    if (v == null || v === '') return '-';
    const n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? String(v) : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format input value with comma separators while typing */
export function formatInputCommas(val) {
    if (!val) return '';
    const clean = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts[1]) parts[1] = parts[1].slice(0, 2);
    return parts.join('.');
}

/** Parse currency string (with commas) to number */
export const parseV = (v) => {
    if (v == null || v === '') return 0;
    const s = String(v).replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
};
