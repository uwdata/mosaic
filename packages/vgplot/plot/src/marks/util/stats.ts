// https://github.com/jstat/jstat
//
// Copyright (c) 2013 jStat
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * ibetainv function
 * @param {number} p
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function ibetainv(p, a, b) {
  var EPS = 1e-8;
  var a1 = a - 1;
  var b1 = b - 1;
  var j = 0;
  var lna, lnb, pp, t, u, err, x, al, h, w, afac;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  if (a >= 1 && b >= 1) {
    pp = p < 0.5 ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
    if (p < 0.5) x = -x;
    al = (x * x - 3) / 6;
    h = 2 / (1 / (2 * a - 1) + 1 / (2 * b - 1));
    w = (x * Math.sqrt(al + h)) / h - (1 / (2 * b - 1) - 1 / (2 * a - 1)) * (al + 5 / 6 - 2 / (3 * h));
    x = a / (a + b * Math.exp(2 * w));
  } else {
    lna = Math.log(a / (a + b));
    lnb = Math.log(b / (a + b));
    t = Math.exp(a * lna) / a;
    u = Math.exp(b * lnb) / b;
    w = t + u;
    if (p < t / w) x = Math.pow(a * w * p, 1 / a);
    else x = 1 - Math.pow(b * w * (1 - p), 1 / b);
  }
  afac = -gammaln(a) - gammaln(b) + gammaln(a + b);
  for (; j < 10; j++) {
    if (x === 0 || x === 1) return x;
    err = ibeta(x, a, b) - p;
    t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac);
    u = err / t;
    x -= t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x))));
    if (x <= 0) x = 0.5 * (x + t);
    if (x >= 1) x = 0.5 * (x + t + 1);
    if (Math.abs(t) < EPS * x && j > 0) break;
  }
  return x;
}

/**
 * ibeta function
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function ibeta(x, a, b) {
  // Factors in front of the continued fraction.
  var bt =
    x === 0 || x === 1 ? 0 : Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < 0 || x > 1) return 0;
  if (x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
    return (bt * betacf(x, a, b)) / a;
  // else use continued fraction after making the symmetry transformation.
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

/**
 * betacf function
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function betacf(x, a, b) {
  var fpmin = 1e-30;
  var m = 1;
  var qab = a + b;
  var qap = a + 1;
  var qam = a - 1;
  var c = 1;
  var d = 1 - (qab * x) / qap;
  var m2, aa, del, h;

  // These q's will be used in factors that occur in the coefficients
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  h = d;

  for (; m <= 100; m++) {
    m2 = 2 * m;
    aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    // One step (the even one) of the recurrence
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    // Next step of the recurrence (the odd one)
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < 3e-7) break;
  }

  return h;
}

/**
 * gammaln function
 * @param {number} x
 * @returns {number}
 */
export function gammaln(x) {
  var j = 0;
  var cof = [
    76.18009172947146, -86.5053203294167, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  var ser = 1.000000000190015;
  var xx, y, tmp;
  tmp = (y = xx = x) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++) ser += cof[j] / ++y;
  return Math.log((2.506628274631 * ser) / xx) - tmp;
}

/**
 * qt function
 * @param {number} p
 * @param {number} dof
 * @returns {number}
 */
export function qt(p, dof) {
  var x = ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
  x = Math.sqrt((dof * (1 - x)) / x);
  return p > 0.5 ? x : -x;
}

/**
 * Approximate inverse error function.
 * @param {number} x
 * @returns {number}
 */
export function erfinv(x) {
  // Implementation from "Approximating the erfinv function" by Mike Giles,
  // GPU Computing Gems, volume 2, 2010.
  // Ported from Apache Commons Math, https://www.apache.org/licenses/LICENSE-2.0

  // beware that the logarithm argument must be
  // computed as (1.0 - x) * (1.0 + x),
  // it must NOT be simplified as 1.0 - x * x as this
  // would induce rounding errors near the boundaries +/-1
  let w = - Math.log((1 - x) * (1 + x));
  let p;

  if (w < 6.25) {
    w -= 3.125;
    p =  -3.6444120640178196996e-21;
    p =   -1.685059138182016589e-19 + p * w;
    p =   1.2858480715256400167e-18 + p * w;
    p =    1.115787767802518096e-17 + p * w;
    p =   -1.333171662854620906e-16 + p * w;
    p =   2.0972767875968561637e-17 + p * w;
    p =   6.6376381343583238325e-15 + p * w;
    p =  -4.0545662729752068639e-14 + p * w;
    p =  -8.1519341976054721522e-14 + p * w;
    p =   2.6335093153082322977e-12 + p * w;
    p =  -1.2975133253453532498e-11 + p * w;
    p =  -5.4154120542946279317e-11 + p * w;
    p =    1.051212273321532285e-09 + p * w;
    p =  -4.1126339803469836976e-09 + p * w;
    p =  -2.9070369957882005086e-08 + p * w;
    p =   4.2347877827932403518e-07 + p * w;
    p =  -1.3654692000834678645e-06 + p * w;
    p =  -1.3882523362786468719e-05 + p * w;
    p =    0.0001867342080340571352 + p * w;
    p =  -0.00074070253416626697512 + p * w;
    p =   -0.0060336708714301490533 + p * w;
    p =      0.24015818242558961693 + p * w;
    p =       1.6536545626831027356 + p * w;
  } else if (w < 16.0) {
    w = Math.sqrt(w) - 3.25;
    p =   2.2137376921775787049e-09;
    p =   9.0756561938885390979e-08 + p * w;
    p =  -2.7517406297064545428e-07 + p * w;
    p =   1.8239629214389227755e-08 + p * w;
    p =   1.5027403968909827627e-06 + p * w;
    p =   -4.013867526981545969e-06 + p * w;
    p =   2.9234449089955446044e-06 + p * w;
    p =   1.2475304481671778723e-05 + p * w;
    p =  -4.7318229009055733981e-05 + p * w;
    p =   6.8284851459573175448e-05 + p * w;
    p =   2.4031110387097893999e-05 + p * w;
    p =   -0.0003550375203628474796 + p * w;
    p =   0.00095328937973738049703 + p * w;
    p =   -0.0016882755560235047313 + p * w;
    p =    0.0024914420961078508066 + p * w;
    p =   -0.0037512085075692412107 + p * w;
    p =     0.005370914553590063617 + p * w;
    p =       1.0052589676941592334 + p * w;
    p =       3.0838856104922207635 + p * w;
  } else if (Number.isFinite(w)) {
    w = Math.sqrt(w) - 5.0;
    p =  -2.7109920616438573243e-11;
    p =  -2.5556418169965252055e-10 + p * w;
    p =   1.5076572693500548083e-09 + p * w;
    p =  -3.7894654401267369937e-09 + p * w;
    p =   7.6157012080783393804e-09 + p * w;
    p =  -1.4960026627149240478e-08 + p * w;
    p =   2.9147953450901080826e-08 + p * w;
    p =  -6.7711997758452339498e-08 + p * w;
    p =   2.2900482228026654717e-07 + p * w;
    p =  -9.9298272942317002539e-07 + p * w;
    p =   4.5260625972231537039e-06 + p * w;
    p =  -1.9681778105531670567e-05 + p * w;
    p =   7.5995277030017761139e-05 + p * w;
    p =  -0.00021503011930044477347 + p * w;
    p =  -0.00013871931833623122026 + p * w;
    p =       1.0103004648645343977 + p * w;
    p =       4.8499064014085844221 + p * w;
  } else {
    p = Infinity;
  }
  return p * x;
}
