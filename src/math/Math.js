/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 数学库的常用接口
 *
 * @class qc.Math
 * @construct
 * @internal
 */
var Math2 = qc.Math = function(rnd) {
    this.phaserMath = Phaser.Math;
    this.arrayUtils = Phaser.ArrayUtils;
    this.phaserRnd = rnd;
}
Math2.prototype = {};
Math2.prototype.constructor = Math2;

/**
 * Two number are fuzzyEqual if their difference is less than epsilon.
 *
 * @method qc.Math#fuzzyEqual
 * @param {number} a
 * @param {number} b
 * @param {number} [epsilon=(small value)]
 * @return {boolean} True if |a-b|<epsilon
 */
Math2.prototype.fuzzyEqual = function(a, b, epsilon) {
    return this.phaserMath.fuzzyEqual(a, b, epsilon);
};

/**
 * A standard Fisher-Yates Array shuffle implementation.
 *
 * @method qc.Math#shuffle
 * @param {any[]} array - The array to shuffle.
 * @return {any[]} The shuffled array.
 */
Math2.prototype.shuffle = function (array) {
    return this.arrayUtils.shuffle(array);
};

/**
 * `a` is fuzzyLessThan `b` if it is less than b + epsilon.
 *
 * @method qc.Math#fuzzyLessThan
 * @param {number} a
 * @param {number} b
 * @param {number} [epsilon=(small value)]
 * @return {boolean} True if a<b+epsilon
 */
Math2.prototype.fuzzyLessThan = function(a, b, epsilon) {
    return this.phaserMath.fuzzyLessThan(a, b, epsilon);
}

/**
 * `a` is fuzzyGreaterThan `b` if it is more than b - epsilon.
 *
 * @method qc.Math#fuzzyGreaterThan
 * @param {number} a
 * @param {number} b
 * @param {number} [epsilon=(small value)]
 * @return {boolean} True if a>b+epsilon
 */
Math2.prototype.fuzzyGreaterThan = function(a, b, epsilon) {
    return this.phaserMath.fuzzyGreaterThan(a, b, epsilon);
}

/**
 * @method qc.Math#fuzzyCeil
 *
 * @param {number} val
 * @param {number} [epsilon=(small value)]
 * @return {boolean} ceiling(val-epsilon)
 */
Math2.prototype.fuzzyCeil = function(val, epsilon) {
    return this.phaserMath.fuzzyCeil(val, epsilon);
}

/**
 * @method qc.Math#fuzzyFloor
 *
 * @param {number} val
 * @param {number} [epsilon=(small value)]
 * @return {boolean} floor(val-epsilon)
 */
Math2.prototype.fuzzyFloor = function(val, epsilon) {
    return this.phaserMath.fuzzyFloor(val, epsilon);
}

/**
 * 计算平均数
 *
 * @method qc.Math#average
 * @params {...number} The numbers to average
 * @return {number} The average of all given values.
 */
Math2.prototype.average = function() {
    return this.phaserMath.average.apply(null, arguments);
}

/**
 * @method qc.Math#shear
 * @param {number} n
 * @return {number} n mod 1
 */
Math2.prototype.shear = function(n) {
    return this.phaserMath.shear(n);
}

/**
 * Snap a value to nearest grid slice, using rounding.
 *
 * Example: if you have an interval gap of 5 and a position of 12... you will snap to 10 whereas 14 will snap to 15.
 *
 * @method qc.Math#snapTo
 * @param {number} input - The value to snap.
 * @param {number} gap - The interval gap of the grid.
 * @param {number} [start] - Optional starting offset for gap.
 * @return {number}
 */
Math2.prototype.snapTo = function(input, gap, start) {
    return this.phaserMath.snapTo(input, gap, start);
}

/**
 * Snap a value to nearest grid slice, using floor.
 *
 * Example: if you have an interval gap of 5 and a position of 12... you will snap to 10. As will 14 snap to 10...
 * but 16 will snap to 15
 *
 * @method qc.Math#snapToFloor
 * @param {number} input - The value to snap.
 * @param {number} gap - The interval gap of the grid.
 * @param {number} [start] - Optional starting offset for gap.
 * @return {number}
 */
Math2.prototype.snapToFloor = function(input, gap, start) {
    return this.phaserMath.snapToFloor(input, gap, start);
}

