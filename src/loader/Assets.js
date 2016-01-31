/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 资源管理
 ** 在phaser底层，所有的资源key全部使用url
 * @class qc.Assets
 * @constructor
 * @internal
 */
var Assets = qc.Assets = function(game, loader, cache) {
    this._loader = loader;
    this._cache = cache;
    this.game = game;
    loader._qc = this;
    cache._qc = this;

    // 记录当前配置中的 uuid 与 url
    this._uuid2UrlConf = window.urlMapConfig || {};
    this._uuid2UrlConf['__builtin_resource__'] = '__builtin_resource__';

    /**
     * @property {number} maxRetryTimes - 资源下载失败时，最大重试次数
     */
    this.maxRetryTimes = 1;

    /**
     * @property {qc.Signal} webFontLoaded - web字体库加载完毕的回调
     */
    this.webFontLoaded = new qc.Signal();

    // 当前解析中的资源数量
    this._parsing = 0;

    // 使用一个互斥量来避免多次设置 Timer
    this._loaderTimerMutex = -1024;

    // 资源缓存，记录url与解析后的资源信息
    this._assets = {};

    // 记录key与url的映射关系
    this._keyUrl = {};

    // 注册加载成功的回调
    this._complete = {};

    var self = this;
    loader.onFileComplete.add(function(progress, key, success) {
        if (!success) {
            // 下载失败了，首先进行重试下载
            var assetsInfos = self._complete[key];
            if (!assetsInfos || assetsInfos.length === 0) return;

            if (assetsInfos[0].retry >= self.maxRetryTimes) {
                // 满额了
                self.game.log.important('Asset({0}) load fail', key);
                self._callCb(key, null, assetsInfos[0]);
                return;
            }

            // 延后继续重试
            self.game.timer.add(1000, function() {
                self.game.log.trace('Retry download:{0}', key);
                assetsInfos[0].retry++;
                self._internalLoad(assetsInfos[0]);
            });
            return;
        }
        self._parseAsset(key);
    });

    // 注册声音解码完成回调
    game.sound.phaser.onSoundDecode.add(function(key, data) {
        var asset = new qc.SoundAsset(data.key, data.url, self.game.phaser.cache.getSound(key), data.meta);
        game.assets.cache(data.key, data.url, asset);

        data.nextStep();
    });

    // 加载内置资源
    this._loadBuiltin();
};
Assets.prototype = {};
Assets.prototype.constructor = Assets;

// 资源类型定义
/**
 * 贴图类型
 * @constant
 * @type {number}
 */
Assets.IMAGE = 1;

/**
 * 声音文件
 * @constant
 * @type {number}
 */
Assets.AUDIO = 2;

/**
 * 文本
 * @constant
 * @type {number}
 */
Assets.TEXT = 3;

/**
 * 字体文件
 * @constant
 * @type {number}
 */
Assets.BITMAPFONT = 4;

/**
 * 二进制数据
 * @constant
 * @type {number}
 */
Assets.BINARY = 5;

/**
 * 图集(url格式描述 json hash)
 * @constant
 * @type {number}
 */
Assets.ATLAS = 6;

/**
 * json文本
 * @constant
 * @type {nubmer}
 */
Assets.JSON = 7;

// 属性定义
Object.defineProperties(Assets.prototype, {
    /**
     * @property {boolean} isLoading - 是否正在加载资源
     * @readonly
     */
    'isLoading' : {
        get : function() { return this._loader.isLoading; }
    },

    /**
     * @property {boolean} hasLoaded - 所有资源是否已经全部加载完成
     * @readonly
     */
    'hasLoaded' : {
        get : function() { return this._loader.hasLoaded; }
    },

    /**
     * @property {string} baseURL - 资源的域地址
     */
    'baseURL' : {
        get : function()  { return this._loader.baseURL; },
        set : function(v) { this._loader.baseURL = v;    }
    },

    /**
     * @property {boolean} parsing - 当前是不是有资源正在解析中
     * @internal
     */
    parsing : {
        get : function() {
            return this._parsing > 0;
        }
    },

    /**
     * @property {number} loaded - 已经加载完毕的资源数量
     * @readonly
     */
    loaded : {
        get : function() { return this._loader._loadedFileCount; }
    },

    /**
     * @property {number} total - 总的需要加载的资源量
     * @readonly
     */
    total : {
        get : function() { return this._loader._totalFileCount; }
    }
});

