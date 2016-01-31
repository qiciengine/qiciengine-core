/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * This is where the magic happens. The Game object is the heart of your game,
 * providing quick access to common functions and handling the boot process.
 *
 * "Hell, there are no rules here - we're trying to accomplish something."
 *                                                       Thomas A. Edison
 *
 * @class Phaser.Game
 * @constructor
 * @param {number|string} [width=800] - The width of your game in game pixels. If given as a string the value must be between 0 and 100 and will be used as the percentage width of the parent container, or the browser window if no parent is given.
 * @param {number|string} [height=600] - The height of your game in game pixels. If given as a string the value must be between 0 and 100 and will be used as the percentage height of the parent container, or the browser window if no parent is given.
 * @param {string|HTMLElement} [parent=''] - The DOM element into which this games canvas will be injected. Either a DOM ID (string) or the element itself.
 * @param {object} [state=null] - The default state object. A object consisting of Phaser.State functions (preload, create, update, render) or null.
 * @param {boolean} [transparent=false] - Use a transparent canvas background or not.
 * @param {boolean} [antialias=true] - Draw all image textures anti-aliased or not. The default is for smooth textures, but disable if your game features pixel art.
 * @param {object} [physicsConfig=null] - A physics configuration object to pass to the Physics world on creation.
 */
