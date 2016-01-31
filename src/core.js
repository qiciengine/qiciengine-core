/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
 
// 如果已经定义过qc.VERSION变量，则代表js重复加载执行，直接return不再重复定义
if (window.qc && window.qc.Node) {
    return;
}

/**
 * 深拷贝
 * @param object 将要被深拷贝的对象
 */
var deepCopy = function(object) {
    var copied = [];

    var contains = function(arr, obj) {
        for (var i in arr)
        {
            if (arr[i] == obj)
                return true;
        }

        return false;
    };

    var copyImp = function(obj) {
        if (typeof(obj) !== 'object' || obj === null)
            return obj;
        else if (contains(copied, obj))
            return obj;

        copied.push(obj);

        var newObject = {};
        if (obj.constructor === Array) {
            newObject = [];
        }

        for (var i in obj) {
            // 过滤从上级原形继承的属性
            if (! obj.hasOwnProperty(i))
                continue;

            newObject[i] = copyImp(obj[i]);
        }

        return newObject;
    };

    return copyImp(object);
};

/**
 * 混合注入属性
 * @param object 将要被注入属性的对象
 * @param properties 需要注入的属性
 * @param keepExist 是否保留已经定义过的属性，默认为false
 */
var mixin = function(object, properties, keepExist) {
    for (var name in properties) {
        if (!keepExist || object[name] === undefined) {
            object[name] = properties[name];
        }
    }
    return object;
};

if (!window.qc){
    window.qc = {};
}
var qc = window.qc,
    Phaser = window.Phaser,
    PIXI = window.PIXI;

mixin(qc, {
    // 版本
    PHASER_VERSION: Phaser.VERSION,

    // 多个游戏实例时使用
    GAMES: Phaser.GAMES,

    // 渲染方式
    AUTO:     Phaser.AUTO,
    CANVAS:   Phaser.CANVAS,
    WEBGL:    Phaser.WEBGL,
    HEADLESS: Phaser.HEADLESS,

    // 方向
    NONE:  Phaser.NONE,
    LEFT:  Phaser.LEFT,
    RIGHT: Phaser.RIGHT,
    UP:    Phaser.UP,
    DOWN:  Phaser.DOWN,

    /**
     * 缩放模式
     *
     * @property {Object} scaleModes
     * @property {Number} scaleModes.DEFAULT = LINEAR
     * @property {Number} scaleModes.LINEAR Smooth scaling
     * @property {Number} scaleModes.NEAREST Pixelating scaling
     */
    scaleModes: Phaser.scaleModes
});