/**
 * 批量加载
 * @param items {array} - 资源信息数组
 * @param callback - 全部加载完毕的回调
 */
Assets.prototype.loadBatch = (function(){
    var loadItem = function(assets, item, items, callback) {
        item.loaded = false;
        assets.load(item.key, item.url, function(asset){
            item.loaded = true;
            item.asset = asset;
            // 单个回调
            if (item.callback) item.callback(item);
            // 检测是否都加载完毕
            for (var i = 0; i < items.length; i++) {
                if (!items[i].loaded) {
                    return;
                }
            }
            // 全部加载完毕，执行回调
            callback(items);
        }, item.override, item.isRaw);
    };
    return function(items, callback) {
        for (var i = 0; i < items.length; i++) {
            loadItem(this, items[i], items, callback);
        }
    };
})();

/**
 * 开始加载资源，assetInfo指明了详细的资源信息
 * @private
 */
Assets.prototype._internalLoad = function(assetInfo) {
    var self = this;

    // 初始化重试次数
    if (!assetInfo.retry) assetInfo.retry = 0;

    // 先看下是不是声音资源
    // 音乐文件置换为该设备可以播放的音乐 url
    assetInfo.isSound = AssetUtil.isSound(assetInfo.url);
    if (assetInfo.isSound)
        assetInfo.url = self.game.sound.tryGetUrl(assetInfo.url);
    var url = assetInfo.url;

    // 先从缓存中查找，有的话就直接返回了
    if (!assetInfo.override) {
        var asset = self.find(url);
        if (asset &&
        	(!asset.hasUnloadedDependence || !asset.hasUnloadedDependence(this.game))) {
            // 更新下URL映射
            self._keyUrl[assetInfo.key] = url;
            if (assetInfo.callback)
                assetInfo.callback(asset);
            return;
        }
    }

    // 没有就需要进行加载了

    if (assetInfo.key === '__builtin_resource__')
        // 内置资源，不需要进行加载，_complete 事件由 _loadBuiltin 中 _parseAssets 成功之后触发
        return;

    // 成功后需要回调通知
    var loader = self._loader;
    if (assetInfo.retry === 0) {
        if (!self._complete[url])
            self._complete[url] = [assetInfo];
        else
            self._complete[url].push(assetInfo);
    }

    // 加载需要区分3种：声音资源、原始资源和打包资源
    if (assetInfo.isSound) {
        if (url.indexOf('.bin') < 0)
            // 使用 audio tag 方式加载
            loader.audio(url, url);
        else if (AssetUtil.isSound(url))
            // 使用 web audio 方式加载
            loader.binary(url, url);
    }
    else {
        if (assetInfo.isRaw)
            loader.image(url, url);
        else
            loader.text(url, url);
    }
    self.start();
};

/**
 * 请求加载图片资源，加载成功后调用回调通知
 *
 * @param key {string|undefined} - 需要保证资源ID的唯一。不指定时使用url作为key
 * @param url {string} - 资源的地址（可选参数）
 * @param callback - 完成加载的回调
 * @param override - 是否无视是否已缓存强制加载（成功加载后覆盖资源）
 */
Assets.prototype.load = function() {
    var self = this;
    var key, url, callback, override = false, isRaw = false, inPrefab = false;
    if (arguments.length === 1) {
        // 原型为：load(url)
        url = arguments[0];
    }
    else if (arguments.length === 2) {
        if (typeof arguments[1] === 'string') {
            // 原型为：load(key, url)
            key = arguments[0];
            url = arguments[1];
        }
        else {
            // 原型为：load(url, callback)
            url = arguments[0];
            callback = arguments[1];
        }
    }
    else {
        // 原型为：load(key, url, callback, override)
        key = arguments[0];
        url = arguments[1];
        callback = arguments[2];
        override = arguments[3];
        isRaw = arguments[4];
        inPrefab = arguments[5];
    }
    key = key || url;

    if (!url) {
        throw new Error('url is empty.');
        return;
    }

    // 开始加载资源
    var assetInfo = {
        key: key,
        url: url,
        callback: callback,
        override: override,
        isRaw: isRaw,
        inPrefab: inPrefab,
    };

    // preload 时同步加载，之后阶段都错开1ms异步加载。
    // 这个问题最好的解决方案本应是干掉 Img 的缓存同步加载机制，但是我们不想hack进phaser代码。
    // 具体问题是：
    //    game.preload() { load(a); load(b); }
    //    game.create() { load(c); }
    //    在 preload 时候，加载了 a,b，并且判定成功加载，会设置 isLoading = false，然后
    //    切换到 create() 阶段，此时调度 load(c) 的结果是 c 进入到加载列表中。后续调度弹回到 a
    //    的加载尾端的时候，居然发现还有元素在加载列表，会尝试去加载，可这时候 isLoading = false
    //    不允许加载，进而 warning。
    if (! self.game.phaser.state._created)
        self._internalLoad(assetInfo);
    else {
        self.game.timer.add(1, function() {
            self._internalLoad(assetInfo);
        });
    }
};