/**
 * Snap a value to nearest grid slice, using ceil.
 *
 * Example: if you have an interval gap of 5 and a position of 12... you will snap to 15. As will 14 will snap to 15...
 * but 16 will snap to 20.
 *
 * @method qc.Math#snapToCeil
 * @param {number} input - The value to snap.
 * @param {number} gap - The interval gap of the grid.
 * @param {number} [start] - Optional starting offset for gap.
 * @return {number}
 */
Math2.prototype.snapToCeil = function(input, gap, start) {
    return this.phaserMath.snapToCeil(input, gap, start);
}

/**
 * Round to some place comparative to a `base`, default is 10 for decimal place.
 * The `place` is represented by the power applied to `base` to get that place.
 *
 *     e.g. 2000/7 ~= 285.714285714285714285714 ~= (bin)100011101.1011011011011011
 *
 *     roundTo(2000/7,3) === 0
 *     roundTo(2000/7,2) == 300
 *     roundTo(2000/7,1) == 290
 *     roundTo(2000/7,0) == 286
 *     roundTo(2000/7,-1) == 285.7
 *     roundTo(2000/7,-2) == 285.71
 *     roundTo(2000/7,-3) == 285.714
 *     roundTo(2000/7,-4) == 285.7143
 *     roundTo(2000/7,-5) == 285.71429
 *
 *     roundTo(2000/7,3,2)  == 288       -- 100100000
 *     roundTo(2000/7,2,2)  == 284       -- 100011100
 *     roundTo(2000/7,1,2)  == 286       -- 100011110
 *     roundTo(2000/7,0,2)  == 286       -- 100011110
 *     roundTo(2000/7,-1,2) == 285.5     -- 100011101.1
 *     roundTo(2000/7,-2,2) == 285.75    -- 100011101.11
 *     roundTo(2000/7,-3,2) == 285.75    -- 100011101.11
 *     roundTo(2000/7,-4,2) == 285.6875  -- 100011101.1011
 *     roundTo(2000/7,-5,2) == 285.71875 -- 100011101.10111
 *
 * Note what occurs when we round to the 3rd space (8ths place), 100100000, this is to be assumed
 * because we are rounding 100011.1011011011011011 which rounds up.
 *
 * @method qc.Math#roundTo
 * @param {number} value - The value to round.
 * @param {number} place - The place to round to.
 * @param {number} base - The base to round in... default is 10 for decimal.
 * @return {number}
 */
Math2.prototype.roundTo = function(value, place, base) {
    return this.phaserMath.roundTo(value, place, base);
}

/**
 * @method qc.Math#floorTo
 * @param {number} value - The value to round.
 * @param {number} place - The place to round to.
 * @param {number} base - The base to round in... default is 10 for decimal.
 * @return {number}
 */
Math2.prototype.floorTo = function(value, place, base) {
    return this.phaserMath.floorTo(value, place, base);
}

/**
 * @method qc.Math#ceilTo
 * @param {number} value - The value to round.
 * @param {number} place - The place to round to.
 * @param {number} base - The base to round in... default is 10 for decimal.
 * @return {number}
 */
Math2.prototype.ceilTo = function(value, place, base) {
    return this.phaserMath.ceilTo(value, place, base);
}

/**
 * Find the angle of a segment from (x1, y1) -> (x2, y2).
 * @method qc.Math#angleBetween
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {number} The angle, in radians.
 */
Math2.prototype.angleBetween = function(x1, y1, x2, y2) {
    return this.phaserMath.angleBetween(x1, y1, x2, y2);
}

/**
 * Find the angle of a segment from (x1, y1) -> (x2, y2).
 * Note that the difference between this method and Math.angleBetween is that this assumes the y coordinate travels
 * down the screen.
 *
 * @method qc.Math#angleBetweenY
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {number} The angle, in radians.
 */
Math2.prototype.angleBetweenY = function(x1, y1, x2, y2) {
    return this.phaserMath.angleBetweenY(x1, y1, x2, y2);
}

/**
 * Reverses an angle.
 * @method qc.Math#reverseAngle
 * @param {number} angleRad - The angle to reverse, in radians.
 * @return {number} Returns the reverse angle, in radians.
 */
Math2.prototype.reverseAngle = function(angleRad) {
    return this.phaserMath.reverseAngle(angleRad);
}

/**
 * Normalizes an angle to the [0,2pi) range.
 * @method qc.Math#normalizeAngle
 * @param {number} angleRad - The angle to normalize, in radians.
 * @return {number} Returns the angle, fit within the [0,2pi] range, in radians.
 */
Math2.prototype.normalizeAngle = function(angleRad) {
    return this.phaserMath.normalizeAngle(angleRad);
}

