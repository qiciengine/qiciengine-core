/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

var TileLayer = qc.TileLayer = function(game, parent, uuid) {
    var self = this;
    var phaserSprite = new Phaser.Sprite(game.phaser);
    qc.Node.call(self, phaserSprite, parent, uuid);

    // 初始化默认的名字
    self.name = 'TileLayer';

    // 缓存参数信息
    self._cache = {};

    // 更新Tile信息
    self._dirtyTiles = null;

    phaserSprite.canvas = Phaser.Canvas.create(1, 1);
    phaserSprite.context = phaserSprite.canvas.getContext('2d');
    phaserSprite.baseTexture = new PIXI.BaseTexture(phaserSprite.canvas);
    phaserSprite.texture = new PIXI.Texture(phaserSprite.baseTexture);

    self.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
    self.setStretch(0, 0, 0, 0);

    var oldRenderCanvas = phaserSprite._renderCanvas,
        oldRenderWebGL = phaserSprite._renderWebGL;

    phaserSprite._renderCanvas = function() {
        self._renderTiles();
        oldRenderCanvas.apply(phaserSprite, arguments);
    };  
    phaserSprite._renderWebGL = function() {
        self._renderTiles();
        oldRenderWebGL.apply(phaserSprite, arguments);
    };  
};

TileLayer.prototype = Object.create(qc.Node.prototype);
TileLayer.prototype.constructor = TileLayer;

TileLayer.prototype._tilemap = null;
TileLayer.prototype._layerIndex = -1;
TileLayer.prototype._scrollXRatio = 1;
TileLayer.prototype._scrollYRatio = 1;

/**
 * 获取需要被序列化的信息描述
 */
TileLayer.prototype.getMeta = function() {
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加TileLayer需要序列化的内容
    json.tilemap = Serializer.NODE;
    json.layerIndex = Serializer.INT;
    json.scrollXRatio = Serializer.NUMBER;
    json.scrollYRatio = Serializer.NUMBER;

    return json;
};


TileLayer.prototype.getTile = function(x, y) {
    var cache = this._cache;
    var tilemap = this.tilemap;
    if (!tilemap) {
        return undefined;
    }
    var phaserLayer = cache.phaserLayer;   
    // 如果还没缓存数据，或图层数据已经变化，则根据最新数据返回    
    if (!phaserLayer || 
        cache.tilemap !== tilemap ||
        cache.layerIndex !== this.layerIndex) {
        phaserLayer = null;
        var layerJson = tilemap._getLayerJson(this.layerIndex, 'tilelayer');
        if (layerJson) {
            var phaserMap = tilemap._dataInfo.map;
            var index = phaserMap.getLayerIndex(layerJson.name);
            if (index >= 0) {
                phaserLayer = phaserMap.layers[index];
            }
        }        
    }
    if (!phaserLayer || 
        !phaserLayer.data || 
        !phaserLayer.data[y]) {
        return undefined;        
    }
    return phaserLayer.data[y][x];
};

TileLayer.prototype.getTileIndex = function(x, y) {
    var tile = this.getTile(x, y);
    return tile ? tile.index : Infinity;
};

TileLayer.prototype.setTileIndex = function(x, y, index) {
    var tile = this.getTile(x, y);
    if (tile && tile.index !== index) {
        tile.index = index;
        if (!this._dirtyTiles) {
            this._dirtyTiles = {};
        }
        this._dirtyTiles[x + '|' + y] = { x: x, y: y };
    }    
};

// 强制要求全部重绘，如果通过setTileIndex更新较多，可要求一次性重新绘制
TileLayer.prototype.redrawAll = function() {
    this._redrawAllFlag = true;
};

/**
 * 更新绘制图层
 */