/**
 * @param uuid
 * @param callback
 * @param override
 * @internal
 */
Assets.prototype.loadByUUID = function(uuid, callback, override, inPrefab) {
    var url = this._uuid2UrlConf[uuid];
    if (!url) {
        this.game.log.important('UUID({0}) not found.', uuid);
        if (callback) callback();
        return;
    }

    this.load(uuid, url, callback, override, false, inPrefab);
};

/**
 * @param key 资源ID，需要保证唯一
 * @param img 原始图片url地址或者 image对象
 */
Assets.prototype.loadTexture = function() {
    var key, url, img, callback;
    if (arguments.length === 1) {
        if (typeof arguments[0] === 'string') {
            // loadTexture(url)
            url = arguments[0];
        }
        else {
            // loadTexture(IMG)
            img = arguments[0];
        }
    }
    else if (arguments.length === 2) {
        if (typeof arguments[0] === 'string' && typeof arguments[1] === 'function') {
            // loadTexture(url, callback)
            url = arguments[0];
            callback = arguments[1];
        }
        else if (typeof arguments[1] === 'function') {
            // loadTexture(IMG, callback)
            img = arguments[0];
            callback = arguments[1];
        }
        else {
            // loadTexture(key, url)
            key = arguments[0];
            url = arguments[1];
        }
    }
    else if (typeof arguments[1] === 'string') {
        // loadTexture(key, url, callback)
        key = arguments[0];
        url = arguments[1];
        callback = arguments[2];
    }
    else {
        // loadTexture(key, img, callback)
        key = arguments[0];
        img = arguments[1];
        callback = arguments[2];
    }
    key = key || url;

    if (img) {
        // 已经加载完毕的图片
        if (!key) {
            throw new Error('key cannot be null.');
            return;
        }
        this._keyUrl[key] = key;
        var atlas = AssetUtil.addAtlasFromImage(this.game, key, key, img);
        callback(atlas);
    }
    else {
        // 走标准的加载流程，指明为raw
        this.load(key, url, callback, false, true);
    }
};

/**
 * 查找某个资源（如果资源尚未成功下载，返回null）
 * @method qc.Assets#find
 * @param key {string} - 资源的标识（可以传资源url进去）
 */
Assets.prototype.find = function(key) {
    if (AssetUtil.isSound(key))
        key = this.game.sound.tryGetUrl(key);

    if (qc.Util.isArray(key)) {
        for (var i = 0; i < key.length; i++) {
            var asset = this.find(key[i]);
            if (asset) return asset;
        }
    }
    else {
        var url = this._keyUrl[key];
        return url ? this._assets[url] : null;
    }
};

/**
 * 释放指定资源
 * @method qc.Assets#unload
 * @param asset {*} - 资源对象或者资源url或者资源的key
 */
Assets.prototype.unload = function(asset) {
    if (typeof asset === 'string' && !this._keyUrl[asset]) {
        // 对于声音，需要先转换下，因为url可能发生变化了
        var isSound = AssetUtil.isSound(asset);
        if (isSound)
            asset = this.game.sound.tryGetUrl(asset);
    }

    if (qc.Util.isArray(asset)) {
        for (var i = 0; i < asset.length; i++) {
            this.unload(asset[i]);
        }
    }
    else {
        if (typeof asset === 'string') {
            // 指明了key或者url
            var url = this._keyUrl[asset];
            if (url) {
                if (this._assets[url])
                    this._assets[url].unload(this.game);
                delete this._assets[url];
                delete this._keyUrl[asset];
            }
        }
        else {
            // 指明了资源类型
            this.unload(asset.url);
        }
    }
};