var Game = qc.Game = function(width, height, parent, state, transparent, editor, debug, physicsConfig) {
    var self = this;

    /**
     * @property {qc.Signal} onStart - 游戏启动成功的事件
     */
    self.onStart = new qc.Signal();

    /**
     * @property {qc.Log} log - 日志系统
     * @readonly
     */
    self.log = new qc.Log(self);

    // 调试组件
    self._debug = new qc.Debug(self);

    // 设备组件
    self._device = new qc.Device(self, Phaser.Device);

    var config;
    if (typeof arguments[0] === 'object' && arguments.length === 1) {
        // 第一个参数为配置对象
        config = arguments[0];
    }
    else {
        config = {
            width: width,
            height: height,
            parent: parent,
            state: state,
            transparent: transparent,
            physicsConfig: physicsConfig
        };
    }

    self.debug.on = config.debug;
    self.device.editor = config.editor;

    // 设置固定游戏大小参数
    if (config.width > 0 && config.height > 0) {
        self.fixedGameSize = {
            width: config.width,
            height: config.height
        };
    }
    else {
        self.fixedGameSize = null;
    }

    // 配置远程日志服务器地址，配置该地址，log 接口会将日志发送到远程日志服务器
    self.remoteLogUrl = config.remoteLogUrl;

    // 附加自己的帧调度等逻辑
    state = config.state;
    state = state || {
        preload : function() {},
        create  : function() {}
    };

    var oldInit = state.init;
    state.init = function() {
        var phaser = self.phaser;

        // 将各组件附加进来
        self._nodePool = new qc.NodePool(self);
        new qc.SceneManager(phaser.state);
        new qc.PluginManager(phaser.plugins);
        phaser.math._qc = new qc.Math(phaser.rnd);
        self.timer = new qc.Timer(self);
        self.time = new qc.Time(self);
        self.sound = new qc.SoundManager(self);
        self._assets = new qc.Assets(self, phaser.load, phaser.cache);
        new qc.Stage(phaser.stage);
        new qc.Camera(phaser.camera);
        new qc.World(phaser.world);
        new qc.Input(phaser.input);
        self.dirtyRectangle = new qc.DirtyRectangle(phaser);
        phaser.renderer.dirtyRectangle = self.dirtyRectangle;

        self.dirtyRectangle.enable = config.dirtyRectangles;
        self.dirtyRectangle.showDirtyRegion = config.dirtyRectanglesShow;

        // 设置canvas的边框为0，否则input设置focus时不同浏览器有不同的焦点效果
        self.canvas.style.outline = 0;
        // 设置透明，否则在input.touch.capture为false的情况下点击界面会高亮
        self.container.style.setProperty("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)", null);

        // 初始化 DragonBones 组件
        self.plugins.add(qc.dragonBonesDriver);

        // PIXI renderer spriteBatch 引用导致内存泄漏，用插件方式修复之
        self.plugins.add(qc.CleanPIXISpriteRetainer);

        // TODO: 其他组件

        // 序列化支持
        self._serializer = new qc.Serializer(self);

        // 本地存储
        self._storage = new qc.Storage(self);

        // 设置居中显示，canvas会居于parent的中间
        self.phaser.scale.pageAlignHorizontally = true;
        self.phaser.scale.pageAlignVertically = true;
        self.phaser.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;        

        // 横竖屏检测
        self.phaser.scale.onSizeChange.add(function() {
            // 检查当前的横竖屏
            self.device.resetOrientation();
        });
        self.device.resetOrientation();

        // 开启 poll 交互指令的调试功能
        self._debug.remoteLogUrl = config.remoteLogUrl;

        // 调用用户自定义的的初始化
        if (oldInit) {
            oldInit.call(state);
        }

        if (window.qc.initGame) window.qc.initGame(self);

        // 游戏加载成功了
        self.onStart.dispatch();
    };

    config.state = state;
    
    // Use WebGL renderer default
    config.renderer = config.renderer == null ? Phaser.AUTO : config.renderer;

    // WEBGL 默认打开抗锯齿功能, CANVAS 默认关闭抗锯齿
    if (!('antialias' in config)) {
        var antialias;
        switch (config.renderer) {
        case Phaser.HEADLESS:
        case Phaser.CANVAS:   antialias = false; break;
        case Phaser.AUTO:
            var webGLSupport = (function () {
                try {
                    var canvas = document.createElement('canvas');
                    canvas.screencanvas = false;
                    return !!window.WebGLRenderingContext && (canvas.getContext('webgl' )|| canvas.getContext('experimental-webgl'));
                }
                catch(e) {
                    return false;
                }})();
            antialias = (webGLSupport ? true : false);
        default: antialias = true; break;
        }
        config.antialias = antialias;
    }

    // 默认关闭失去焦点不运行功能，外部让用户配置采用runInBackground变量容易理解
    config.disableVisibilityChange = config.runInBackground;
    config.disableVisibilityChange = config.disableVisibilityChange == null ? true : config.disableVisibilityChange;

    if (!config.resolution) {
        var ratio = window.devicePixelRatio;
        if (self.device.desktop || self.fixedGameSize)
            // desktop环境或指定了游戏大小情况下，直接采用当前的 devicePixelRatio
            config.resolution = ratio;
        else
            // mobile 环境，默认使用 1 + (ratio - 1) / 4 的方案优先保证流畅（最少有 1）
            config.resolution = 1 + Math.max(0, (ratio - 1) / 4);
    }

    // 默认背景色
    var backgroundColor = config.backgroundColor;
    if(backgroundColor == null) {
        backgroundColor = Color.background; // 默认背景色
    }
    if (backgroundColor instanceof Color) {
        backgroundColor = backgroundColor.toNumber();
    }
    config.backgroundColor = backgroundColor;

    self.phaser = new Phaser.Game(config);
    self.phaser._qc = this;
    this.phaser._calcTransformCount = 0;
    self.phaser.forceSingleUpdate = true;

    // 快捷创建node 并添加到父亲上
    self.add = new GameObjectFactory(self);
};

