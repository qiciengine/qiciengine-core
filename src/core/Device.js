/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 设备信息接口支持
 *
 * @class qc.Device
 * @constructor
 * @internal
 */
var Device = qc.Device = function(game, phaser) {
    var self = this;
    self.phaser = phaser;
    self._game = game;
    self._orientation = Device.PORTRAIT;

    /**
     * @property {qc.Signal} onOrientationChange - 切换横竖屏的事件
     */
    self.onOrientationChange = new qc.Signal();
}
Device.prototype = {};
Device.prototype.constructor = Debug;

Object.defineProperties(Device.prototype, {
    /**
     * @property {qc.Game} game - 游戏实例的引用
     * @readonly
     */
    game: {
        get: function() { return this._game; }
    },

    /**
     * @property {boolean} desktop - 是否运行在PC上
     * @readonly
     */
    desktop: {
        get: function() {
            if (this.phaser.initialized)
                return this.phaser.desktop;
            else {
                // phaser 还没 init 完毕，走自己的检测
                if (this._isDesktop === undefined)
                    this.checkOS();
                return this._isDesktop;
            }
        }
    },

    /**
     * @property {boolean} iOS - 是否运行在iOS设备上
     * @readonly
     */
    iOS: {
        get: function() { return this.phaser.iOS; }
    },

    /**
     * @property {boolean} android - 是否运行在android设备上
     * @readonly
     */
    android: {
        get: function() { return this.phaser.android; }
    },

    /**
     * @property {boolean} webGL - 是否支持webGL
     * @readonly
     */
    webGL: {
        get: function() { return this.phaser.webGL; }
    },

    /**
     * @property {boolean} vibration - 是否支持震动接口
     * @readonly
     */
    vibration: {
        get: function() { return this.phaser.vibration; }
    },

    /**
     * @property {int} browser - 当前运行的浏览器
     * @readonly
     */
    browser: {
        get: function() {
            if (this.phaser.chrome) return Device.CHROME;
            if (this.phaser.arora) return Device.ARORA;
            if (this.phaser.epiphany) return Device.EPIPHANY;
            if (this.phaser.firefox) return Device.FIREFOX;
            if (this.phaser.trident) return Device.TRIDENT;
            if (this.phaser.ie) return Device.IE;
            if (this.phaser.mobileSafari) return Device.MOBILE_SAFARI;
            if (this.phaser.midori) return Device.MIDORI;
            if (this.phaser.opera) return Device.OPERA;
            if (this.phaser.safari) return Device.SAFARI;
            if (this.phaser.silk) return Device.SILK;
            if (this.phaser.UCBrowser) return Device.UCBROWSER;

            return Device.UNKNOW;
        }
    },

    /**
     * @property {number} resolution - 设备分辨率
     * @readonly
     */
    resolution: {
        get: function() {
            return window.devicePixelRatio;
        }
    },

    /**
     * @property {boolean} fullscreen - 是否支持全屏
     * @readonly
     */
    fullscreen: {
        get: function() { return this.phaser.fullscreen; }
    },

    /**
     * @property {boolean} editor - 当前是否处于editor模式
     */
    editor: {
        get: function()  { return this._editor || false; },
        set: function(v) {
            this._editor = v;
            if (v) {
                this.game.debug.on = true;
            }
        }
    },

    /**
     * @property {number} orientation - 当前设备是横版还是竖版
     */
    orientation: {
        get: function() { return this._orientation; },
        set: function(v) {
            if (this.orientation === v) return;
            this._orientation = v;

            // 扔出事件
            this.onOrientationChange.dispatch(v);
        }
    }
});

/**
 * 几种浏览器
 */
Device.UNKNOW = -1;
Device.CHROME = 0;
Device.ARORA = 1;
Device.EPIPHANY = 2;
Device.FIREFOX = 3;
Device.IE = 4;
Device.TRIDENT = 5;
Device.MOBILE_SAFARI = 6;
Device.MIDORI = 7;
Device.OPERA = 8;
Device.SAFARI = 9;
Device.WEBAPP = 10;
Device.SILK = 11;
Device.UCBROWSER = 12;

/**
 * 横版、竖版定义
 */
Device.AUTO = 0;
Device.PORTRAIT = 1;
Device.LANDSCAPE = 2;

/**
 * 重置当前的横竖屏
 * @internal
 */
Device.prototype.resetOrientation = function() {
    if (this.game.world.width > this.game.world.height)
        this.orientation = Device.LANDSCAPE;
    else
        this.orientation = Device.PORTRAIT;
};

/**
 * 当前是否 Canvas 模式
 */
Device.prototype.isCanvasRenderer = function() {
    return this.game.phaser.renderType === Phaser.CANVAS;
};

/**
 * 当前是否 WebGL 模式
 */
Device.prototype.isWebGLRenderer = function() {
    return this.game.phaser.renderType === Phaser.WEBGL;
};

/**
 * 检测系统的OS环境
 * @internal
 */
Device.prototype.checkOS = function() {
    var ua = navigator.userAgent;
    var device = {};

    if (/Playstation Vita/.test(ua))
    {
        device.vita = true;
    }
    else if (/Kindle/.test(ua) || /\bKF[A-Z][A-Z]+/.test(ua) || /Silk.*Mobile Safari/.test(ua))
    {
        device.kindle = true;
        // This will NOT detect early generations of Kindle Fire, I think there is no reliable way...
        // E.g. "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-80) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true"
    }
    else if (/Android/.test(ua))
    {
        device.android = true;
    }
    else if (/CrOS/.test(ua))
    {
        device.chromeOS = true;
    }
    else if (/iP[ao]d|iPhone/i.test(ua))
    {
        device.iOS = true;
    }
    else if (/Linux/.test(ua))
    {
        device.linux = true;
    }
    else if (/Mac OS/.test(ua))
    {
        device.macOS = true;
    }
    else if (/Windows/.test(ua))
    {
        device.windows = true;

        if (/Windows Phone/i.test(ua))
        {
            device.windowsPhone = true;
        }
    }

    var silk = /Silk/.test(ua); // detected in browsers

    this._isDesktop = false;
    if (device.windows || device.macOS || (device.linux && !silk) || device.chromeOS)
    {
        this._isDesktop = true;
    }

    //  Windows Phone / Table reset
    if (device.windowsPhone || ((/Windows NT/i.test(ua)) && (/Touch/i.test(ua))))
    {
        this._isDesktop = false;
    }
};