/**
 * 根据uuid查找资源
 * TODO: 如果遍历的效率比较低，需要考虑额外记录一份映射表
 * @method qc.Assets#findByUUID
 */
Assets.prototype.findByUUID = function(uuid) {
    for (var k in this._assets) {
        var asset = this._assets[k];
        if (asset.uuid === uuid)
            // 找到了
            return asset;
    }
};

/**
 * 缓存资源
 * @internal
 */
Assets.prototype.cache = function(key, url, asset) {
    key = key || url;
    this._assets[url] = asset;
    this._keyUrl[key] = url;
    this._keyUrl[url] = url; // 便于查找使用统一方式
};

/**
 * 清理缓存资源
 * @method qc.Assets#clear
 */
Assets.prototype.clear = function() {
    // 清理pixi的缓存
    var self = this;
    var keys = Object.keys(PIXI.TextureCache);
    keys.forEach(function(key) {
        if (key !== '__default' && key !== '__missing' && key !== '__builtin_resource__') {
            PIXI.TextureCache[key].destroy();
            delete PIXI.TextureCache[key];
        }
    });
    keys = Object.keys(PIXI.BaseTextureCache);
    keys.forEach(function(key) {
        if (key !== '__default' && key !== '__missing' && key !== '__builtin_resource__') {
            // 不要强制删除
            //PIXI.BaseTextureCache[key].destroy();
            delete PIXI.BaseTextureCache[key];
        }
    });

    // 清理phaser的缓存
    var builtin = self._cache._images['__builtin_resource__'];
    self._cache.destroy();
    self._cache._images['__builtin_resource__'] = builtin;

    // 干掉我自己的缓存
    keys = Object.keys(self._keyUrl);
    keys.forEach(function(key) {
        if (key !== '__builtin_resource__') delete self._keyUrl[key];
    });
    keys = Object.keys(self._assets);
    keys.forEach(function(key) {
        if (key !== '__builtin_resource__') delete self._assets[key];
    });
};

/**
 * 启动下载
 * @internal
 */
Assets.prototype.start = function() {
    // 使用 timer 而不是直接调用的原因是：
    // Image 加载的时候，如果浏览器开启了缓存，那么设置 Image.src 的时候，complete 属性瞬间
    //     为 true，就不会去走到 onload onerror 等异步回调中，变成同步就加载完毕，具体可以参见
    //     phaser.loader.loadImageTag。导致以下的情境：
    //     game.preload() { load(a); load(b); }
    //     game.create() { }
    //     在 preload 中 load(a) 的时候，立马就执行下载完毕的回调，此时 load(b) 还
    //     没执行，所以等待 加载池为空，进而触发状态切换到 create。
    //     故我们这里延迟 1ms 模拟异步的时序。
    var self = this;
    if (self.game.time.fixedTime - self._loaderTimerMutex < 1)
        // 已经处于加载中
        return;
    self._loaderTimerMutex = self.game.time.fixedTime;
    self.game.timer.add(1, function() {
        self._loaderTimerMutex = -1024;
        self._loader.start();
    });
};

/**
 * 注册一组新的 uuid -> url 的配置（编辑器更新）
 */
Assets.prototype.addUrlConf = function(uuid, url) {
    this._uuid2UrlConf[uuid] = url;
};

/**
 * 解析下载的二进制图片数据
 * @private
 */
