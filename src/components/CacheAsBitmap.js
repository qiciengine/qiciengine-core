/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 为节点提供缓存为图片功能，提升绘制效率
 * @class qc.CacheAsBitmap
 */
var CacheAsBitmap = defineBehaviour('qc.CacheAsBitmap', qc.Behaviour, function() {
    // 设置默认尺寸提供者
    this._boundsType = CacheAsBitmap.BOUNDS_SELF;

    // 设置默认的缓存方式
    this._cacheType = CacheAsBitmap.CACHE_FOR_SCREEN;

    // 缓存是否需要更新
    this._dirty = true;

    // 是否限制缓存区域大小
    this.boundsInScreen = false;

    // 编辑器模式下需要执行
    this.runInEditor = true;

    // 用来记录Bounds和rect的偏移
    this.offX = 0;
    this.offY = 0;
},{
    boundsType : qc.Serializer.NUMBER,
    cacheType : qc.Serializer.NUMBER,
    boundsInScreen : qc.Serializer.BOOLEAN
});

// 菜单上的显示
CacheAsBitmap.__menu = 'UI/CacheAsBitmap';

Object.defineProperties(CacheAsBitmap.prototype,{
    /**
     * @property {number} boundsType - 缓存的边界类型
     */
    boundsType: {
        get : function() { return this._boundsType; },
        set : function(value) {
            if (this._boundsType === value) {
                return;
            }
            this._boundsType = value;
            this.dirty = true;
        }
    },

    /**
     * @property {number} cacheType - 缓存的方式
     */
    cacheType: {
        get : function() { return this._cacheType; },
        set : function(value) {
            if (this._cacheType === value) {
                return;
            }
            this._cacheType = value;
            this.dirty = true;
        }
    },

    /**
     * @property {boolean} dirty - 缓存是否为脏，如果为脏，再绘制前会刷新缓存
     */
    dirty: {
        get: function() { return this._dirty; },
        set: function(value) {
            if (this._dirty === value) {
                return;
            }
            this._dirty = value;
        }
    }
});

/**
 * 初始化处理
 */
CacheAsBitmap.prototype.awake = function() {
    var self = this,
        o = self.gameObject;

    self.addListener(self.game.assets.webFontLoaded, self._setDirty, self);
    o.onRelayout.add(self._setDirty, self);
};

CacheAsBitmap.prototype._setDirty = function() {
    this.dirty = true;
};

/**
 * 启用时
 */
CacheAsBitmap.prototype.onEnable = function() {
    var self = this,
        gameObject = self.gameObject;
    if (gameObject._destroy) {
        return;
    }

    // 缓存不存在需要创建
    if (!self._cache) {
        self._cache = new qc.RenderTexture(100, 100, this.game.phaser.render, null, this.game.resolution);
        self._cacheSprite = new PIXI.Sprite(self._cache);
    }

    self.dirty = true;
    // 设置绘制代理
    self.gameObject.phaser.setDisplayProxy(self._cacheSprite, true);
    // 替换绘制函数
    if (!self._nodeRenderCanvas) {
        self._nodeRenderCanvas = self.gameObject.phaser._renderCanvas;
        self.gameObject.phaser._renderCanvas = self.renderCanvas.bind(self);
    }

    if (!self._nodeRenderWebGL) {
        self._nodeRenderWebGL = self.gameObject.phaser._renderWebGL;
        self.gameObject.phaser._renderWebGL = self.renderWebGL.bind(self);
    }
};

/**
 * 禁用时
 */
CacheAsBitmap.prototype.onDisable = function() {
    var self = this;
    self.gameObject.phaser.setDisplayProxy(null, false);
    self.gameObject._notifyCacheChanged(false);
    if (self._nodeRenderCanvas) {
        self.gameObject.phaser._renderCanvas = self._nodeRenderCanvas;
        self._nodeRenderCanvas = null;
    }
    if (self._nodeRenderWebGL) {
        self.gameObject.phaser._renderWebGL = self._nodeRenderWebGL;
        self._nodeRenderWebGL = null;
    }
};

/**
 * 销毁时
 */
CacheAsBitmap.prototype.onDestroy = function() {
    var self = this;
    self.gameObject._notifyCacheChanged(false);
    if (self._nodeRenderCanvas) {
        self.gameObject.phaser._renderCanvas = self._nodeRenderCanvas;
        self._nodeRenderCanvas = null;
    }
    if (self._nodeRenderWebGL) {
        self.gameObject.phaser._renderWebGL = self._nodeRenderWebGL;
        self._nodeRenderWebGL = null;
    }
    if (self._cache) {
        self._cache.destroy(true);
        self._cache = null;
    }
    if (self._cacheSprite) {
        self._cacheSprite = null;
    }

    // 干掉事件监听
    self.gameObject.onRelayout.remove(self._setDirty, self);
};

