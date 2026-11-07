/**
 * Utilitarian ERP Formatting and Validation Suite
 * Strict Indian Rupee (₹) formatting and transport domain rules.
 */

export function formatINR(amount: number | undefined | null, showDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showDecimals ? '₹ 0.00' : '₹ 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatNumberINR(amount: number | undefined | null, showDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showDecimals ? '0.00' : '0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(isoDateString: string | undefined | null): string {
  if (!isoDateString) return '-';
  try {
    const parts = isoDateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDateString;
  }
}

export function formatDateLabel(isoDateString: string): string {
  if (!isoDateString) return '-';
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = isoDateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${months[monthIdx] || parts[1]} ${parts[0]}`;
    }
    return isoDateString;
  } catch {
    return isoDateString;
  }
}

export function formatPercent(rate: number | undefined | null): string {
  if (rate === undefined || rate === null || isNaN(rate)) return '0.0%';
  return `${rate.toFixed(1)}%`;
}

export function formatMT(weightMT: number | undefined | null): string {
  if (weightMT === undefined || weightMT === null || isNaN(weightMT)) return '0.0 MT';
  return `${weightMT.toFixed(2)} MT`;
}

export function formatKm(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return '0 km';
  return `${new Intl.NumberFormat('en-IN').format(km)} km`;
}

/**
 * Standard Indian Commercial Vehicle License Plate Validation
 * Matches formats such as: RJ-14-GB-1001, RJ14GB1001, RJ-14-EA-2020, DL-01-A-1234
 */
export function isValidLicensePlate(plate: string): boolean {
  if (!plate) return false;
  const clean = plate.trim().toUpperCase().replace(/\s+/g, '-');
  const regex = /^[A-Z]{2}[-]?[0-9]{2}[-]?[A-Z]{1,3}[-]?[0-9]{4}$/;
  return regex.test(clean);
}

/**
 * Normalizes input plate to standard display: "RJ-14-GB-1001"
 */
export function normalizeLicensePlate(input: string): string {
  const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length >= 9) {
    const state = clean.slice(0, 2);
    const rto = clean.slice(2, 4);
    const series = clean.slice(4, clean.length - 4);
    const num = clean.slice(-4);
    return `${state}-${rto}-${series}-${num}`;
  }
  return input.trim().toUpperCase();
}

/**
 * Generates next sequential voucher number
 */
export function generateNextVoucherNumber(prefix: string, existingCount: number): string {
  const currentYear = new Date().getFullYear();
  const nextSeq = String(existingCount + 1).padStart(4, '0');
  return `${prefix}-${currentYear}-${nextSeq}`;
}

