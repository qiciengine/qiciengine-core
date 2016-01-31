/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 相机
 *
 * @class qc.Camera
 * @constructor
 * @internal
 */
var Camera = qc.Camera = function(phaser) {
    this.phaser = phaser;
    phaser._qc = this;

    // 该参数Phaser的默认值为true，会导致相机偏移自动取整，
    // 意义不大且会影响编辑工具滚轮缩放，因此默认将其关闭为false。
    phaser.roundPx = false;
}
Camera.prototype = {};
Camera.prototype.constructor = Camera;

Object.defineProperties(Camera.prototype, {
    /**
     * @property {qc.Game} game
     * @readonly
     */
    'game' : {
        get : function() { return this.phaser.game._qc; }
    },

    /**
     * @prooperty {qc.World} world
     * @readonly
     */
    'world' : {
        get : function() { return this.phaser.world._qc; }
    },

    /**
     * @property {number} id - 相机标识（以后多相机可能会用到）
     * @readonly
     */
    'id' : {
        get : function() { return this.phaser.id; }
    },

    /**
     * @property {qc.Rectangle} view - 相机的视野
     * @readonly
     */
    'view' : {
        get : function() { return this.phaser.view; }
    },

    /**
     * @property {qc.Point} postion - 设置相机的位置
     */
    'position' : {
        get : function()  { return this.phaser.position; },
        set : function(v) { this.phaser.position = v;           }
    },

    /**
     * @property {qc.Point} size - 设置相机的视野大小
     */
    'size' : {
        get : function()  { return new qc.Point(this.view.width, this.view.height); },
        set : function(v) { this.setSize(v.x, v.y);                                 }
    },

    /**
     * @property {number} x - 相机的X坐标
     */
    'x' : {
        get : function()  { return this.phaser.x; },
        set : function(v) { this.phaser.x = v;    }
    },

    /**
     * @property {number} y - 相机的Y坐标
     */
    'y' : {
        get : function()  { return this.phaser.y; },
        set : function(v) { this.phaser.y = v;    }
    },

    /**
     * @property {number} width - 相机的视野宽度
     */
    'width' : {
        get : function()  { return this.phaser.width; },
        set : function(v) { this.phaser.width = v;    }
    },

    /**
     * @property {number} height - 相机的视野高度
     */
    'height' : {
        get : function()  { return this.phaser.height; },
        set : function(v) { this.phaser.height = v;    }
    },

    /**
     * @property {qc.Rectangle} bounds
     */
    'bounds' : {
        get : function()  { return this.phaser.bounds; },
        set : function(v) { this.phaser.bounds = v;    }
    },

    /**
     * @property {boolean} visible - 相机是否可见
     */
    'visible' : {
        get : function()  { return this.phaser.visible; },
        set : function(v) { this.phaser.visible = v;    }
    },

    /**
     * @property {qc.Node} target - 相机跟踪的目标节点
     * @readonly
     */
    'target' : {
        get : function()  { return this.phaser.target; }
    }
});

/**
 * 相机跟随目标的方式
 * @constant
 * @type {number}
 */
Camera.FOLLOW_LOCKON = Phaser.Camera.FOLLOW_LOCKON;
Camera.FOLLOW_PLATFORMER = Phaser.Camera.FOLLOW_PLATFORMER;
Camera.FOLLOW_TOPDOWN = Phaser.Camera.FOLLOW_TOPDOWN;
Camera.FOLLOW_TOPDOWN_TIGHT = Phaser.Camera.FOLLOW_TOPDOWN_TIGHT;

/**
 * 跟随目标
 *
 * @method qc.Camera#follow
 * @param {qc.Node} target - 如果设置为null，则停止跟随
 * @param {number} [style] - 跟随目标的方式
 */
Camera.prototype.follow = function(target, style) {
    if (target === null)
        this.phaser.unfollow();
    else
        this.phaser.follow(target, style);
}

/**
 * 相机聚焦到某个点
 * @method qc.Camera#focusOn
 * @param {number} x
 * @param {number} y
 */
Camera.prototype.focusOn = function(x, y) {
    this.phaser.focusOnXY(x, y);
}

/**
 * 重置相机的位置、不跟随等
 * @method qc.Camera#reset
 */
Camera.prototype.reset = function() {
    this.phaser.reset();
}