/**
 * 更新缓存
 * @private
 */
CacheAsBitmap.prototype._updateCache = function() {
    var self = this,
        cache = self._cache,
        sprite = self._cacheSprite;
    self._updatingCache = true;
    var bounds = null;
    if (this._cacheType !== CacheAsBitmap.CACHE_FOR_SCREEN)
        bounds = self._cacheBounds = self.getLocalBounds();
    else
        bounds = self._cacheBounds = self.getBounds();

    if (self.boundsInScreen) {
        // 限制范围为屏幕范围
        if (bounds.x < 0) {
            bounds.width += bounds.x;
            bounds.x = 0;
        }

        if (bounds.y < 0) {
            bounds.height += bounds.y;
            bounds.y = 0;
        }

        // 将宽高整数化
        bounds.width = Math.round(Math.max(1, Math.min(self.game.width * self.game.resolution - bounds.x, bounds.width)));
        bounds.height = Math.round(Math.max(1, Math.min(self.game.height * self.game.resolution - bounds.y, bounds.height)));
    }
    else {
        bounds.width = Math.round(bounds.width);
        bounds.height = Math.round(bounds.height);
    }

    // 这里将缓存的宽高修改为2的倍数，在部分机型的uc浏览器中，如果创建的canvas为奇数，会导致无法显示
    cache.resize(bounds.width + (bounds.width & 1), bounds.height + (bounds.height & 1), true);
    var wt = self.gameObject.worldTransform;
    if (this._cacheType !== CacheAsBitmap.CACHE_FOR_SCREEN) {
        var swt = sprite.worldTransform;
        swt.a = wt.a;
        swt.b = wt.b;
        swt.c = wt.c;
        swt.d = wt.d;
        swt.tx = wt.tx;
        swt.ty = wt.ty;

        PIXI.DisplayObject._tempMatrix.tx = -bounds.x;
        PIXI.DisplayObject._tempMatrix.ty = -bounds.y;

        cache.render(self.gameObject.phaser, PIXI.DisplayObject._tempMatrix, true);

        sprite.anchor.x = -( bounds.x / bounds.width );
        sprite.anchor.y = -( bounds.y / bounds.height );
    }
    else {
        self.offX = bounds.x - wt.tx;
        self.offY = bounds.y - wt.ty;
        sprite.anchor.x = 0;
        sprite.anchor.y = 0;
        CacheAsBitmap._tempMatrix.a = wt.a;
        CacheAsBitmap._tempMatrix.b = wt.b;
        CacheAsBitmap._tempMatrix.c = wt.c;
        CacheAsBitmap._tempMatrix.d = wt.d;
        CacheAsBitmap._tempMatrix.tx = Math.round(wt.tx - bounds.x);
        CacheAsBitmap._tempMatrix.ty = Math.round(wt.ty - bounds.y);

        cache.render( self.gameObject.phaser, CacheAsBitmap._tempMatrix, true);
        wt = sprite.worldTransform;
        wt.identity();
        wt.tx = bounds.x;
        wt.ty = bounds.y;
    }
    self._updatingCache = false;
    self.dirty = false;
    self.gameObject._isTransformDirty = true;
    sprite.displayChanged(qc.DisplayChangeStatus.TEXTURE | qc.DisplayChangeStatus.SIZE);
    self.gameObject.phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE | qc.DisplayChangeStatus.SIZE);
    // cache 的图片往屏幕上绘制的时候关闭 smooth 处理
    cache.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
};

/**
 * 检测是否需要重新缓存
 */
CacheAsBitmap.prototype.postUpdate = function() {
    var self = this,
        sprite = self._cacheSprite;
    if (self.dirty) {
        self.game.log.trace('[CacheAsBitmap]Update Cache.');
        self._updateCache();
    }
    else if (self._cacheType !== CacheAsBitmap.CACHE_FOR_SCREEN) {
        var swt = sprite.worldTransform,
            wt = self.gameObject.worldTransform;
        swt.a = wt.a;
        swt.b = wt.b;
        swt.c = wt.c;
        swt.d = wt.d;
        swt.tx = wt.tx;
        swt.ty = wt.ty;
    }
    else {
    	var gwt = self.gameObject.worldTransform;
        var wt = sprite.worldTransform;
        wt.identity();
        wt.tx = gwt.tx + self.offX;
        wt.ty = gwt.ty + self.offY;
    }
};