TileLayer.prototype._renderTiles = function() {
    var self = this;
    var tilemap = self.tilemap;

    // 未绑定地图不更新
    if (!tilemap) {
        return;
    }

    var cache = self._cache,
        phaser = self.phaser,
        phaserMap = tilemap._dataInfo.map;

    // 地图信息变化
    var redrawAll = self._checkTileLayerChange(phaserMap);

    // 没有对应图层信息不更新
    var phaserLayer = cache.phaserLayer;
    if (!phaserLayer) {
        return;
    }

    // 是否要求强制重刷
    if (self._redrawAllFlag) {
        redrawAll = true;
        self._redrawAllFlag = false;
    } 

    var context = phaser.context,
        phaserData = phaserLayer.data,
        width = Math.round(self.width),
        height = Math.round(self.height),
        scrollX = tilemap.scrollX,
        scrollY = tilemap.scrollY,
        scrollXRatio = self.scrollXRatio,
        scrollYRatio = self.scrollYRatio;

    // 尺寸发生变化
    redrawAll = self._checkSizeChange(width, height) || redrawAll;

    // 是否更新baseTexture
    var dirtyBaseTexture = false; 

    // 参数变化更新图层
    if (redrawAll ||
        cache.scrollX !== scrollX ||
        cache.scrollY !== scrollY ||
        cache.scrollXRatio !== scrollXRatio ||
        cache.scrollYRatio !== scrollYRatio) {

        var offsetX = Math.round(scrollX * scrollXRatio),
            offsetY = Math.round(scrollY * scrollYRatio),
            oldViewRect = cache.viewRect,
            viewRect = new Phaser.Rectangle(-offsetX, -offsetY, width, height);

        // 如果不是全部重绘，检测是否有缓存的内容可以复用
        if (!redrawAll) {
            var intersection = Phaser.Rectangle.intersection(oldViewRect, viewRect);
            if (intersection.width > 10 && intersection.height > 10) {                
                var x = intersection.x - oldViewRect.x;
                var y = intersection.y - oldViewRect.y;
                var w = intersection.width;
                var h = intersection.height;

                if (tilemap._copyCanvas.width !== width) tilemap._copyCanvas.width = width;
                if (tilemap._copyCanvas.height !== height) tilemap._copyCanvas.height = height;

                // 清除缓冲区
                tilemap._copyContext.clearRect(x, y, w, h);
                // 绘制相交区域到缓冲区
                tilemap._copyContext.drawImage(phaser.canvas, x, y, w, h, x, y, w, h);
            }
            else {
                // 相交区域太小或者无相交则全部重绘
                redrawAll = true;
            }
        }

        // 清除整个界面
        context.clearRect(0, 0, width, height);
        context.translate(offsetX, offsetY);
        
        // 全部刷新
        if (redrawAll) {
            // 全刷不需要考虑dirtyTile的局部更新
            self._dirtyTiles = null;        
            self._drawRect(context, phaserMap, phaserData, -offsetX, -offsetY, width, height);
        }
        // 局部刷新
        else {
            // 拷贝缓冲区相交部分内容到界面
            context.drawImage(tilemap._copyCanvas, x, y, w, h, intersection.x, intersection.y, w, h);

            // 相交区域左上角在界面
            if (viewRect.contains(oldViewRect.left, oldViewRect.top)) {
                self._drawRect(context, phaserMap, phaserData,
                    viewRect.x, viewRect.y, intersection.x - viewRect.x, viewRect.height);
                self._drawRect(context, phaserMap, phaserData,
                    intersection.x, viewRect.y, viewRect.right - intersection.x, intersection.y - viewRect.y);
            }
            // 相交区域右上角在界面
            else if (viewRect.contains(oldViewRect.right, oldViewRect.top)) {
                self._drawRect(context, phaserMap, phaserData,
                    viewRect.x, viewRect.y, intersection.right - viewRect.x, intersection.y - viewRect.y);
                self._drawRect(context, phaserMap, phaserData,
                    intersection.right, viewRect.y, viewRect.right - intersection.right, viewRect.height);
            }
            // 相交区域左下角在界面
            else if (viewRect.contains(oldViewRect.left, oldViewRect.bottom)) {
                self._drawRect(context, phaserMap, phaserData,
                    viewRect.x, viewRect.y, intersection.x - viewRect.x, viewRect.height);
                self._drawRect(context, phaserMap, phaserData,
                    intersection.x, intersection.bottom, viewRect.right - intersection.x, viewRect.bottom - intersection.bottom);
            }
            // 相交区域右下角在界面
            else if (viewRect.contains(oldViewRect.right, oldViewRect.bottom)) {
                self._drawRect(context, phaserMap, phaserData,
                    viewRect.x, intersection.bottom, intersection.right - viewRect.x, viewRect.bottom - intersection.bottom);
                self._drawRect(context, phaserMap, phaserData,
                    intersection.right, viewRect.y, viewRect.right - intersection.right, viewRect.height);
            }
        }

        context.translate(-offsetX, -offsetY);
        dirtyBaseTexture = true;

        cache.scrollX = scrollX;
        cache.scrollY = scrollY;
        cache.scrollXRatio = scrollXRatio;
        cache.scrollYRatio = scrollYRatio;
        cache.viewRect = viewRect;
    }

    // 重绘脏地块
    var dirtyTiles = self._renderDirtyTiles(context, phaserMap, phaserData);

    if (dirtyBaseTexture || dirtyTiles) {
        phaser.texture.baseTexture.dirty();
        phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE);
    }
};

// 重绘脏地块
TileLayer.prototype._renderDirtyTiles = function(context, phaserMap, phaserData) {
    var self = this,
        dirty = false;

    if (self._dirtyTiles) {
        // tiled编辑器的贴图块以左下角为基准往上和右延伸，
        // 所以需要考虑图集最大贴图大于tile大小的边界情况。
        var maxTileWidth = phaserMap.maxTileWidth,
            maxTileHeight = phaserMap.maxTileHeight,
            tw = phaserMap.tileWidth,
            th = phaserMap.tileHeight,
            rect = self._cache.viewRect,
            extraX = maxTileWidth > tw ? -maxTileWidth : 0,
            extraY = maxTileHeight > th ? maxTileHeight : 0,
            startX = Math.floor((rect.x + extraX) / tw),
            startY = Math.floor(rect.y / th),
            endX = Math.ceil((rect.x + rect.width) / tw),
            endY = Math.ceil((rect.y + rect.height + extraY) / th);

        context.translate(-rect.x, -rect.y);
        for (var key in self._dirtyTiles) {
            var dirtyTile = self._dirtyTiles[key],
                x = dirtyTile.x,
                y = dirtyTile.y;

            if (x >= startX && x <= endX && y >= startY && y <= endY) {   
                self._drawRect(context, phaserMap, phaserData, 
                    x * tw, 
                    y * th + th - maxTileHeight, 
                    maxTileWidth, 
                    maxTileHeight, 
                    true);  
                dirty = true;
            }            
        }
        context.translate(rect.x, rect.y);
        self._dirtyTiles = null;        
    } 
    return dirty;
};

