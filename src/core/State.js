/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 场景的基类
 * 同时提供了一些常用功能的快速访问接口
 *
 * @class qc.State
 * @constructor
 */
var State = qc.State = function() {
    // 建立代理对象的关联
    var phaser = new Phaser.State();
    this.phaser = phaser;
    phaser._qc = this;
}
State.prototype = {};
State.prototype.constructor = State;

Object.defineProperties(State.prototype, {
    /**
     * @property {qc.Game} game - 游戏实例的引用
     * @readonly
     */
    'game' : {
        get : function() { return this.phaser.game; }
    },

    /**
     * @property {String} key - 场景的唯一标识符
     */
    'key' : {
        get : function()  { return this.phaser.key; },
        set : function(v) { this.phaser.key = v; }
    },

    /**
     * @property {qc.GameObjectFactory} add
     */
    'add' : {
        get : function() { return this.phaser.add._qc; },
        set : function(v) {
            this.phaser.add = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.GameObjectCreator} make
     */
    'make' : {
        get : function()  { return this.phaser.make._qc; },
        set : function(v) {
            this.phaser.make = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.Camera} camera
     */
    'camera' : {
        get : function() { return this.phaser.camera._qc; },
        set : function(v) {
            this.phaser.camera = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.Assets} assets - 资源管理接口
     */
    'assets' : {
        get : function()  { return this._assets; },
        set : function(v) { this._assets = v; }
    },

    /**
     * @property {qc.Input} input - 输入管理
     */
    'input' : {
        get : function()  { return this.phaser.input._qc; },
        set : function(v) {
            this.phaser.input = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.Math} math - 数学相关运算库
     */
    'math' : {
        get : function()  { return this.phaser.math._qc; },
        set : function(v) {
            this.phaser.math = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.Time} time - 时间管理
     */
    'time' : {
        get : function()  { return this.phaser.time._qc; },
        set : function(v) {
            this.phaser.time = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.TweenManager} tweens - 动画组件
     */
    'tweens' : {
        get : function()  { return this.phaser.tweens._qc; },
        set : function(v) {
            this.phaser.tweens = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.World} world - 对应的游戏世界
     */
    'world' : {
        get : function()  {
            if (!this.phaser.world) return null;
            return this.phaser.world._qc;
        },
        set : function(v) {
            this.phaser.world = v.phaser;
            v.phaser._qc = v;
        }
    },

    /**
     * @property {qc.Physics} physics - 使用的物理系统
     */
    'physics' : {
        get : function()  { return this.phaser.physics._qc; },
        set : function(v) {
            this.phaser.physics = v.phaser;
            v.phaser._qc = v;
        }
    }
});