Object.defineProperties(Game.prototype, {
    /**
     * @property {Number} id - 游戏ID
     * @readonly
     */
   'id' : {
       get : function() { return this.phaser.id; }
    },

    /**
     * @property {object} config - 游戏的配置信息
     */
    'config' : {
        get : function()  { return this.phaser.config; },
        set : function(v) { this.phaser.config = v;    }
    },

    /**
     * @property {object} physicsConfig - 游戏的物理配置
     */
    'physicsConfig' : {
        get : function()  { return this.phaser.physicsConfig; },
        set : function(v) { this.phaser.physicsConfig = v;    }
    },

    /**
     * @property {string|HTMLElement} parent - The Games DOM parent.
     * @readonly
     * @default ''
     */
    'parent' : {
        get : function() { return this.phaser.parent; }
    },

    /**
     * @property {integer} width - 当前游戏世界的宽度（单位：像素）
     * @readonly
     * @default 800
     */
    'width' : {
        get : function() { return this.phaser.width; }
    },

    /**
     * @property {integer} height - 当前游戏世界的高度（单位：像素）
     * @readonly
     * @default 600
     */
    'height' : {
        get : function() { return this.phaser.height; }
    },

    /**
     * @property {integer} resolution - 当前游戏的分辨率
     * @readonly
     * @default 1
     */
    'resolution' : {
        get : function()  { return this.phaser.resolution; }
    },

    /**
     * @property {boolean} transparent - 当前游戏画布的背景是不是透明
     * @default false
     */
    'transparent' : {
        get : function()  { return this.phaser.renderer.transparent; },
        set : function(v) { this.phaser.renderer.transparent = v;    }
    },

    /**
     * @property {boolean} antialias - 抗锯齿是否打开
     */
    'antialias' : {
        get : function() { return this.phaser.antialias; },
        set : function(v) {
            var phaser = this.phaser;
            if (phaser.antialias === v) return;
            phaser.antialias = v;

            phaser.stage.smoothed = v;
            for (var k in PIXI.BaseTextureCache) {
                PIXI.BaseTextureCache[k].scaleMode = v ? PIXI.scaleModes.LINEAR : PIXI.scaleModes.NEAREST;
                if (this.phaser.renderType === Phaser.WEBGL)
                    PIXI.BaseTextureCache[k].dirty();
            }
            this.dirtyRectangle.forceDirty = true;
        }
    },

    /**
     * @property {boolean} isBooted - 游戏是否已经启动
     * @readonly
     */
    'isBooted' : {
        get : function() { return this.phaser.isBooted; }
    },

    /**
     * @property {boolean} isRunning - 当前游戏是不是处于运行状态中
     * @readonly
     */
    'isRunning' : {
        get : function() { return this.phaser.isRunning; }
    },

    /**
     * @property {qc.Camera} camera - 对应的渲染相机
     * @readonly
     */
    'camera' : {
        get : function() { return this.phaser.camera._qc; }
    },

    /**
     * @property {HTMLCanvasElement} canvas - A handy reference to renderer.view, the canvas that the game is being rendered in to.
     * @readonly
     */
    'canvas' : {
        get : function() { return this.phaser.canvas; }
    },

    /**
     * @property {qc.Signal} onPause - 游戏暂停时抛出的事件
     * @readonly
     */
    'onPause' : {
        get : function() { return this.phaser.onPause; }
    },

    /**
     * @property {qc.Signal} onResume - 游戏从暂停回来时抛出的事件
     * @readonly
     */
    'onResume' : {
        get : function() { return this.phaser.onResume; }
    },

    /**
     * @property {qc.Signal} onBlur - 游戏失去焦点时抛出的事件
     * @readonly
     */
    'onBlur' : {
        get : function() { return this.phaser.onBlur; }
    },

    /**
     * @property {qc.Signal} onFocus - 游戏获取焦点时抛出的事件
     * @readonly
     */
    'onFocus' : {
        get : function() { return this.phaser.onFocus; }
    },

    /**
     * @property {qc.SceneManager} state - use 'scene' instead.
     * @obsolete
     * @readonly
     */
    'state' : {
        get : function() { return this.phaser.state._qc; }
    },

    /**
     * @property {qc.SceneManager} state
     * @readonly
     */
    'scene' : {
        get : function() { return this.phaser.state._qc; }
    },

    /**
     * @property {qc.Stage} stage - 舞台
     * @readonly
     */
    'stage' : {
        get : function() { return this.phaser.stage._qc; }
    },

    /**
     * @property {dom} container - 最外层的dom容器
     * @readonly
     */
    container: {
        get: function() {
            return this.phaser.canvas.parentNode;
        }
    },

    /**
     * @property {qc.Input} input - 交互管理
     * @readonly
     */
    'input' : {
        get : function() { return this.phaser.input._qc; }
    },

    /**
     * @property {qc.PluginManager} plugins - 插件管理
     * @readonly
     */
    'plugins' : {
        get : function() { return this.phaser.plugins._qc; }
    },

    /**
     * @property {qc.Math} math - 数学运算库
     * @readonly
     */
    'math' : {
        get : function() { return this.phaser.math._qc; }
    },

    /**
     * @property {qc.Assets} assets - 资源管理
     * @readonly
     */
    'assets' : {
        get : function() { return this._assets; }
    },

    /**
     * @property {qc.World} world
     * @readonly
     */
    'world' : {
        get : function() {
            if (!this.phaser.world) return null;
            return this.phaser.world._qc;
        }
    },

    /**
     * @property {qc.Serializer} serializer
     * @readonly
     */
    'serializer' : {
        get : function() { return this._serializer; }
    },

    /**
     * @property {qc.NodePool} nodePool
     * @readonly
     * @internal
     */
    'nodePool' : {
        get : function() { return this._nodePool; }
    },

    /**
     * @property {qc.Storage} storage - 本地存储
     * @readonly
     */
    storage : {
        get : function() { return this._storage; }
    },

    /**
     * @property {boolean} paused - 游戏是否暂停
     */
    paused : {
        get : function()  { return this.phaser.paused; },
        set : function(v) {
            this.phaser.paused = v;
        }
    },

    /**
     * @property {number} stepCount - When stepping is enabled this contains the current step cycle.
     * @readonly
     */
    stepCount: {
        get: function() { return this.phaser.stepCount; }
    },

    /**
     * @property {boolean} stepping - Enable core loop stepping with Game.enableStep().
     * @readonly
     */
    stepping: {
        get: function() { return this.phaser.stepping; }
    },

    /**
     * @property {qc.Device} device - 设备组件
     * @readonly
     */
    device: {
        get: function() { return this._device; }
    },

    /**
     * @property {qc.Debug} debug - 调试组件
     * @readonly
     */
    debug: {
        get: function() { return this._debug; }
    }

    // TODO: 其他组件
});