/**
 * Adds the given amount to the value, but never lets the value go over the specified maximum.
 *
 * @method qc.Math#maxAdd
 * @param {number} value - The value to add the amount to.
 * @param {number} amount - The amount to add to the value.
 * @param {number} max - The maximum the value is allowed to be.
 * @return {number}
 */
Math2.prototype.maxAdd = function(value, amount, max) {
    return this.phaserMath.maxAdd(value, amount, max);
}

/**
 * Subtracts the given amount from the value, but never lets the value go below the specified minimum.
 *
 * @method qc.Math#minSub
 * @param {number} value - The base value.
 * @param {number} amount - The amount to subtract from the base value.
 * @param {number} min - The minimum the value is allowed to be.
 * @return {number} The new value.
 */
Math2.prototype.minSub = function(value, amount, min) {
    return this.phaserMath.minSub(value, amount, min);
}

/**
 * Ensures that the value always stays between min and max, by wrapping the value around.
 *
 * @method qc.Math#wrap
 * @param {number} value - The value to wrap.
 * @param {number} min - The minimum the value is allowed to be.
 * @param {number} max - The maximum the value is allowed to be, should be larger than `min`.
 * @return {number} The wrapped value.
 */
Math2.prototype.wrap = function(value, min, max) {
    if (min < max)
        return this.phaserMath.wrap(value, min, max);
    return this.phaserMath.wrap(value, max, min);
}

/**
 * Adds value to amount and ensures that the result always stays between 0 and max, by wrapping the value around.
 *
 * Values _must_ be positive integers, and are passed through Math.abs. See {@link qc.Math#wrap} for an alternative.
 *
 * @method qc.Math#wrapValue
 * @param {number} value - The value to add the amount to.
 * @param {number} amount - The amount to add to the value.
 * @param {number} max - The maximum the value is allowed to be.
 * @return {number} The wrapped value.
 */
Math2.prototype.wrapValue = function(value, amount, max) {
    return this.phaserMath.wrapValue(value, amount, max);
}

/**
 * Returns true if the number given is odd.
 *
 * @method qc.Math#isOdd
 * @param {integer} n - The number to check.
 * @return {boolean} True if the given number is odd. False if the given number is even.
 */
Math2.prototype.isOdd = function(n) {
    return !!(this.phaserMath.isOdd(n));
}

/**
 * Returns true if the number given is even.
 *
 * @method qc.Math#isEven
 * @param {integer} n - The number to check.
 * @return {boolean} True if the given number is even. False if the given number is odd.
 */
Math2.prototype.isEven = function(n) {
    return !!(this.phaserMath.isEven(n));
}

/**
 * Variation of Math.min that can be passed either an array of numbers or the numbers as parameters.
 *
 * Prefer the standard `Math.min` function when appropriate.
 *
 * @method qc.Math#min
 * @return {number} The lowest value from those given.
 * @see {@link http://jsperf.com/math-s-min-max-vs-homemade}
 */
Math2.prototype.min = function() {
    return this.phaserMath.min.apply(null, arguments);
}

/**
 * Variation of Math.max that can be passed either an array of numbers or the numbers as parameters.
 *
 * Prefer the standard `Math.max` function when appropriate.
 *
 * @method qc.Math#max
 * @return {number} The largest value from those given.
 * @see {@link http://jsperf.com/math-s-min-max-vs-homemade}
 */
Math2.prototype.max = function() {
    return this.phaserMath.max.apply(null, arguments);
}

/**
 * Keeps an angle value between -180 and +180; or -PI and PI if radians.
 *
 * @method qc.Math#wrapAngle
 * @param {number} angle - The angle value to wrap
 * @param {boolean} [radians=false] - Set to `true` if the angle is given in radians, otherwise degrees is expected.
 * @return {number} The new angle value; will be the same as the input angle if it was within bounds.
 */
Math2.prototype.wrapAngle = function(angle, radians) {
    return this.phaserMath.wrapAngle(angle, radians);
}

/**
 * Calculates a linear (interpolation) value over t.
 *
 * @method qc.Math#linear
 * @param {number} p0
 * @param {number} p1
 * @param {number} t
 * @return {number}
 */
Math2.prototype.linear = function(p0, p1, t) {
    return this.phaserMath.linear(p0, p1, t);
}

/**
 * @method qc.Math#factorial
 * @param {number} value - the number you want to evaluate
 * @return {number}
 */
