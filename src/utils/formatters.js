export function formatCoordinates(lat, lon, format = 'DD') {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return 'Coordinates Unrecorded';
  }
  const numLat = Number(lat);
  const numLon = Number(lon);
  if (Number.isNaN(numLat) || Number.isNaN(numLon)) {
    return 'Invalid Coordinates';
  }

  if (format === 'DMS') {
    const toDms = (deg, isLat) => {
      const dir = deg >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';
      const abs = Math.abs(deg);
      const d = Math.floor(abs);
      const mFloat = (abs - d) * 60;
      const m = Math.floor(mFloat);
      const s = ((mFloat - m) * 60).toFixed(1);
      return `${d}°${String(m).padStart(2, '0')}'${s}"${dir}`;
    };
    return `${toDms(numLat, true)}, ${toDms(numLon, false)}`;
  }

  return `${numLat.toFixed(4)}° N, ${numLon.toFixed(4)}° E`;
}

export function formatDischarge(lpmValue, unit = 'LPM') {
  if (lpmValue === null || lpmValue === undefined || lpmValue === '') {
    return 'Not Measured';
  }
  const val = Number(lpmValue);
  if (Number.isNaN(val)) return 'Not Measured';

  if (unit === 'LPS') {
    return `${(val / 60).toFixed(2)} LPS`;
  }
  return `${val.toFixed(1)} LPM`;
}

export function formatArea(haValue, unit = 'HA') {
  if (haValue === null || haValue === undefined) return '—';
  const val = Number(haValue);
  if (unit === 'SQKM') {
    return `${(val / 100).toFixed(2)} km²`;
  }
  return `${val.toFixed(1)} Ha`;
}

export function formatCurrencyInr(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