/**
 * 关闭游戏
 * @method qc.Game@shutdown
 */
Game.prototype.shutdown = function() {
    this.input.enable = false;
    this.state.clearWorld(true);
    this.assets.clear();
    this.phaser.destroy();
};

/**
 * Enable core game loop stepping. When enabled you must call game.step() directly (perhaps via a DOM button?)
 * Calling step will advance the game loop by one frame. This is extremely useful for hard to track down errors!
 */
Game.prototype.enableStep = function () {
    this.phaser.enableStep();
};

/**
 * Disables core game loop stepping.
 */
Game.prototype.disableStep = function () {
    this.phaser.disableStep();
};

/**
 * When stepping is enabled you must call this function directly (perhaps via a DOM button?) to advance the game loop by one frame.
 * This is extremely useful to hard to track down errors! Use the internal stepCount property to monitor progress.
 */
Game.prototype.step = function () {
    this.phaser.step();
};

/**
 * 强制更新游戏界面，用于游戏父亲容器改变，需要游戏界面实时同步的情况下调用，
 * Phaser内部canvas大小跟着parent变化并非每帧更新，
 * 受scale.trackParentInterval(2000)参数控制，
 * 通过将scale._lastUpdate设置为0，促发下帧即可更新canvas
 *
 * @param callPreUpdate 是否调用scale.preUpdate()
 */
Game.prototype.updateScale = function(callPreUpdate) {
    var scale = this.phaser.scale;
    if (scale) {
        scale._lastUpdate = 0;
        if (callPreUpdate) {
            scale.preUpdate();
        }
    }
};

/**
 * 全屏显示
 */
