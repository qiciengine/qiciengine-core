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

    // 记录 bin 资源与其资源数的映射
    this.assetCountMap = window.assetCountMap || {};

    // 批量加载的资源总数
    this.batchTotalCount = 0;

    // 批量加载已加载的资源数
    this.batchCurCount = 0;

    // 批量加载的标识
    this.batchLoadFlag = false;

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
        var soundContent = self.game.phaser.cache.getSound(key);
        if (soundContent && soundContent.decoded) {
            var asset = new qc.SoundAsset(data.key, data.url, soundContent, data.meta);
            game.assets.cache(data.key, data.url, asset);
        }

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
        get : function() {
            return this.batchCurCount ? this.batchCurCount : this._loader._loadedFileCount; }
    },

    /**
     * @property {number} total - 总的需要加载的资源量
     * @readonly
     */
    total : {
        get : function() {
            return this.batchTotalCount ? this.batchTotalCount : this._loader._totalFileCount; }
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
        this.beginBatchLoad();
        for (var i = 0; i < items.length; i++) {
            loadItem(this, items[i], items, callback);
        }
        this.endBatchLoad();
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

            if (assetInfo.key !== '__builtin_resource__' &&
                self.batchTotalCount && self.batchCurCount < self.batchTotalCount)
            {
                // 批量加载中，累加已加载的资源数
                if (!assetInfo.inPrefab)
                {
                    self.batchCurCount += 1;
                    self.game.log.trace('Asset {0} load from cache: {1} / {2}', url, self.batchCurCount, self.batchTotalCount);
                }
            }

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

    if (self.batchLoadFlag && key !== '__builtin_resource__')
    {
        // 如果在批量加载中，则累加批量加载的资源总数
        var assetCount = self.assetCountMap[url] || 1;
        self.batchTotalCount += assetCount;
    }
    else if (!self.batchLoadFlag && key !== '__builtin_resource__')
    {
        // 非批量加载，直接调用 load，则判断是否还有批量加载的资源未加载，没有的话，将批量下载计数清零
        if (self.batchTotalCount && self.batchCurCount >= self.batchTotalCount)
            self.batchTotalCount = self.batchCurCount = 0;
    }

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

// 开始批量下载，与 endBatchLoad 配对使用，用于累加 load 的资源总数
Assets.prototype.beginBatchLoad = function() {
    this.batchLoadFlag = true;
    this.batchTotalCount = 0;
    this.batchCurCount = 0;
}

// 结束批量下载，与 beginBatchLoad 配对使用
Assets.prototype.endBatchLoad = function() {
    this.batchLoadFlag = false;
}

/**
 * @param uuid
 * @param callback
 * @param override
 * @internal
 */
Assets.prototype.loadByUUID = function(uuid, callback, override, inPrefab) {
    var self = this;
    var url = this._uuid2UrlConf[uuid];
    if (!url) {
        this.game.log.important('UUID({0}) not found.', uuid);

        if (self.batchTotalCount && self.batchCurCount < self.batchTotalCount)
        {
            // 批量加载中，累加已加载的资源数
            if (!inPrefab)
            {
                self.batchCurCount += 1;
                self.game.log.trace('Asset {0} load failed: {1} / {2}', uuid, self.batchCurCount, self.batchTotalCount);
            }
        }
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
    var self = this;
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
        self._keyUrl[key] = key;
        var atlas = AssetUtil.addAtlasFromImage(self.game, key, key, img);

        if (self.batchTotalCount && self.batchCurCount < self.batchTotalCount)
        {
            // 批量加载中，累加已加载的资源数
            self.batchCurCount += 1;
            self.game.log.trace('Asset {0} loaded: {1} / {2}', key, self.batchCurCount, self.batchTotalCount);
        }
        callback(atlas);
    }
    else {
        // 走标准的加载流程，指明为raw
        self.load(key, url, callback, false, true);
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
                if (this._assets[url] && this._assets[url].unload)
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

        if (self.batchTotalCount && self.batchCurCount < self.batchTotalCount)
        {
            // 批量加载中，累加已加载的资源数
            if (!assetsInfo.inPrefab)
            {
                self.batchCurCount += 1;
                if (asset)
                    self.game.log.trace('Asset {0} loaded: {1} / {2}', key, self.batchCurCount, self.batchTotalCount);
                else
                    self.game.log.trace('Asset {0} load failed: {1} / {2}', key, self.batchCurCount, self.batchTotalCount);
            }
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
            "button.png":[10,9,10,9],
            "button2.png":[10,9,10,9],
            "slider.png":[12,10,12,10],
            "sliderbg.png":[13,7,13,7],
            "sliderbg2.png":[14,0,0,0]
        }
    };
    var json = JSON.parse('{"frames":{"circle.png":{"frame":{"x":1,"y":1,"w":37,"h":37},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":37,"h":37},"sourceSize":{"w":37,"h":37}},"sliderbg.png":{"frame":{"x":1,"y":41,"w":30,"h":16},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":30,"h":16},"sourceSize":{"w":30,"h":16}},"slider.png":{"frame":{"x":41,"y":1,"w":28,"h":24},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":28,"h":24},"sourceSize":{"w":28,"h":24}},"button.png":{"frame":{"x":41,"y":28,"w":26,"h":23},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":26,"h":23},"sourceSize":{"w":26,"h":23}},"button2.png":{"frame":{"x":72,"y":1,"w":26,"h":23},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":26,"h":23},"sourceSize":{"w":26,"h":23}},"ok.png":{"frame":{"x":72,"y":27,"w":25,"h":22},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":25,"h":22},"sourceSize":{"w":25,"h":22}},"sliderbg2.png":{"frame":{"x":101,"y":1,"w":19,"h":14},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":19,"h":14},"sourceSize":{"w":19,"h":14}},"empty.png":{"frame":{"x":101,"y":18,"w":16,"h":16},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":16,"h":16},"sourceSize":{"w":16,"h":16}},"arrow.png":{"frame":{"x":101,"y":37,"w":12,"h":7},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":12,"h":7},"sourceSize":{"w":12,"h":7}}},"meta":{"app":"QCEngine","version":"1.0","image":"__builtin_resource__","format":"RGBA8888","size":{"w":128,"h":64},"scale":"1"}}');
    self._parsing++;
    AssetUtil._parseAtlas(this.game, meta, json, imgData, undefined,
        meta.uuid, key, function() {
            self._parsing--;
            self._callCb(key, self.find(key));
        });
};
