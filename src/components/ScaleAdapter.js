/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Scale UIRoot with device resolution
 *
 * @class qc.ScaleAdapter
 */
var ScaleAdapter = defineBehaviour('qc.ScaleAdapter', qc.Behaviour, function() {
    var self = this;
    
    /**
     * @property {qc.Node} target - The target node to scale. Most of the time, the node is UIRoot.
     */
    self.target = null;

    /**
     * @property {qc.Point} referenceResolution - The reference resulotion to scale.
     */
    self.referenceResolution = new qc.Point(0, 0);

    /**
     * @property {number} manualType - The scale types:
     *   ScaleAdapter.NONE
     *   ScaleAdapter.MANUAL_HEIGHT
     *   ScaleAdapter.MANUAL_WIDTH
     *   ScaleAdapter.EXPAND
     *   ScaleAdapter.SHRIKN
     *   ScaleAdapter.FILL
     */
    self.manualType = ScaleAdapter.NONE;

    /**
     * @property {[number]} gameObjectRecord - The transform of the node this component attached to.
     * @private
     */
    self.gameObjectRecord = self.gameObject ?
        [self.gameObject.scaleX, self.gameObject.scaleY, self.gameObject.width, self.gameObject.height] :
        [];

    self._fullTarget = false;
    self.runInEditor = true;
}, {
    target : qc.Serializer.NODE,
    referenceResolution : qc.Serializer.GEOM,
    manualType : qc.Serializer.NUMBER,
    fullTarget : qc.Serializer.BOOLEAN,
    gameObjectRecord : qc.Serializer.NUMBERS
});
ScaleAdapter.__menu = 'UI/ScaleAdapter';

Object.defineProperties(ScaleAdapter.prototype,{
    /**
     * @property {boolean} fullTarget - 是否使内容填满目标，通常自身是容器时使用;
     * @private
     */
    fullTarget : {
        get : function() { return this._fullTarget; },
        set : function(value) {
            if (this._fullTarget !== value) {
                this._fullTarget = value;
                if (!value && this.gameObject) {
                    // Reset the size
                    this.gameObject.width = this.gameObjectRecord[2];
                    this.gameObject.height = this.gameObjectRecord[3];
                }
                this._forceUpdate = true;
            }
        }
    }
});

/**
 * Nothing to to
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.NONE = 0;

/**
 * Scale base on height. The height of area is referenceResolution.y.
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.MANUAL_HEIGHT = 1;

/**
 * Scale base on width. The height of area is referenceResolution.x.
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.MANUAL_WIDTH = 2;

/**
 * Scale to make it exactly place in the target area.
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.EXPAND = 3;

/**
 * Scale to make it surround the target area.
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.SHRINK = 4;

/**
 * Scale width and height individually to make target resolution is equal to referenceResolution.
 *
 * @constant
 * @type {integer}
 */
ScaleAdapter.FILL = 5;

/**
 * When the target node is initialized and the game canvas's size is fixed, set: node size = world size
 */
ScaleAdapter.prototype.awake = function() {
    if (this.game.fixedGameSize) {
        var o = this.gameObject;
        o.width = this.game.world.width;
        o.height = this.game.world.height;
        o.scaleX = 1;
        o.scaleY = 1;
    }
};

/**
 * When this component is enabled, record the node transform.
 */
ScaleAdapter.prototype.onEnable = function() {
    var self = this,
        o = self.gameObject,
        record = self.gameObjectRecord;
    record[0] = o.scaleX;
    record[1] = o.scaleY;
    record[2] = o.width;
    record[3] = o.height;
};

/**
 * When this component is disabled, reset the node size.
 */
ScaleAdapter.prototype.onDisable = function() {
    var self = this,
        o = self.gameObject,
        record = self.gameObjectRecord;
    if (record.length < 4 || record[0] === null || isNaN(record[0])) {
        return;
    }
    o.scaleX = record[0];
    o.scaleY = record[1];
    o.width = record[2];
    o.height = record[3];
};

/**
 * @method preUpdate
 * @internal
 */
ScaleAdapter.prototype.preUpdate = function() {
    var self = this;
    if (self.game.fixedGameSize) return;
    
    var o = self.gameObject;
    if (!o || !o.scaleX) return;
    
    var targetSize = self.getTargetSize();
    var refSize = self.getReferenceResolution();

    // 参考对象或者参考尺寸不存在时不进行处理
    if (targetSize.x === 0 ||
        targetSize.y === 0 ||
        refSize.x === 0 ||
        refSize.y === 0)
        return;

    var calcScaleX = 1;
    var calcScaleY = 1;
    switch (this.manualType) {
        case qc.ScaleAdapter.MANUAL_HEIGHT:
            calcScaleY = calcScaleX = targetSize.y / refSize.y;
            break;
        case qc.ScaleAdapter.MANUAL_WIDTH:
            calcScaleY = calcScaleX = targetSize.x / refSize.x;
            break;
        case qc.ScaleAdapter.EXPAND:
            calcScaleY = calcScaleX = Math.min(targetSize.x / refSize.x,
                targetSize.y / refSize.y);
            break;
        case qc.ScaleAdapter.SHRINK:
            calcScaleY = calcScaleX = Math.max(targetSize.x / refSize.x,
                targetSize.y / refSize.y);
            break;
        case qc.ScaleAdapter.FILL:
            calcScaleX = targetSize.x / refSize.x;
            calcScaleY = targetSize.y / refSize.y;
            break;
    }

    if (isNaN(calcScaleX) || isNaN(calcScaleY))
        return;

    if (this.fullTarget) {
        this.gameObject.width = targetSize.x / calcScaleX;
        this.gameObject.height = targetSize.y / calcScaleY;
    }
    if (this._forceUpdate ||
        this.gameObject.scaleX !== calcScaleX ||
        this.gameObject.scaleY !== calcScaleY) {
        this._forceUpdate = false;
        this.gameObject.scaleX = calcScaleX;
        this.gameObject.scaleY = calcScaleY;
    }
};

/**
 * @method onDestroy
 * @internal
 */
ScaleAdapter.prototype.onDestroy = function() {
    this.target = null;
};

/** 
 * @method getTargetSize
 * @returns {qc.Point}
 * @internal
 */
ScaleAdapter.prototype.getTargetSize = function() {
    var currTarget = this.target || this.gameObject.game.world;
    if (!currTarget || !currTarget.width || !currTarget.height)
        return new qc.Point(0, 0);
    return new qc.Point(currTarget.width, currTarget.height);
};

/**
 * @method getReferenceResolution
 * @protected
 */
ScaleAdapter.prototype.getReferenceResolution = function() {
    return this.referenceResolution;
};