Assets.prototype._parseAsset = function(key) {
    // 取得回调列表和资源信息
    var self = this, url = key;
    var assetInfos = self._complete[key];
    if (!assetInfos || assetInfos.length == 0) return;

    var nextStep = function() {
        // 资源解析完毕
        self._parsing--;

        // 如果是预制的话，需要等待依赖资源下载完毕后才能认为成功了
        // 场景也算预制，但其依赖资源在preload中再加载
        var asset = self.find(key);
        if (asset &&
            asset.meta.type !== AssetUtil.ASSET_SCENE &&
            asset.hasUnloadedDependence && asset.hasUnloadedDependence(self.game)) {
            // 加载依赖资源
            for (var i in asset.dependences) {
                var data = asset.dependences[i];
                var callback = function(data) {
                    var data = data;
                    return (function(a) {
                        if (!a)
                        {
                            self.game.log.important('预制的依赖资源({0})加载失败.', data.uuid);
                            // 资源加载失败，对应的 uuid 依赖也标识为 ok，免得会一直有依赖的资源没下载完毕
                            var info = asset.dependences[data.uuid];
                            if (info)
                                info.ok = true;
                        }


                        // 检查下是不是都加载完毕了
                        if (asset.hasUnloadedDependence(self.game)) return;

                        // 全部加载完毕，调用回调通知
                        self._callCb(key, asset, assetInfos[0]);
                    });
                }

                self.loadByUUID(data.uuid, callback(data), false, true);
            }
            return;
        }

        // 调用回调
        self._callCb(key, asset, assetInfos[0]);
    };

    self.nextStep = nextStep;
    // 解析数据，解析数据可能也是异步的，因此需要将后续处理作为回调传入
    self._parsing++;
    try {
        AssetUtil.parse(this.game, assetInfos[0], nextStep);
    }
    catch (e) {
        // 无法解析，认为资源加载失败了
        self._parsing--;
        self.game.log.error('Asset({0}) Parse fail', key, e);
        qc.Util.popupError(e.message);
        self._callCb(key, null, assetInfos[0]);
    }
};

/**
 * 资源加载完毕的回调
 * @param key
 * @param asset
 * @private
 */
Assets.prototype._callCb = function(key, asset, assetInfo) {
    var self = this;
    var assetsInfos = self._complete[key];
    if (!assetsInfos) return;
    delete self._complete[key];

    assetsInfos.forEach(function(assetsInfo) {
        if (asset) {
            // 记录下KEY与URL的映射
            self._keyUrl[assetsInfo.key] = assetsInfo.url;
        }

        // 某个资源加载完毕(成功或失败)，通知 loading 进度
        if (self.game.loadingProcessCallback)
        {
            if (!assetsInfo.inPrefab)
                // 预制中的资源不通知进度，整个预制加载成功通知一次即可
                self.game.loadingProcessCallback(key, asset, assetsInfo);
        }

        if (assetsInfo.callback)
            assetsInfo.callback(asset);
    });
};

/**
 * 加载内置资源
 * @private
 */
Assets.prototype._loadBuiltin = function() {
    var self = this;
    var key = '__builtin_resource__';
    var imgData = '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';
    var meta = {
        ver: 1,
        uuid: key,
        padding: {
            "button.png": [8,8,8,8],
            "button2.png": [8,8,8,8],
            "slider.png": [8,8,8,8],
            "sliderbg.png": [8,7,8,7],
            "sliderbg2.png": [10,6,2,6]
        }
    };
    var json = JSON.parse('{"frames":{"button.png":{"frame":{"x":30,"y":67,"w":26,"h":23},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":26,"h":23},"sourceSize":{"w":26,"h":23}},"button2.png":{"frame":{"x":2,"y":59,"w":26,"h":23},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":26,"h":23},"sourceSize":{"w":26,"h":23}},"circle.png":{"frame":{"x":2,"y":2,"w":37,"h":37},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":37,"h":37},"sourceSize":{"w":37,"h":37}},"empty.png":{"frame":{"x":41,"y":18,"w":16,"h":16},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":16,"h":16},"sourceSize":{"w":16,"h":16}},"ok.png":{"frame":{"x":2,"y":84,"w":25,"h":22},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":25,"h":22},"sourceSize":{"w":25,"h":22}},"slider.png":{"frame":{"x":34,"y":41,"w":28,"h":24},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":28,"h":24},"sourceSize":{"w":28,"h":24}},"sliderbg.png":{"frame":{"x":2,"y":41,"w":30,"h":16},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":30,"h":16},"sourceSize":{"w":30,"h":16}},"sliderbg2.png":{"frame":{"x":41,"y":2,"w":19,"h":14},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":19,"h":14},"sourceSize":{"w":19,"h":14}}},"meta":{"app":"http://www.codeandweb.com/texturepacker","version":"1.0","image":"__builtin_resource__.png","format":"RGBA8888","size":{"w":64,"h":128},"scale":"1"}}');
    self._parsing++;
    AssetUtil._parseAtlas(this.game, meta, json, imgData, undefined,
        meta.uuid, key, function() {
            self._parsing--;
            self._callCb(key, self.find(key));
        });
};