Game.prototype.fullScreen = function() {
    var game = this;
    if (game._adjustToFullScreen) {
        return;
    }

    var lastWidth, lastHeight;

    // 调整游戏界面大小
    game._adjustToFullScreen = function(force){
        // 输入状态不调整游戏界面大小
        if (game.isBooted && game.input.inputting) {
            return;
        }

        // 获取当前宽度
        var width = document.documentElement.clientWidth;
        if (window.innerWidth && window.innerWidth < width) {
            width = window.innerWidth;
        }
        // 获取当前宽度
        var height = document.documentElement.clientHeight;
        if (window.innerHeight && window.innerHeight < height) {
            height = window.innerHeight;
        }

        // 没有变化则不处理
        if (lastWidth === width && lastHeight === height && !force) {
            return;
        }
        lastWidth = width;
        lastHeight = height;
        
        if (game.device.iOS) {
            // 绕开iOS下宽高比未变化界面更新问题
            game.setGameSize(width-5, height+5);
            game.phaser.time.events.add(1, function() {
                game.setGameSize(width, height);
            });
        }
        else {
            game.setGameSize(width, height);
        }
        
        // 设置富容器大小
        game.container.style.width = width + 'px';
        game.container.style.height = height + 'px';
        game.updateScale();

        // iOS下的UC浏览器输入框隐藏后height有问题，所以...
        if (game.device.phaser.UCBrowser) {
            window.scrollTo(0, 1);
            setTimeout(function(){
                var div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.top = height +'px';
                div.style.width = '100px';
                div.style.height = '100px';
                document.body.appendChild(div);

                window.scrollTo(0, height);
                setTimeout(function(){
                    window.scrollTo(0, 1);
                    document.body.removeChild(div);
                }, 10);
            }, 10);
        }
    };

    window.addEventListener('orientationchange', game.updateGameLayout.bind(game), false);
    window.addEventListener('resize', game.updateGameLayout.bind(game), false);
    window.scrollTo(0, 1);
    game._adjustToFullScreen();
};

/**
 * 设置游戏大小
 */ 
Game.prototype.setGameSize = function(width, height) { 
    if (!this.fixedGameSize) {
        this.phaser.scale.setGameSize(width, height);          
    }    
    this.updateScale();
};

/**
 * 更新游戏布局，包含更新游戏大小和DomRoot参数设置
 */
Game.prototype.updateGameLayout = function(force) {
    // 调整游戏界面大小
    if (this._adjustToFullScreen) {
        this._adjustToFullScreen(force);
    }   
    // 更新frontDomRoot和backDomRoot的参数
    this.world.updateDomRoot();
}

/**
 * 游戏主循环
 * @param time
 */
