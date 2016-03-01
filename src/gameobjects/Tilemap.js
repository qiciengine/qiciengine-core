/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

var Tilemap = qc.Tilemap = function(game, parent, uuid) {
    qc.Node.call(this, new Phaser.Group(game.phaser, null), parent, uuid);

    // 初始化默认的名字
    this.name = 'Tilemap';

    // 缓存canvas，用于局部更新时使用，所有子TileLayer共享
    this._copyCanvas = Phaser.Canvas.create(1, 1);
    this._copyContext = this._copyCanvas.getContext('2d');
};

Tilemap.prototype = Object.create(qc.Node.prototype);
Tilemap.prototype.constructor = Tilemap;

Tilemap.prototype._data = null;
Tilemap.prototype._scrollX = 0;
Tilemap.prototype._scrollY = 0;
Tilemap.prototype._layers = 0;
Tilemap.prototype._tilesets = 0;

/**
 * 获取需要被序列化的信息描述
 */
Tilemap.prototype.getMeta = function() {
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加Tilemap需要序列化的内容
    json.data = Serializer.TEXTASSET;
    json.scrollX = Serializer.NUMBER;
    json.scrollY = Serializer.NUMBER;
    json.layers = Serializer.NODES;
    json.tilesets = Serializer.TEXTURES;

    return json;
};

Tilemap.prototype.generateLayers = function(callback) {
    var self = this;
    var data = self.data;
    if (data) {
        var game = self.game;
        var info = self._dataInfo;
        var json = info.json;
        var tilesets = json.tilesets;
        var items = [];
        for (var i = 0; i < tilesets.length; i++) {
            items.push({
                key: tilesets[i].name,
                url: info.prefix + tilesets[i].name + '.bin'
            });
        }
        // 加载图片资源
        game.assets.loadBatch(items, function() {
            // 保存图集数组
            var assetArray = [];
            for (var i = 0; i<items.length; i++) {
                assetArray.push(new qc.Texture(items[i].asset));
            }
            self.tilesets = assetArray;

            // 删除所有孩子
            self.removeChildren();
            // 生成图层对象
            var layerArray = [];
            for (var i = 0; i < json.layers.length; i++) {
                var layer = json.layers[i];
                if (layer.type === 'tilelayer') {
                    var tileLayer = new TileLayer(game, self);
                    tileLayer.name = layer.name;
                    tileLayer.tilemap = self;
                    tileLayer.layerIndex = i;
                    layerArray.push(tileLayer);
                }
                else if (layer.type === 'objectgroup') {
                    var objectLayer = new ObjectLayer(game, self);
                    objectLayer.name = layer.name;
                    objectLayer.tilemap = self;
                    objectLayer.layerIndex = i;
                    layerArray.push(objectLayer);
                }
            }
            // 保存图层数组
            self.layers = layerArray;
            if (callback) {
                callback();
            }
        });
    }
};

/**
 * 根据索引查找图层
 * @param index 图层索引
 * @returns {*}
 */
Tilemap.prototype.getLayerByIndex = function(index) {
    var layers = this._layers;
    if (layers && index >=0 && index < layers.length) {
        return layers[index];
    }
    return null;
};

/**
 * 根据名称查找图层
 * @param name 图层名称
 * @returns {*}
 */
Tilemap.prototype.getLayerByName = function(name) {
    var layers = this._layers;
    if (layers) {
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].name === name) {
                return layers[i];
            }
        }
    }
    return null;
};

/**
 * 获取图层JSON数据信息
 * @param index 图层所在索引
 * @param type 图层类型 tilelayer|objectgroup
 * @returns {*}
 * @private
 */
Tilemap.prototype._getLayerJson = function(index, type) {
    if (!this._dataInfo) {
        return;
    }
    var layers = this._dataInfo.json.layers;
    if (index >= 0 && index < layers.length) {
        var layer = layers[index];
        if (layer.type === type) {
            return layer;
        }
    }
    return null;
};

/**
 * 重置为地图大小
 */
