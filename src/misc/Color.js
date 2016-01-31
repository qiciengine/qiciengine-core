/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 颜色的描述
 * 颜色值，可以是：
 * '#FFFFFF' '#ffffff' - 十六进制描述的字符串，不带alpha
 * '#00FFFFFF' '#00ffffff' - 十六进制描述的字符串，带alpha
 * 'RGB(100, 100, 100)' 'rgb(100, 100, 100)' - 字符串描述rgb
 * 'RGBA(100, 100, 100, 0.5)' 'rgba(100, 100, 100, 0.5)' - 字符串描述rgba
 * 0xFFFFFF - int类型描述：rgb
 * 0x00FFFFFF - int类型描述：argb
 * [128, 10, 0] - 数组描述
 * [11, 128, 0, 0.5] - 数组描述
 * @param {string | number | undefined} color
 */
var Color = qc.Color = function(color) {
    this.alpha = 1;
    this._rgb = [0xFF, 0xFF, 0xFF];
    if (color == null) return;

    if (typeof color === 'number') {
        this._rgb[0] = color >> 16 & 0xFF;
        this._rgb[1] = color >> 8 & 0xFF;
        this._rgb[2] = color & 0xFF;

        this.alpha = (color >>> 24) / 255;
    }
    else if (qc.Util.isArray(color)) {
        this.rgb = color;
    }
    else if (typeof color === 'string') {
        color = color.toLowerCase();
        if (color.indexOf('rgb') === 0) {
            var rgba = Phaser.Color.webToColor(color);
        }
        else {
            var rgba = this._hexToColor(color);
            rgba.a = rgba.a / 255;
        }
        this._rgb[0] = rgba.r;
        this._rgb[1] = rgba.g;
        this._rgb[2] = rgba.b;
        this.alpha = rgba.a;
    }
    else
        throw new Error('Invalid color');
};

Color.prototype = {};
Color.prototype.constructor = Color;

Object.defineProperties(Color.prototype, {
    /**
     * @property {number} alpha - 透明度（0 - 1）
     */
    alpha: {
        get: function()  { return this._alpha; },
        set: function(v) {
            if (v < 0 || v > 1) v = 1;
            this._alpha = v;
        }
    },

    /**
     * @property {array} rgb - [r, g, b] r, g, b : 范围为0 - 255
     */
    rgb: {
        get: function() {
            return this._rgb;
        },
        set: function(rgb) {
            if (!qc.Util.isArray(rgb)) throw new Error('Expected:Array');
            if (rgb.length < 3) throw new Error('Invalid rgb');
            this._rgb[0] = rgb[0];
            this._rgb[1] = rgb[1];
            this._rgb[2] = rgb[2];
            if (rgb.length === 4)
                this.alpha = rgb[3];
            else
                this.alpha = 1;
        }
    },

    /**
     *@property {number} r - r值
     */
     r: {
        get: function() {
            return this._rgb[0];
        },
        set: function(v) {
            this._rgb[0] = v;
        }
    },

    /**
     *@property {number} g - g值
     */
     g: {
        get: function() {
            return this._rgb[1];
        },
        set: function(v) {
            this._rgb[1] = v;
        }
    },

    /**
     *@property {number} b - b值
     */
     b: {
        get: function() {
            return this._rgb[2];
        },
        set: function(v) {
            this._rgb[2] = v;
        }
    },


    /**
     * @property {string} class - 类名
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.Color'; }
    }
});

/**
 * 颜色转换为字符串描述
 * 'rgba'   -> RGBA(100, 100, 100, 0.5)
 * 'rgb'    -> RGB(100, 100, 100)
 * '#rgb'   -> #FFFFFF
 * '#argb'  -> #80FFFFFF
 * @method toString
 * @param {string} patten
 * @return {string}
 */
Color.prototype.toString = function(patten) {
    switch (patten) {
        case '#rgb' :
            return '#' + Phaser.Color.componentToHex(this._rgb[0]) +
                Phaser.Color.componentToHex(this._rgb[1]) +
                Phaser.Color.componentToHex(this._rgb[2]);
        case '#argb' :
            return '#' + Phaser.Color.componentToHex(Math.round(this.alpha * 255)) +
                Phaser.Color.componentToHex(this._rgb[0]) +
                Phaser.Color.componentToHex(this._rgb[1]) +
                Phaser.Color.componentToHex(this._rgb[2]);
        case 'rgb' :
            return 'rgb(' + this._rgb[0].toString() + ',' +
                this._rgb[1].toString() + ',' +
                this._rgb[2].toString() + ')';
        default :
            return 'rgba(' + this._rgb[0].toString() + ',' +
                this._rgb[1].toString() + ',' +
                this._rgb[2].toString() + ',' +
                this.alpha + ')';
    }
};

/**
 * 转为整数描述
 * @method toNumber
 * @param {boolean} alpha - 是否携带alpha值返回，默认为false
 * @return {number}
 */
Color.prototype.toNumber = function(alpha) {
    if (alpha)
        return ((this.alpha * 255) << 24 |
            this._rgb[0] << 16 |
            this._rgb[1]<< 8 |
            this._rgb[2]) >>> 0;

    return (this._rgb[0] << 16 |
        this._rgb[1]<< 8 |
        this._rgb[2]) >>> 0;
};

/**
 * 转换16进制的字符串为rgba
 * @method _hexToColor
 * @param hex - 16进制颜色
 * @returns {object}
 * @private
 */
Color.prototype._hexToColor= function (hex) {
    if (hex.length <= 0 || hex[0] !== '#') return { r : 255, g : 255, b : 255, a : 255 };

    hex = hex.substr(1, hex.length - 1);
    var hasAlpha = false;
    if (hex.length > 6 && hex.length <= 8) {
        hasAlpha = true;
        while (hex.length < 8) hex = '0' + hex;
    }
    while (hex.length < 6) hex = '0' + hex;
    var alpha = 255;
    var i = 0;
    if (hasAlpha) {
        alpha = parseInt(hex.substr(i, 2), 16);
        i += 2;
    }
    var r = parseInt(hex.substr(i, 2), 16);
    i += 2;
    var g = parseInt(hex.substr(i, 2), 16);
    i += 2;
    var b = parseInt(hex.substr(i, 2), 16);

    return { r : r, g : g, b : b, a : alpha };
};

/**
 * 几种常见的颜色
 */
Color.black = new Color(0xff000000);
Color.white = new Color(0xffffffff);
Color.red = new Color(0xffff0000);
Color.yellow = new Color(0xffffff00);
Color.blue = new Color(0xff00ffff);
Color.green = new Color(0xff00ff00);
Color.grey = new Color(0xffcccccc);
Color.shadow = new Color(0x80000000);
Color.background = new Color(0xff474747);
