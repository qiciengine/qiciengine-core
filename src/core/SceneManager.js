/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 多个场景的管理，提供了如下操作：
 * 1、场景的载入
 * 2、场景的配置
 * 3、场景的切换等
 *
 * @class qc.SceneManager
 * @constructor
 * @internal
 */
var SceneManager = qc.SceneManager = function(phaser) {
    phaser._qc = this;
    this.phaser = phaser;

    this._onPreload = new qc.Signal();
    this._onCreate = new qc.Signal();

    /**
     * @property {qc.Signal} onStartLoad - 场景开始加载的事件
     */
    this.onStartLoad = new qc.Signal();

    /**
     * @property {qc.Signal} onEndLoad - 场景加载完成的事件
     */
    this.onEndLoad = new qc.Signal();
};
SceneManager.prototype = {};
SceneManager.prototype.constructor = SceneManager;

Object.defineProperties(SceneManager.prototype, {
    /**
     * @property {qc.Game} game - 游戏实例的引用
     * @readonly
     */
    game : {
        get : function() { return this.phaser.game._qc; }
    },

    /**
     * @property {string} entry - 用户的入口场景
     */
    entry : {
        get : function()  { return this._entry; },
        set : function(v) { this._entry = v;    }
    },

    /**
     * @property {string[]} list - 用户的场景URL列表
     */
    list : {
        get : function()  { return this._list; },
        set : function(v) {
            this._list = v;

            // 构造场景对象并加入
            var self = this;
            for (var k in v) {
                var url = v[k];
                var state = {
                    preload : function() {
                        // 扔出事件
                        self._onPreload.dispatch();

                        // 加载依赖资源
                        var asset = self.game.assets.find(self.current + '.bin');
                        // 如果加载失败会导致asset为空
                        if (asset) {
                            for (var i in asset.dependences) {
                                var data = asset.dependences[i];
                                self.game.assets.loadByUUID(data.uuid, function(a) {
                                    if (!a)
                                    {
                                        self.game.log.important('场景的依赖资源({0})加载失败.', data.uuid);
                                        // 场景依赖资源加载失败，也通知加载进度
                                        if (typeof(self.game.loadingProcessCallback) == 'function')
                                        {
                                            // 预制中的资源不通加进度，整个预制加载成功通知一次即可
                                            self.game.loadingProcessCallback(data.key);
                                        }
                                    }
                                });
                            }
                        }
                    },
                    create : function() {
                        try {
                            // 解析场景的配置信息，并构建必要的对象
                            self._parse();
                        }
                        catch (e)
                        {
                            self.game.log.error('Parse scene fail：{0}', e);
                            qc.Util.popupError(e.message);
                        }

                        // 标记当前没有加载场景了
                        self.loading = false;

                        // 扔出场景加载完毕的事件
                        self._onCreate.dispatch();
                        self.onEndLoad.dispatch(state);
                    }
                };
                this.phaser.add(url, state, false);
            }
        }
    },

    /**
     * @property {boolean} loading - 当前是否正在加载场景中
     * @default false
     */
    loading : {
        get : function()  { return this._loading || false; },
        set : function(v) { this._loading = v;             }
    },

    /**
     * @property {string} current - 当前加载中或运行中的场景名称
     * @readonly
     */
    current : {
        get : function() { return this.phaser.current; }
    }
});

/**
 * 预加载场景的序列化文件
 *
 * @method qc.SceneManager#download
 * @param state {string|undefined} - 待加载的场景名称，如果没有指定默认加载入口场景
 * @param callback {undefined|function} - 加载完成后的回调
 */
SceneManager.prototype.download = function(state, callback) {
    state = state || this.entry;
    var url = state + '.bin';

    this.game.log.trace('Start downloading scene:{0}', state);
    this.game.assets.beginBatchLoad();
    this.game.assets.load(url, url, callback);
    this.game.assets.endBatchLoad();
};

/**
 * 切换场景
 *
 * @method qc.SceneManager#load
 * @param state {string|undefined} - 待切换的目标场景，如果没有指定默认加载入口场景
 * @param clear {boolean} - 是否把所有缓存的资源清理掉，默认为FALSE
 * @param preload {undefined|function} 场景加载回调
 * @param create {undefined|function} 场景创建回调
 */
SceneManager.prototype.load = function(state, clear, preload, create) {
    // 场景的切换应该是互斥的
    var self = this;
    if (self.loading) {
        console.warn('Cannot call when switching scene.');
        return;
    }

    state = state || self.entry;

    // 如果没有传入完整场景路径名，则默认从Assets/scene根目录下寻找
    if (!/\//.test(state))
        state = 'Assets/scene/' + state;

    if (self.list.indexOf(state) < 0) {
        self.game.log.error('Scene:{0} not exists', state);
        return;
    }

    self.loading = true;

    // 扔出事件
    self.onStartLoad.dispatch(state);

    // 清理下旧场景的节点
    self.clearWorld();

    if (clear !== true) clear = false;
    if (clear) self.game.assets.clear();

    // 同步下载场景的内容
    self.download(state, function(data) {
        // 关注下场景的切换事件
        if (typeof preload === "function")
            self._onPreload.addOnce(preload);
        if (typeof create === "function")
            self._onCreate.addOnce(create);

        // 通过phaser来启动场景
        self.phaser.start(state, false, clear);
    });
};

/**
 * 清理场景的内容
 * @param shutDown 默认为false，如果非shutDown则一般为切换场景时调用，切换场景时保留ignoreDestroy的图元
 */
SceneManager.prototype.clearWorld = function(shutDown) {
    var children = this.game.world.children.slice(0);
    children.forEach(function(child) {
        if (shutDown || !child.ignoreDestroy) {
            child.destroy();
        }
    });
};

/**
 * 析构整个场景，并回收相关的所有资源
 *
 * @method qc.SceneManager#destroy
 */
SceneManager.prototype.destroy = function() {
    this.entry = undefined;
    this.list = [];
    this.phaser.destroy();
};

/**
 * 反序列化场景信息
 * @private
 */
SceneManager.prototype._parse = function() {
    var key = this.current + '.bin';
    var asset = this.game.assets.find(key);
    // 如果资源加载失败asset会为空
    if (asset) {
        var json = asset.json.data;
        this.game.serializer.restoreState(json);
        this.game.world._prefab = key;
    }
    else {
        self.game.log.error('Can not find scene {0} from assets', state);
    }
};
