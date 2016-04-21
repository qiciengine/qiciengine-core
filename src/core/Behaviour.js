/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 所有的游戏逻辑脚本都应该继承此类，然后挂载到相应的场景对象中以起作用。
 * 继承此类的对象，构造时都应该使用qc.Behaviour#add接口创建，不能直接new
 *
 * @class qc.Behaviour
 * @constructor
 */
var Behaviour = qc.Behaviour = function(gameObject) {
    this._gameObject = gameObject;

    this.cookie = 0;

    // 缓存本节点关注的事件
    this._events = {};

    // 记录下是否有调度函数
    this.__hadUpdateOrRender = (this.preUpdate || this.update || this.postUpdate) ? true : false;
};
Behaviour.prototype.constructor = Behaviour;

/**
 * 定义一个逻辑脚本
 * @method defineBehaviour
 */
qc._userScripts = {};
var defineBehaviour = qc.defineBehaviour = function(clazz, parent, init, fields) {
    // 先将clazz分解下，并创建包
    var arr = clazz.split('.');
    var curr = window;
    for (var i = 0; i < arr.length - 1; i++) {
        if (!curr[arr[i]]) curr[arr[i]] = {};
        curr = curr[arr[i]];
    }
    var name = arr[arr.length - 1];

    parent = parent || qc.Behaviour;
    if (typeof fields === 'function') {
        // 指定了函数，则调用下取返回值
        fields = fields.call(this);
    }

    fields = fields || {};
    curr[name] = function(gameObject) {
        // 记录父亲和类名
        parent.call(this, gameObject);
        this.class = clazz;
        this.super = parent.prototype;

        // 调用初始化函数
        if (typeof init === 'function')
            init.call(this);
    };
    curr[name].prototype = Object.create(parent.prototype);
    curr[name].prototype.constructor = curr[name];

    // 设置需要序列化的字段
    curr[name].prototype.getMeta = function() {
        var meta = parent.prototype.getMeta.call(this);

        // 合并下
        return mixin(meta, fields);
    };

    curr[name].prototype.clazz = clazz;

    qc._userScripts[clazz] = curr[name];
    return curr[name];
};

/**
 * Register a Behaviour class. Use for Typescript only
 */
qc.registerBehaviour = function(className, clazz) {
    // 设置需要序列化的字段
    var f = clazz.prototype.getMeta;
    clazz.prototype.getMeta = function() {
        var meta = f.call(this);

        // 合并下
        return mixin(meta, this.serializableFields || {});
    };

    clazz.prototype.clazz = className;
    qc._userScripts[className] = clazz;
}

Object.defineProperties(Behaviour.prototype, {
    /**
     * @property {string} uuid - 脚本的唯一标识
     * @readonly
     */
    uuid: {
        get: function()  { return this._uuid; },
        set: function(v) { this._uuid = v;    }
    },

    /**
     * 取得节点的对象
     * @property {qc.Behaviour}
     * @readonly
     */
    "gameObject" : {
        get : function() { return this._gameObject; }
    },

    /**
     * 节点的名字
     * @property {string}
     */
    'name' : {
        get : function()  { return this.gameObject.name; },
        set : function(v) { this.gameObject.name = v;    }
    },

    /**
     * 组件的 key
     * this.gameObject[key] 可直接取得该组件对象
     * @property {string}
     */
    'key' : {
        get : function()  {
            if (this._key)
                return this._key;

            // 默认取 class 的最后的一个单词作为 key
            // 比如 qc.Box2D.Body 组件，取 Body 作为 key
            if (this.class)
            {
                var match = this.class.match(/([^\..]*)$/);
                if (match)
                    this._key = match[1];
            }
            return this._key;
        },
        set : function(v) {
            if (this._key)
            {
                if (this.gameObject && this.gameObject[this._key] &&
                    this.gameObject[this._key].uuid === this.uuid)
                    // 将旧的应用移除
                    delete this.gameObject[this._key];
            }

            this._key = v;
            if (this.gameObject && !this.gameObject[v])
                // 属主对象可直接通过 key 取得该组件对象
                this.gameObject[v] = this;
        }
    },

    /**
     * 组件是不是激活的，如果没有激活相当于没有add此脚本
     */
    enable : {
        get : function() { return this._enable; },
        set : function(v) {
            if (this._enable !== v) {
                this._enable = v;
                if (this._enable && this.onEnable) {
                    this.onEnable();
                }
                else if (!this._enable && this.onDisable) {
                    this.onDisable();
                }
            }
        }
    },

    /**
     * @property {boolean} runInEditor - 是否在编辑器模式下运行
     * @default false
     */
    runInEditor : {
        get : function()  { return this._runInEditor === true; },
        set : function(v) { this._runInEditor = v;             }
    },

    /**
     * @property {qc.Game} game - 指向的游戏实例
     */
    game : {
        get : function() { return this.gameObject.game; }
    }
});

