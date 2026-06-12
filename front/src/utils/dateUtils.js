/*
  Jalaali and Gregorian date conversion and calendar utilities.
  Part of Treely family tree system.
*/

export function div(a, b) {
  return Math.floor(a / b);
}

// Convert Gregorian to Jalaali
export function toJalaali(gy, gm, gd) {
  var d = g2d(gy, gm, gd);
  return d2j(d);
}

// Convert Jalaali to Gregorian
export function toGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd));
}

// Check if Jalali year is leap
export function isJalaaliLeap(jy) {
  return jalCal(jy).leap === 1;
}

// Get Jalali month length
export function jalaaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  if (jm === 12) {
    return isJalaaliLeap(jy) ? 30 : 29;
  }
  return 0;
}

// Check if Gregorian year is leap
export function isGregorianLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get Gregorian month length
export function gregorianMonthLength(year, month) {
  const lengths = [31, isGregorianLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

// Internal helper: Jalaali calendar leap & epoch calculation
function jalCal(jy) {
  var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]
    , bl = breaks.length
    , gy = jy + 621
    , leapJ = -14
    , jp = breaks[0]
    , jm
    , jump
    , leap
    , jse
    , dem
    , n
    , i;

  if (jy < jp || jy >= breaks[bl - 1])
    throw new Error('Invalid Jalaali year ' + jy);

  for (i = 1; i < bl; i += 1) {
    var jb = breaks[i];
    n = jb - jp;
    if (jy < jb)
      break;
    leapJ = leapJ + div(n, 33) * 8 + div(n % 33, 4);
    jp = jb;
  }
  var jp = breaks[i - 1];
  n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(n % 33, 4);
  if (n % 33 === 4)
    leapJ += 1;

  var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  var march = 20 + leapJ - leapG;

  if (n % 33 === 4)
    leap = 1;
  else
    leap = 0;

  return {
    leap: leap,
    gy: gy,
    march: march
  };
}

function g2d(gy, gm, gd) {
  var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
        + div(153 * ((gm + 9) % 12) + 2, 5)
        + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(d) {
  var j = 4 * d + 139361631
        + div(div(4 * d + 183187720, 146097) * 3, 4) * 4 - 3908;
  var i = div((j % 1461), 4) * 5 + 308;
  var gd = div((i % 153), 5) + 1;
  var gm = ((div(i, 153) + 2) % 12) + 1;
  var gy = div(j, 1461) - 100100 + div(14 - gm, 12);
  return { gy: gy, gm: gm, gd: gd };
}

function j2d(jy, jm, jd) {
  var r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(d) {
  var gy = d2g(d).gy
    , jy = gy - 621
    , r = jalCal(jy)
    , march = r.march
    , k = d - g2d(gy, 3, march)
    , jm
    , jd;

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = (k % 31) + 1;
      return { jy: jy, jm: jm, jd: jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    r = jalCal(jy);
    march = r.march;
    k += 365 + r.leap;
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = (k % 31) + 1;
      return { jy: jy, jm: jm, jd: jd };
    } else {
      k -= 186;
    }
  }
  jm = 7 + div(k, 30);
  jd = (k % 30) + 1;
  return { jy: jy, jm: jm, jd: jd };
}

// Convert numbers to Farsi digits if in RTL mode
export function toPersianDigits(str) {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, function (w) {
    return farsiDigits[+w];
  });
}