Math2.prototype.factorial = function(value) {
    return this.phaserMath.factorial(value);
}

/**
 * Fetch a random entry from the given array.
 *
 * Will return null if there are no array items that fall within the specified range
 * or if there is no item for the randomly choosen index.
 *
 * @method qc.Math#getRandom
 * @param {any[]} objects - An array of objects.
 * @param {integer} startIndex - Optional offset off the front of the array. Default value is 0, or the beginning of the array.
 * @param {integer} length - Optional restriction on the number of values you want to randomly select from.
 * @return {object} The random object that was selected.
 */
Math2.prototype.getRandom = function(objects, startIndex, length) {
    return Phaser.ArrayUtils.getRandomItem(objects, startIndex, length);
}

/**
 * 计算两个点之间的距离
 *
 * @method qc.Math#distance
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {number} The distance between the two sets of coordinates.
 */
Math2.prototype.distance = function(x1, y1, x2, y2) {
    return this.phaserMath.distance(x1, y1, x2, y2);
}

/**
 * Force a value within the boundaries by clamping `x` to the range `[a, b]`.
 *
 * @method qc.Math#clamp
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
Math2.prototype.clamp = function(x, a, b) {
    return this.phaserMath.clamp(x, a, b);
}

/**
 * Checks if two values are within the given tolerance of each other.
 *
 * @method qc.Math#within
 * @param {number} a - The first number to check
 * @param {number} b - The second number to check
 * @param {number} tolerance - The tolerance. Anything equal to or less than this is considered within the range.
 * @return {boolean} True if a is <= tolerance of b.
 * @see {@link Phaser.Math.fuzzyEqual}
 */
Math2.prototype.within = function(a, b, tolerance) {
    return this.phaserMath.within(a, b, tolerance);
}

/**
 * A value representing the sign of the value: -1 for negative, +1 for positive, 0 if value is 0.
 *
 * This works differently from `Math.sign` for values of NaN and -0, etc.
 *
 * @method qc.Math#sign
 * @param {number} x
 * @return {integer} An integer in {-1, 0, 1}
 */
Math2.prototype.sign = function(x) {
    return this.phaserMath.sign(x);
}

/**
 * Convert degrees to radians.
 *
 * @method qc.Math#degToRad
 * @param {number} degrees - Angle in degrees.
 * @return {number} Angle in radians.
 */
Math2.prototype.degToRad = function(degrees) {
    return this.phaserMath.degToRad(degrees);
}

/**
 * Convert degrees to radians.
 *
 * @method qc.Math#radToDeg
 * @param {number} radians - Angle in radians.
 * @return {number} Angle in degrees
 */
Math2.prototype.radToDeg = function(radians) {
    return this.phaserMath.radToDeg(radians);
}

/**
 * Returns a random real number between 0 and 1.(未指定最大最小值)
 * 否则返回[min, max]直接的一个随机整数
 *
 * @method qc.Math#frac
 * @return {number} A random real number between 0 and 1.
 */
Math2.prototype.random = function(min, max) {
    if (typeof min === "undefined" || typeof max === "undefined")
        return this.phaserRnd.frac();

    if (min > max)
        return this.phaserRnd.integerInRange(max, min);
    return this.phaserRnd.integerInRange(min, max);
}

/**
 * 返回一个唯一字符串
 *
 * @method qc.Math#uuid
 */
Math2.prototype.uuid = function() {
    return this.phaserRnd.uuid();
}

/**
 * 返回下一个全局id值
 */
Math2.prototype.id = (function(){
    var id = 1;
    return function(){
        return ++id;
    };
})();

// 计算逆矩阵
Math2.prototype.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

// 矩阵乘积
Math2.prototype.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

// 平滑阻尼
Math2.prototype.smoothDamp = function (current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
    smoothTime = Math.max(0.0001, smoothTime);
    var num = 2 / smoothTime;
    var num2 = num * deltaTime;
    var num3 = 1 / ( 1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
    var num4 = current - target;
    var num5 = target;
    var num6 = maxSpeed * smoothTime;
    num4 = this.clamp(num4, -num6, num6);
    target = current - num4;
    var num7 = (currentVelocity + num * num4) * deltaTime;
    currentVelocity = (currentVelocity - num * num7) * num3;
    var num8 = target + (num4 + num7) * num3;
    if (num5 - current > 0 && num8 > num5) {
        num8 = num5;
        currentVelocity = (num8 - num5) / deltaTime;
    }
    return [num8, currentVelocity];
};