/**
 * 取得组件
 * * @method getScript
 * @param script - 组件类名
 */
Behaviour.prototype.getScript = function(script) {
    return this.gameObject.getScript(script);
};

/**
 * 取得组件
 * * @method getScripts
 * @param script - 组件类名
 */
Behaviour.prototype.getScripts = function(script) {
    return this.gameObject.getScripts(script);
};

/**
 * 将本组件移除掉
 * @method destroy
 */
Behaviour.prototype.destroy = function() {
    this.gameObject.removeScript(this);

    // 调用回调
    if (this.onDestroy)
        this.onDestroy();

    // 移除事件关注
    for (var id in this._events)
    {
        var eventData = this._events[id];
        if (!eventData)
            continue;

        eventData[0].remove(eventData[1], eventData[2]);
    }
    this._events = [];
};

/**
 * 是不是启用
 * @method isEnable
 */
Behaviour.prototype.isEnable = function() {
    return this._enable;
};

/**
 * 需要序列化的字段信息
 * @internal
 */
Behaviour.prototype.getMeta = function() {
    return {
        uuid: qc.Serializer.STRING,
        enable: {
            get : function(ob) {
                return ob.enable;
            },
            set : function(context, v) {
                context._enable = v;
            }
        }
    };
};

/**
 * 序列化完毕后的处理工作
 * @internal
 */
Behaviour.prototype._restoreInit = function() {
    this.gameObject._initGetSetField.call(this);
};

/**
 * 使用该增加事件关注，在 destroy 时会自动移除事件关注，避免事件没被移除，导致对象被引用，内存泄漏
 * @method addListener
 * @param signal {qc.Signal} 事件对象
 * @param listener {function} 事件关注的回调函数
 * @param listenerContext {object} listener函数的属主
 * @param priority {int} 监听优先级
 * @return {int} 监听编号
 */
Behaviour.prototype.addListener = function(signal, listener, listenerContext, priority) {

    // 注册事件
    signal.add(listener, listenerContext, priority);

    this.cookie++;

    // 加入缓存
    this._events[this.cookie] = [signal, listener, listenerContext];

    return this.cookie;
};

/**
 * 增加一次性事件关注
 * @method addListenerOnce
 * @param signal {qc.Signal} 事件对象
 * @param listener {function} 事件关注的回调函数
 * @param listenerContext {object} listener函数的属主
 * @param priority {int} 监听优先级
 */
Behaviour.prototype.addListenerOnce = function(signal, listener, listenerContext, priority) {

    // 注册事件
    signal.addOnce(listener, listenerContext, priority);
};

/**
 * 手动移除事件关注
 * @method removeListener
 * @param {int} 监听编号
 */
Behaviour.prototype.removeListener = function(id) {

    var eventData = this._events[id];
    if (!eventData)
        return;

    eventData[0].remove(eventData[1], eventData[2]);
    delete this._events[id];
};