/**
 * 获取需要缓存的范围
 * @returns {*}
 */
CacheAsBitmap.prototype.getBounds = function() {
    var self = this;
    if (self.boundsType === CacheAsBitmap.BOUNDS_SELF) {
        return qc.Bounds.getBox(self.gameObject, qc.Bounds.USE_BOUNDS, true, 0);
    }
    else if (self.boundsType === CacheAsBitmap.BOUNDS_ALL) {
        return qc.Bounds.getBox(self.gameObject, qc.Bounds.USE_BOUNDS, true, -1);
    }
    else {
        return new qc.Rectangle(0, 0, 1, 1);
    }
};

/**
 * 获取需要缓存的本地范围
 * @returns {*}
 */
CacheAsBitmap.prototype.getLocalBounds = function() {
    var self = this;
    if (self.boundsType === CacheAsBitmap.BOUNDS_SELF) {
        return qc.Bounds.getBox(self.gameObject, qc.Bounds.USE_BOUNDS, true, 0, self.gameObject);
    }
    else if (self.boundsType === CacheAsBitmap.BOUNDS_ALL) {
        return qc.Bounds.getBox(self.gameObject, qc.Bounds.USE_BOUNDS, true, -1, self.gameObject);
    }
    else {
        return new qc.Rectangle(0, 0, 1, 1);
    }
};

/**
 * 在Canvas下的绘制
 * @param renderSession
 */
CacheAsBitmap.prototype.renderCanvas = function(renderSession) {
    var self = this,
        go = self.gameObject;
    if (go.phaser.visible === false || go.renderable === false)
        return;
    if (self._updatingCache && self._nodeRenderCanvas) {
        self.gameObject._notifyCacheChanged(true);
        self._nodeRenderCanvas.call(self.gameObject.phaser, renderSession);
        return;
    }
    self._cacheSprite.worldAlpha = self._cacheSprite.alpha = self.gameObject.phaser.worldAlpha;
    self._cacheSprite._renderCanvas(renderSession);
};

/**
 * 在WebGL下的绘制
 * @param renderSession
 */
CacheAsBitmap.prototype.renderWebGL = function(renderSession){
    var self = this,
        go = self.gameObject;
    if (go.phaser.visible === false || go.renderable === false)
        return;
    if (self._updatingCache && self._nodeRenderWebGL) {
        self.gameObject._notifyCacheChanged(true);
        self._nodeRenderWebGL.call(self.gameObject.phaser, renderSession);
        return;
    }
    self._cacheSprite.worldAlpha = self._cacheSprite.alpha = self.gameObject.phaser.worldAlpha;
    self._cacheSprite._renderWebGL(renderSession);
};

/**
 * 临时矩阵缓存
 * @type {PIXI.Matrix}
 * @private
 */
CacheAsBitmap._tempMatrix = new PIXI.Matrix();

/**
 * 拓展Node的属性
 */
Object.defineProperties(qc.Node.prototype, {

    /**
     * @property {boolean} cacheAsBitmap - 缓存为图片，一提升效率
     */
    cacheAsBitmap: {
        get: function()  {
            var cacheAsBitmap = this.getScript('qc.CacheAsBitmap');
            return cacheAsBitmap && cacheAsBitmap.enable;
        },
        set: function(v) {
            var cacheAsBitmap = this.getScript('qc.CacheAsBitmap');
            if (!v && !cacheAsBitmap) {
                return;
            }
            if (!cacheAsBitmap) {
                cacheAsBitmap = this.addScript('qc.CacheAsBitmap');
            }
            cacheAsBitmap.enable = v;
        }
    }
});

/**
 * 使用自己实际显示范围作为边框范围，进行缓存
 * @constant
 * @type {number}
 */
CacheAsBitmap.BOUNDS_SELF = 0;

/**
 * 使用自己和所有可显示子节点的实际显示范围作为边框范围，进行缓存
 * @constant
 * @type {number}
 */
CacheAsBitmap.BOUNDS_ALL = 1;

/**
 * 相对于屏幕进行缓存，当缓存节点中有文本显示时，建议使用此模式
 */
CacheAsBitmap.CACHE_FOR_SCREEN = 0;
/**
 * 相对于自身节点进行缓存，当自身进行缩放，旋转时，不用更新缓存
 */
CacheAsBitmap.CACHE_FOR_SELF = 1;
