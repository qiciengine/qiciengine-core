/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

var ObjectLayer = qc.ObjectLayer = function(game, parent, uuid) {
    qc.Node.call(this, new Phaser.Group(game.phaser, null), parent, uuid);

    // 初始化默认的名字
    this.name = 'ObjectLayer';

    this.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
    this.setStretch(0, 0, 0, 0);
};

ObjectLayer.prototype = Object.create(qc.Node.prototype);
ObjectLayer.prototype.constructor = ObjectLayer;

ObjectLayer.prototype._tilemap = null;
ObjectLayer.prototype._layerIndex = -1;
ObjectLayer.prototype._scrollXRatio = 1;
ObjectLayer.prototype._scrollYRatio = 1;

/**
 * 获取需要被序列化的信息描述
 */
ObjectLayer.prototype.getMeta = function() {
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加TileLayer需要序列化的内容
    json.tilemap = Serializer.NODE;
    json.layerIndex = Serializer.INT;
    json.scrollXRatio = Serializer.NUMBER;
    json.scrollYRatio = Serializer.NUMBER;

    return json;
};


/**
 * 更新
 */
ObjectLayer.prototype.update = function() {
    if (this._tilemap && this._tilemap._destroy) {
        this._tilemap = null;
    }
    var tilemap = this._tilemap;

    if (tilemap) {
        this.x = tilemap.scrollX * this.scrollXRatio;
        this.y = tilemap.scrollY * this.scrollXRatio;
    }
};

Object.defineProperties(ObjectLayer.prototype, {

    tilemap: {
        get: function() {
            if (this._tilemap && this._tilemap._destroy) {
                this._tilemap = null;
            }
            return this._tilemap;
        },
        set: function(value) {
            if (value && !(value instanceof Tilemap)) {
                return;
            }
            this._tilemap = value;
        }
    },

    layerIndex: {
        get: function() {
            return this._layerIndex;
        },
        set: function(value) {
            this._layerIndex = value;
        }
    },

    /**
     * 水平滚动速率
     */
    scrollXRatio: {
        get: function() {
            return this._scrollXRatio;
        },
        set: function(value) {
            this._scrollXRatio = value;
        }
    },

    /**
     * 垂直滚动速率
     */
    scrollYRatio: {
        get: function() {
            return this._scrollYRatio;
        },
        set: function(value) {
            this._scrollYRatio = value;
        }
    },

    /**
     * @property {string} class - 类名
     * @internal
     * @readonly
     */
    class : {
        get : function() { return 'qc.ObjectLayer'; }
    }
});