Game.prototype.update = function(time) {
    var phaser = this.phaser;

    if (this.time) {
        var time = this.time.now;
        if (!this._lastUpdateGameSizeTime || time - this._lastUpdateGameSizeTime > 1000) {
            this._lastUpdateGameSizeTime = time;
            this.updateGameLayout();
        }
    }

    // phaser的时间系统调度
    phaser._calcTransformCount = 0;

    phaser.time.update(time);
    var fixedFrameDelta = 1.0 / phaser.time.desiredFps;

    if (phaser._kickstart)
    {
        this.updateLogic(fixedFrameDelta);

        //  Sync the scene graph after _every_ logic update to account for moved game objects
        phaser._calcTransformCount = 0;
        phaser.stage.updateTransform();

        // call the game render update exactly once every frame
        this.updateRender(phaser.time.slowMotion * phaser.time.desiredFps);

        phaser._kickstart = false;
        return;
    }

    // if the logic time is spiraling upwards, skip a frame entirely
    if (phaser._spiraling > 1 && !phaser.forceSingleUpdate)
    {
        // cause an event to warn the program that this CPU can't keep up with the current desiredFps rate
        if (phaser.time.time > phaser._nextFpsNotification)
        {
            // only permit one fps notification per 10 seconds
            phaser._nextFpsNotification = phaser.time.time + 1000 * 10;

            // dispatch the notification signal
            phaser.fpsProblemNotifier.dispatch();
        }

        // reset the _deltaTime accumulator which will cause all pending dropped frames to be permanently skipped
        phaser._deltaTime = 0;
        phaser._spiraling = 0;

        // call the game render update exactly once every frame
        phaser.updateRender(phaser.time.slowMotion * phaser.time.desiredFps);
    }
    else
    {
        // step size taking into account the slow motion speed
        var slowStep = phaser.time.slowMotion * 1000.0 / phaser.time.desiredFps;

        // accumulate time until the slowStep threshold is met or exceeded... up to a limit of 3 catch-up frames at slowStep intervals
        phaser._deltaTime += Math.max(Math.min(slowStep * 3, phaser.time.elapsed), 0);

        // call the game update logic multiple times if necessary to "catch up" with dropped frames
        // unless forceSingleUpdate is true
        var count = 0;

        phaser.updatesThisFrame = Math.floor(phaser._deltaTime / slowStep);

        if (phaser.forceSingleUpdate)
        {
            phaser.updatesThisFrame = Math.min(1, phaser.updatesThisFrame);
        }

        var needToUpdate = false;
        while (phaser._deltaTime >= slowStep)
        {
            phaser._deltaTime -= slowStep;
            phaser.currentUpdateID = count;

            if (!needToUpdate) {
                // 如果处于暂停状态也不进行更新
                if (!this._paused && !this.pendingStep)
                {
                    needToUpdate = true;
                }
            }
            if (needToUpdate) {
                phaser.updateFrameDelta();
                this.updateLogic(fixedFrameDelta);

                //  Sync the scene graph after _every_ logic update to account for moved game objects
                phaser._calcTransformCount = 0;
                phaser.stage.updateTransform();
            }

            count++;

            if (phaser.forceSingleUpdate && count === 1)
            {
                break;
            }
        }

        // detect spiraling (if the catch-up loop isn't fast enough, the number of iterations will increase constantly)
        if (count > phaser._lastCount)
        {
            phaser._spiraling++;
        }
        else if (count < phaser._lastCount)
        {
            // looks like it caught up successfully, reset the spiral alert counter
            phaser._spiraling = 0;
        }

        phaser._lastCount = count;

        // call the game render update exactly once every frame unless we're playing catch-up from a spiral condition
        if (needToUpdate)
            this.updateRender(phaser._deltaTime / slowStep);
        return needToUpdate;
    }
};

/**
 * 逻辑调度
 */
Game.prototype.updateLogic = function(timeStep) {
    var t1 = Date.now();
    var phaser = this.phaser;

    if (!phaser._paused && !phaser.pendingStep)
    {
        // 定时器调度
        if (this.timer)
            this.timer.update(this.time.now);

        if (phaser.stepping)
        {
            phaser.pendingStep = true;
        }

        var now = Date.now();
        phaser.scale.preUpdate();
        phaser.debug.preUpdate();
        phaser.world.camera.preUpdate();
        phaser.state.preUpdate(timeStep);
        phaser.plugins.preUpdate(timeStep);
        phaser.stage.preUpdate();
        phaser.physics.preUpdate();
        this.debug.preUpdate += Date.now() - now;
        now = Date.now();

        phaser.input.update();
        phaser.state.update();
        phaser.stage.update();
        phaser.tweens.update(timeStep);
        phaser.sound.update();
        phaser.physics.update();
        phaser.particles.update();
        phaser.plugins.update();
        this.debug.update += this.time.now - now;
        now = Date.now();

        phaser.stage.postUpdate();
        phaser.plugins.postUpdate();
        this.debug.postUpdate += Date.now() - now;
        now = Date.now();
    }
    else
    {
        // Scaling and device orientation changes are still reflected when paused.
        phaser.scale.pauseUpdate();
        phaser.state.pauseUpdate();
        phaser.debug.preUpdate();
    }

    this.debug.logic += Date.now() - t1;
};

/**
 * 渲染调度
 */
Game.prototype.updateRender = function(elapsedTime) {
    var t1 = Date.now();
    var phaser = this.phaser;

    if (phaser.lockRender)
    {
        return;
    }

    phaser.state.preRender(elapsedTime);
    phaser.renderer.render(phaser.stage);
    phaser.plugins.render(elapsedTime);
    phaser.state.render(elapsedTime);
    phaser.plugins.postRender(elapsedTime);

    // 缓存池更新
    qc.CanvasPool.postRender();

    this.debug.render += Date.now() - t1;
};