// 检测TileLayer图层信息是否变化
TileLayer.prototype._checkTileLayerChange = function(phaserMap) {
    var cache = this._cache;
    var tilemap = this.tilemap;
    var layerIndex = this.layerIndex;

    if (cache.tilemap !== tilemap ||
        cache.layerIndex !== layerIndex) {
        cache.phaserLayer = null;
        var layerJson = tilemap._getLayerJson(layerIndex, 'tilelayer');
        if (layerJson) {
            var index = phaserMap.getLayerIndex(layerJson.name);
            if (index >= 0) {
                cache.phaserLayer = phaserMap.layers[index];
            }
        }
        // 保存地图信息
        cache.tilemap = tilemap;
        cache.layerIndex = layerIndex;

        return true;
    }
    return false;
};

// 检测TileLayer的尺寸是否变化
TileLayer.prototype._checkSizeChange = function(width, height) {
    var cache = this._cache;
    var phaser = this.phaser;
    var texture = phaser.texture;

    if (cache.width !== width ||
        cache.height !== height) {

        // 更新尺寸
        phaser.canvas.width = width;
        phaser.canvas.height = height;

        texture.frame.width = width;
        texture.frame.height = height;

        texture.width = width;
        texture.height = height;

        texture.crop.width = width;
        texture.crop.height = height;

        texture.baseTexture.width = width;
        texture.baseTexture.height = height;

        texture.baseTexture.dirty();

        // 保持尺寸
        cache.width = width;
        cache.height = height;

        return true;
    }
    return false;
};

// 在指定的矩形区域内绘制Tile块
TileLayer.prototype._drawRect = function(context, phaserMap, phaserData, x, y, width, height, clear) {
    if (!width || !height) {
        return;
    }

    if (clear) {
        context.clearRect(x, y, width, height);  
    }

    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();

    // tiled编辑器的贴图块以左下角为基准往上和右延伸，
    // 所以需要考虑图集最大贴图大于tile大小的边界情况。
    var maxTileWidth = phaserMap.maxTileWidth,
        maxTileHeight = phaserMap.maxTileHeight,
        tw = phaserMap.tileWidth,
        th = phaserMap.tileHeight,
        startX = Math.floor((maxTileWidth > tw ? x - maxTileWidth : x) / tw),
        startY = Math.floor(y / th),
        endX = Math.ceil((x + width) / tw),
        endY = Math.ceil((maxTileHeight > th ? y + height + maxTileHeight : y + height) / th);

    if (startX < 0) startX = 0;
    if (startY < 0) startY = 0;
    if (endX > phaserMap.width) endX = phaserMap.width;
    if (endY > phaserMap.height) endY = phaserMap.height;

    for (y = startY; y < endY; y++) {
        var rows = phaserData[y];
        for (x = startX; x < endX; x++) {
            this._drawTile(context, phaserMap, rows[x], x, y);
        }
    }

    context.restore();
};

// 绘制Tile单元块
TileLayer.prototype._drawTile = function(context, phaserMap, phaserTile, x, y) {
    // Phaser.Tile#index为gid信息，大于0才需要绘制
    var gid = phaserTile.index;
    if (gid <= 0) {
        return;
    }

    // [x, y, tilesetIndex]
    var tile = phaserMap.tiles[gid];
    var tileset = phaserMap.tilesets[tile[2]];
    var asset = tileset.asset;

    // 尝试获取对应图片资源
    if (asset === undefined) {
        var url = this.tilemap._dataInfo.prefix + tileset.name + '.bin';
        var ts = this.tilemap.tilesets;
        if (ts) {
            for (var i=0; i<ts.length; i++) {
                if (ts[i].url === url) {
                    asset = ts[i];
                    break;
                }
            }
        }
        if (!asset) {
            tileset.asset = null;
        }else {
            tileset.asset = asset;
        }
    }
    if (asset) {
        context.drawImage(
            asset.img,
            tile[0],
            tile[1],
            tileset.tileWidth,
            tileset.tileHeight,
            phaserTile.worldX,
            phaserTile.worldY + phaserMap.tileHeight - tileset.tileHeight,
            tileset.tileWidth,
            tileset.tileHeight
        );
    }
};


Object.defineProperties(TileLayer.prototype, {

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
        get : function() { return 'qc.TileLayer'; }
    }
});