Tilemap.prototype.resetNativeSize = function() {
    var nativeSize = this.nativeSize;
    if (nativeSize) {
        this.width = nativeSize.width;
        this.height = nativeSize.height;
    }
};

/**
 * 获取指定位置所在的格子位置
 * @param x
 * @param y
 * @return {qc.Point}
 */
Tilemap.prototype.getTilePosition = function(x, y) {
    return new qc.Point(
        Math.floor(x / this.tileWidth),
        Math.floor(y / this.tileHeight)
    );
};

Object.defineProperties(Tilemap.prototype, {

    /**
     * @property {qc.Rectangle} nativeSize - 地图实际大小
     * @readonly
     */
    nativeSize : {
        get : function() {
            var dataInfo = this._dataInfo;
            if (dataInfo) {
                return new qc.Rectangle(0, 0, dataInfo.map.widthInPixels, dataInfo.map.heightInPixels);
            }
            return null;
        }
    },

    /**
     * 图层数据
     */
    layers: {
        get: function() {
            return this._layers;
        },
        set: function(value) {
            this._layers = value;
        }
    },

    /**
     * 图集数组
     */
    tilesets: {
        get: function() {
            return this._tilesets;
        },
        set: function(value) {
            this._tilesets = value;
        }
    },

    /**
     * 水平滚动距离
     */
    scrollX: {
        get: function() {
            return this._scrollX;
        },
        set: function(value) {
            this._scrollX = value;
        }
    },

    /**
     * 垂直滚动距离
     */
    scrollY: {
        get: function() {
            return this._scrollY;
        },
        set: function(value) {
            this._scrollY = value;
        }
    },

    /**
     * @property {number} tileWidth - 格子的宽度
     * @readonly
     */
    tileWidth: {
        get: function() {
            return this._dataInfo.json.tilewidth;
        }
    },

    /**
     * @property {number} tileHeight - 格子的高度
     * @readonly
     */
    tileHeight: {
        get: function() {
            return this._dataInfo.json.tileheight;
        }
    },

    /**
     * @property {number} mapWidth - 地图X轴上的格子数
     * @readonly
     */
    mapWidth: {
        get: function() {
            return this._dataInfo.json.width;
        }
    },

    /**
     * @property {number} mapHeight - 地图Y轴上的格子数
     * @readonly
     */
    mapHeight: {
        get: function() {
            return this._dataInfo.json.height;
        }
    },

    data: {
        get: function() {
            return this._data;
        },
        set: function(data) {
            var self = this,
                game = self.game;
            var info = null;
            if (data) {
                if (!(data instanceof TextAsset)) {
                    return;
                }
                try {
                    var json = JSON.parse(data.text);
                    if (!json.layers || !json.tilesets) {
                        throw new Error('Invalid tilemap data format');
                    }
                    // 存储地图json数据到phaser缓存
                    game.phaser.load.tilemap(data.url, null, json, Phaser.Tilemap.TILED_JSON);
                    // 构建地图
                    var map = game.phaser.add.tilemap(data.url);
                    // 计算所有图集中最大小图尺寸
                    var maxTileWidth = 0;
                    var maxTileHeight = 0;
                    for (var i = 0; i < map.tilesets.length; i++) {
                        maxTileWidth = Math.max(maxTileWidth, map.tilesets[i].tileWidth);
                        maxTileHeight = Math.max(maxTileHeight, map.tilesets[i].tileHeight);
                    }
                    map.maxTileWidth = maxTileWidth;
                    map.maxTileHeight = maxTileHeight;

                    var index = data.url.lastIndexOf('/');
                    info = {
                        json: json,
                        map: map,
                        prefix: index >= 0 ? data.url.substring(0, index + 1) : ''
                    };
                }
                catch(ex) {
                    game.log.error('Asset{0}/{1} Parse fail', data.key, data.url, ex);
                    qc.Util.popupError(ex.message); 
                    return;
                }
            }
            self._data = data;
            self._dataInfo = info;
        }
    },

    /**
     * @property {string} class - 类名
     * @internal
     * @readonly
     */
    class : {
        get : function() { return 'qc.Tilemap'; }
    }
});