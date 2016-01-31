/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 舞台，控制所有游戏元素的根节点。
 *
 * @class qc.Stage
 * @param {Phaser.Stage} phaser
 * @internal
 * @constructor
 */
var Stage = qc.Stage = function(phaser) {
    this.phaser = phaser;
    phaser._qc = this;
};

Stage.prototype = {};
Stage.prototype.constructor = Stage;

Object.defineProperties(Stage.prototype, {
    /**
     * @proeprty {qc.Game} game
     * @readonly
     */
    'game' : {
        get : function() { return this.phaser.game._qc; }
    },

    /**
     * @property {String} name - 舞台标识
     * @default '_stage_root'
     */
    'name' : {
        get : function()  { return this.phaser.name; },
        set : function(v) { this.phaser.name = v;    }
    },

    /**
     * property {boolean} runInBackground - 是不是在后台运行
     * @default true
     */
    runInBackground : {
        get : function()  { return this.phaser.disableVisibilityChange; },
        set : function(v) { this.phaser.disableVisibilityChange = v;    }
    },


    /**
     * 背景颜色
     * @property {qc.Color} backgroundColor
     */
    'backgroundColor' : {
        get : function()  { return new Color(this.phaser.backgroundColor); },
        set : function(value) {
            value = value || Color.background;
            if (!(value instanceof Color))
                throw new Error('Expected qc.Color');
            this.phaser.backgroundColor = value.toNumber();
        }
    },

    /**
     * @property {number} x
     * 本地X坐标，永远为0
     * @readonly
     * @override
     */
    'x': {
        get: function() {
            return 0;
        }
    },

    /**
     * @property {number} x
     * 本地X坐标，永远为0
     * @readonly
     * @override
     */
    'y': {
        get: function() {
            return 0;
        }
    },

    /**
     * @property {qc.Rectangle} rect - 矩形框(相对于父亲节点)
     * @readonly
     * @override
     */
    'rect' : {
        get : function() {
            return new qc.Rectangle(0, 0, this.game.width, this.game.height);
        }
    },

    /**
     * @property {number} pivotX - 节点自身的原点X位置
     * @override
     * @readonly
     */
    pivotX : {
        get : function() { return 0; },
        set : function(v) { throw new Error('pivotX cannot be modified'); }
    },

    /**
     * @property {number} pivotY - 节点自身的原点Y位置
     * @override
     * @readonly
     */
    pivotY : {
        get : function() { return 0; },
        set : function(v) { throw new Error('pivotY cannot be modified'); }
    },

    /**
     * @property {qc.Matrix} worldTransform - 自身在世界的变形矩阵
     * @protected
     * @readonly
     */
    worldTransform : {
        get : function() {
            return this.phaser.worldTransform;
        }
    }
});

/**
 * 更新列表中所有的transforms
 *
 * @method qc.Stage#updateTransform
 */
Stage.prototype.updateTransform = function() {
    this.phaser.updateTransform();
}

/**
 * 销毁舞台
 *
 * @method qc.Stage#destroy
 */
Stage.prototype.destroy = function() {
    this.phaser.destroy();
    delete this.phaser;
}
