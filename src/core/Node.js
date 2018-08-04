/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 所有的DisplayObject节点都可以挂载游戏逻辑脚本。
 * Node负责动态挂载用户的逻辑脚本，所有的GameObject都应该继承此类
 *
 * @class qc.Node
 * @constructor
 */
var Node = qc.Node = function(phaser, parent, uuid) {
    var self = this;

    // 设置关联的game对象
    self.game = phaser.game._qc;

    // 关联的phaser对象
    self.phaser = phaser;
    phaser._qc = this;

    // 设置全局唯一标示
    self.uuid = uuid || self.game.math.uuid();

    // 设置全局唯一名字
    self._uniqueName = '';

    // 是否允许交互，默认为false，控制onDown/onUp/onClick等事件
    self._interactive = false;

    // 是否允许拖拽，默认为false，控制onDrag事件
    self._draggable = false;

    // 缓存qc封装的孩子节点数组，在get函数内部会进行初始化构建
    self._children = null;

    // 默认不是预制
    self._prefab = '';

    /**
     * @property {Array} scripts - 所有挂载的脚本
     */
    self.scripts = [];

    /**
     * @property {Map} scriptMap - 以脚本名为 key 缓存脚本对象，方便快速查找
     */
    self.scriptMap = {};

    /**
     * @property {boolean} static - 本节点以下的元素都是静态的，不需要执行update等逻辑调度（有助于提升效率）
     * @default: false
     */
    self.static = false;

    // 节点 zorder
    self._localZOrder = 0;

    // 默认情况下，碰撞盒和对象的大小保持一致
    self.hitArea = undefined;

    this.cookie = 0;

    // 缓存本节点关注的事件
    self._events = [];

    // @hackpp 重载Phaser对象的destroy函数，做我们自己的销毁工作
    var oldDestroy = phaser.destroy;
    phaser.destroy = function() {
        // 已经销毁过了，不要再次处理
        if (self._destroy) return;

        this.maybeOutWorld && this.maybeOutWorld();

        if (self === self.game.world) {
            // Phaser.Group.prototype.destroy = function (destroyChildren, soft)
            // 设置soft为true，保留world在stage不被删除
            oldDestroy.call(phaser, true, true);

            // 派发销毁事件
            self._dispatchModelChangeEvent('destroy', self);
        }
        else {
            // 销毁我自己的处理
            self.onDestroy();

            // 调用Phaser默认销毁实现，Phaser会递归调用孩子的销毁
            oldDestroy.call(phaser);

            // 通知所有挂载的脚本移除
            var i = self.scripts.length;
            while (i--) {
                self.scripts[i].destroy();
            }
            self.scripts = [];
            self.scriptMap = {};

            // 派发销毁事件
            self._dispatchModelChangeEvent('destroy', self);

            // 标记我被销毁了
            self._destroy = true;
        }
    };

    // 挂载父节点（不指定的时候默认挂在 world 上）
    // 注意：world 对象本身也继承自 node，但我们不希望 world 被挂在任何节点上。
    //      qc.world 本身是对 phaser.world 的引用，在 Phaser 那一层已经被 add 到
    //      stage 对象上
    if (parent !== this) {
        (parent || this.game.world).addChild(this);
    }

    // 设置其默认位置
    this._defaultTransform();
};
Node.prototype.constructor = Node;

Object.defineProperties(Node.prototype, {
    /**
     * @property {string} uuid - 对象的唯一标识符
     * @internal
     */
    uuid : {
        get : function() { return this._uuid; },
        set : function(v) {
            // 先干掉旧的映射关系
            if (this._uuid) {
                this.game.nodePool.remove(this.uuid);
            }

            // 建立新的关系
            this._uuid = v;
            this.game.nodePool.add(this.uuid, this);
        }
    },

    /**
     * 节点名称
     * @proeprty name
     * @type string
     */
    'name': {
        get: function() {
            return this.phaser.name;
        },
        set: function(v) {
            // 不允许出现反斜杠
            v = v || '';
            v = v.replace(/\//g, '');
            this.phaser.name = v;

            // 派发名字变化事件
            this._dispatchModelChangeEvent('name', this);
        }
    },

    /**
     * 唯一名称，如果有指定，可通过 qc.N(uniqueName) 直接取得 node 对象
     * @proeprty name
     * @type string
     */
    'uniqueName': {
        get: function() {
            return this._uniqueName;
        },
        set: function(v) {
            if (this._uniqueName)
                // 先移除旧的名字映射
                this.game.nodePool.removeName(this._uniqueName);

            this._uniqueName = v;
            if (this._uniqueName && !this.game.nodePool.findByName(this._uniqueName))
                this.game.nodePool.addName(this._uniqueName, this.uuid);
        }
    },

    /**
     * @property {boolean} ignoreDestroy - 节点及其孩子在切换场景时不会被析构
     */
    ignoreDestroy: {
        get: function()  { return this.parent === this.game.world && this.phaser.ignoreDestroy; },
        set: function(v) {
            if (this.parent === this.game.world)
                this.phaser.ignoreDestroy = v;
            else {
                this.phaser.ignoreDestroy = false;
                if (v) this.game.log.error('Only Root Node can set: ignoreDestroy=true');
            }
        }
    },

    /**
     * The opacity of the object.
     *
     * @property alpha
     * @type Number
     */
    'alpha': {
        get: function() {
            return this.phaser.alpha;
        },
        set: function(v) {
            this.phaser.alpha = v;

            this.phaser.displayChanged(qc.DisplayChangeStatus.ALPHA);
        }
    },

    /**
     * The visibility of the object.
     *
     * @property visible
     * @type Boolean
     */
    'visible': {
        get: function() {
            return this.phaser.visible;
        },
        set: function(v) {
            if (this.phaser.visible === v) return;
            if (v && this._toDestroy) return;
            this.phaser.visible = v;
            // 需要更新变换矩阵
            this._isTransformDirty = true;
            this._dispatchLayoutArgumentChanged('size');

            this.phaser.displayChanged(v ? qc.DisplayChangeStatus.SHOW : qc.DisplayChangeStatus.HIDE);
            // 通知孩子
            this._notifyVisibleChanged(v);
        }
    },

    /**
     * The display object container that contains this display object.
     *
     * @property parent
     * @type qc.Node
     */
    'parent': {
        get: function() {
            var parent = this.phaser.parent;
            return parent ? parent._qc : null;
        },
        set: function(parent) {
            // 父亲不为空将孩子添加到末尾
            if (parent) {
                parent.addChild(this);
            }
            // 父亲为空将孩子从老父亲中删除
            else {
                if (this.parent instanceof Node) {
                    this.parent.removeChild(this);
                }
            }
        }
    },

    /**
     * [read-only] Indicates if the sprite is globally visible.
     *
     * @property worldVisible
     * @type Boolean
     */
    worldVisible: {
        get: function() {
            return this.phaser && this.phaser.worldVisible;
        }
    },

    /**
     * Sets a mask for the displayObject. A mask is an object that limits the visibility of an object to the shape of the mask applied to it.
     * In PIXI a regular mask must be a PIXI.Graphics object. This allows for much faster masking in canvas as it utilises shape clipping.
     * To remove a mask, set this property to null.
     *
     * @property mask
     * @type Graphics
     */
    'mask': {
        get: function() {
            return this.phaser.mask;
        },
        set: function(v) {
            this.phaser.mask = v;
        }
    },

    /**
     * 所有的孩子
     *
     * @property children
     * @type Array[]
     * @readonly
     */
    'children': {
        get: function() {
            if (!this._children) {
                this._children = [];
                var list = this.phaser.children;
                for (var i = 0, len = list.length; i < len; i++) {
                    var qc = list[i]._qc;
                    // BitmapFont和Emitter类型的children是Phaser自动生成的Sprite对象，
                    // qc对这些children对象并未封装Node的绑定
                    if (qc) {
                        this._children.push(qc);
                    }
                }
            }
            return this._children;
        }
    },

    /**
     * 节点 zorder 顺序
     *
     * @property localZOrder
     * @type int
     */
    'localZOrder': {
        get: function() {
            return this._localZOrder;
        },
        set: function(value) {
            this._localZOrder = value;
            if (this.parent)
                // 设置父节点重新排序
                this.parent._orderDirty = true;
        }
    },

    /**
     * 设置颜色混合
     * @property {qc.Color} colorTint
     */
    colorTint: {
        get: function() {
            return new Color(this.phaser.tint);
        },
        set: function(value) {
            value = value || new Color(0xFFFFFF);
            if (!(value instanceof Color)) {
                console.error(value);
                this.game.log.error('Expected qc.Color');
                return;
            }

            this.phaser.tint = value.toNumber();

            this.phaser.displayChanged(qc.DisplayChangeStatus.TINT);
        }
    },

    /**
     * 子节点变化时的通知事件
     * @property {Phaser.Signal} onChildrenChanged
     */
    onChildrenChanged: {
        get : function() {
            return this._onChildrenChanged || (this._onChildrenChanged = new Phaser.Signal());
        }
    }
});

Node.prototype.preUpdate = function () {
    if (!this._orderDirty)
        return;

    this._orderDirty = undefined;
    if (!this.phaser || typeof this.phaser.updateZ !== "function")
        return;

    // 重排序
    var children = this.getChildren();
    children.sort(function(a, b) {
        var ret = (a._localZOrder || 0) - (b._localZOrder || 0);
        if (ret === 0)
            return a.phaser.z - b.phaser.z;
        else
            return ret;
    });
    var list = [];
    for (var i = 0, len = children.length; i < len; i++) {
        var child = children[i];
        list.push(child.phaser);
    }
    this.phaser.children = list;
    this.phaser.updateZ();
    this._children = null;
}

/**
 * 是否可见
 * @method isVisible
 */
Node.prototype.isVisible = function() {
    return this.phaser.visible;
};

/**
 * 是否可见
 * @method isWorldVisible
 */
Node.prototype.isWorldVisible = function() {
    var item = this;
    do
    {
        if (!item.phaser.visible) return false;
        item = item.parent;
    }
    while(item);
    return true;
};

/**
 * 添加一个逻辑脚本对象，此脚本对象应该继承qc.Scriptable
 * @method addScript
 * @param {string} script - 挂载的逻辑脚本名称
 */
Node.prototype.addScript = function(script, dispatchAwake) {
    var clazz = qc.Util.findClass(script);
    if (typeof clazz !== 'function') {
        this.game.log.error('Class:{0} not exists', script);
        return;
    }

    // 检查此类是不是继承自Behaviour
    var c = new clazz(this);
    if (!(c instanceof qc.Behaviour)) {
        this.game.log.error("Must inherit from qc.Behaviour");
        return;
    }

    // 挂载时立刻调用其awake函数
    c.uuid = this.game.math.uuid();
    c._clazz = script;
    c.class = script;
    this[c.key] = c;
    this.scripts.push(c);
    this.scriptMap[script] = c;
    if (dispatchAwake || dispatchAwake === undefined) {
        // 在反序列化的时候，我们不要在addScript中派发事件
        // 如果处于editor模式，并且此脚本没有声明在编辑器模式下运行，就不要调用awake了
        if (c.awake && (this.game.device.editor !== true || c.runInEditor === true))
            c.awake();
    }
    if (c._enable === undefined && dispatchAwake !== false) {
        // 没指定 enable，且不是反序列化回来的，我们默认 enable 为 true
        if (this.game.device.editor === true && c.runInEditor !== true)
            // 编辑器模式，且没指定 runInEditor，只能设置 _enable 为 true，不能调度 onEnabled
            c._enable = true;
        else
            c.enable = true;
    }

    return c;
};

/**
 * 移除一个逻辑脚本对象，使用时请调用Behaviour#destroy接口，不要直接使用本接口来移除
 * @method
 * @internal
 * @param {qc.Behaviour} script - 移除的脚本对象
 */
Node.prototype.removeScript = function(script) {
    var index = this.scripts.indexOf(script);
    if (index > -1)
        this.scripts.splice(index, 1);
    delete this.scriptMap[script.class];

    if (this[script._key] && this[script._key].uuid === script.uuid)
        // 将旧的应用移除
        delete this[script._key];

    if (this.__json && this.__json[script.uuid])
        // 将旧的序列化数据删除
        delete this.__json[script.uuid];
};

/**
 * 取得一个逻辑脚本对象
 * @method getScript
 * @param {qc.Behaviour|string} script
 * @param {boolean} inherit - 是否判断继承关系，默认为 true
 */
Node.prototype.getScript = function(script, inherit) {
    var clazz = script;
    if (typeof(script) != 'string')
        script = clazz.prototype.clazz;
    if (this.scriptMap[script])
        return this.scriptMap[script];

    if (typeof script === 'string')
        clazz = qc.Util.findClass(script);
    if (!clazz) {
        this.game.log.error('Class:{0} not exists', script);
        return null;
    }
    if (arguments.length === 1 || inherit) {
        for (var c in this.scripts) {
            if (this.scripts[c] instanceof clazz) {
                return this.scripts[c];
            }
        }
    }
    else {
        for (var c in this.scripts) {
            if (this.scripts[c].class === clazz.prototype.clazz) {
                return this.scripts[c];
            }
        }
    }
};

/**
 * 取得一系列逻辑脚本对象
 * @method getScripts
 * @param {qc.Behaviour|string} script
 * @param {boolean} inherit - 是否判断继承关系，默认为 true
 * @return {[qc.Behaviour]}
 */
Node.prototype.getScripts = function(script, inherit) {
    var clazz = script;
    if (typeof script === 'string')
        clazz = qc.Util.findClass(script);
    var ret = [];
    if (!clazz) {
        this.game.log.error('Class:{0} not exists', script);
        return ret;
    }
    if (arguments.length === 1 || inherit) {
        for (var c in this.scripts) {
            if (this.scripts[c] instanceof clazz) {
                ret.push(this.scripts[c]);
            }
        }
    }
    else {
        for (var c in this.scripts) {
            if (this.scripts[c].class === clazz.prototype.clazz) {
                ret.push(this.scripts[c]);
            }
        }
    }
    return ret;
};

/**
 * 判断本对象是否为指定Node的子孙节点
 * @param node 指定的Node对象
 * @returns {boolean} 为子孙返回true，否则false
 */
Node.prototype.isDescendantOf = function(node) {
    var tempParent = this.parent;
    while (tempParent) {
        if (node === tempParent) {
            return true;
        } else {
            tempParent = tempParent.parent;
        }
    }
    return false;
};

/**
 * 取得所有的孩子
 * @method qc.Node#getChildren
 */
Node.prototype.getChildren = function() {
    var children = this._children;
    if (!children) {
        children = this.children;
    }
    return children;
};

/**
 * 添加一个孩子节点到尾部
 *
 * @method addChild
 * @param child {qc.Node} 待添加的孩子节点
 * @return {qc.Node} 被添加进来后的节点
 */
Node.prototype.addChild = function(child) {
    return this.addChildAt(child, this.children.length);
};

/**
 * 添加一个孩子到指定的位置
 *
 * @method addChildAt
 * @param child {qc.Node} 待添加的孩子节点
 * @param index {Number} 位置
 * @return {qc.Node} 添加成功后的节点
 */
Node.prototype.addChildAt = function(child, index) {
    if (child.parent === this) {
        // 没有发生什么变化，不需要做处理
        return;
    }

    // 检查下合法性
    if (!(child instanceof Node)) {
        throw new Error('Expected qc.Node');
    }
    if (child === this) {
        throw new Error('The child is myself');
    }
    if (this.isDescendantOf(child)) {
        throw new Error('child is my parent');
    }

    // 无效以前父亲的孩子缓冲
    var parent = child.parent;
    if (parent instanceof Node) {
        parent._children = null;
    }

    // Phaser.Group类型采用addAt
    if (this.phaser.addAt) {
        this.phaser.addAt(child.phaser, index);
    }
    else {
        this.phaser.addChildAt(child.phaser, index);
    }
    this._orderDirty = true;

    // 派发孩子变化事件
    this._dispatchModelChangeEvent('parent', child);
    child._callChildrenFunc('onAddToWorld');
    return child;
};

/**
 * 交换两个孩子的位置
 *
 * @method swapChildren
 * @param child1
 * @param child2
 */
Node.prototype.swapChildren = function(child1, child2) {
    this.phaser.swapChildren(child1.phaser, child2.phaser);
    // 派发孩子变化事件
    this._dispatchModelChangeEvent('parent', child1);
    this._dispatchModelChangeEvent('parent', child2);
};

/**
 * 取得孩子的位置
 *
 * @method getChildIndex
 * @param child {qc.Node} 待查找的孩子对象
 * @return {Number} 孩子的位置
 */
Node.prototype.getChildIndex = function(child) {
    return this.children.indexOf(child);
};

/**
 * 设置孩子的位置
 *
 * @method setChildIndex
 * @param child {qc.Node} 待设置的孩子对象
 * @param index {Number} 放入的位置
 */
Node.prototype.setChildIndex = function(child, index) {
    if (child.parent !== this) {
        return;
    }
    var phaserChildren = this.phaser.children;
    var currentIndex = phaserChildren.indexOf(child.phaser);
    if (currentIndex === index) {
        return;
    }
    phaserChildren.splice(currentIndex, 1); //remove from old position
    phaserChildren.splice(index, 0, child.phaser); //add at new position
    if (this.phaser.updateZ)
        this.phaser.updateZ();

    child.phaser.displayChanged(qc.DisplayChangeStatus.ORDER);

    // 派发孩子变化事件
    this._dispatchModelChangeEvent('parent', child);

    this._dispatchChildrenChanged('order', [child]);
};

/**
 * 取得指定位置的孩子对象
 *
 * @method getChildAt
 * @param index {Number} 孩子的位置
 * @return {qc.Node} 如果存在的话，返回孩子对象
 */
Node.prototype.getChildAt = function(index) {
    return this.children[index];
};

/**
 * 移除一个孩子
 *
 * @method removeChild
 * @param child {qc.Node} 待移除的对象或者其位置
 * @return {qc.Node} 被移除后的对象
 */
Node.prototype.removeChild = function(child) {
    // 解除父子关系
    if (this.phaser.remove) {
        this.phaser.remove(child.phaser);
    }
    else {
        this.phaser.removeChild(child.phaser);
    }

    // 无效化
    this._children = null;

    // 派发孩子变化事件
    this._dispatchModelChangeEvent('parent', child);
    child._callChildrenFunc('onRemoveFromWorld');
    return child;
};

/**
 * 在指定的位置删除孩子
 * @param index 要删除的孩子索引
 * @returns {qc.Node} 被删除的孩子对象
 */
Node.prototype.removeChildAt = function(index) {
    var child = this.getChildAt(index);
    return this.removeChild(child);
};

/**
 * 删除所有孩子
 */
Node.prototype.removeChildren = function() {
    var children = this.children;

    // Phaser.Group类型采用removeAll
    if (this.phaser.removeAll) {
        this.phaser.removeAll();
    }
    else {
        this.phaser.removeChildren();
    }

    // 派发孩子删除事件
    this._dispatchModelChangeEvent('removeChildren', this);
    children.forEach(function(child) {
        if (child) child._callChildrenFunc('onRemoveFromWorld');
    });
};

/**
 * 析构
 */
Node.prototype.onDestroy = function() {
    // 通知父亲移除
    this.parent = null;

    // 通知phaser析构
    this.game.nodePool.remove(this.uuid);

};

/**
 * 销毁本对象，该函数不直接进行模型事件派发，
 * 因为Phaser在切换state等情况下会直接调用例如Phaser的destroy函数，
 * 我们无法限制所有destroy调用必须通过Node的函数入口，
 * 所以在构造函数中我们已经重载了Phaser对象的destroy，在那里进行事件派发等处理。
 * 调用本函数时，节点先隐藏掉并且在下一帧才会真正被清理
 */
Node.prototype.destroy = function() {
    if (this._toDestroy) return;
    this._toDestroy = true;
    this.visible = false;

    // 扔到待析构的队列中
    this.game.world.addToDestroy(this);
};

/**
 * 立刻销毁本节点，不推荐使用
 * @method qc.Node#destroyImmediately
 */
Node.prototype.destroyImmediately = function() {
    // 已经析构了，不要重复调用
    if (this._destroy || this._destroying) return;

    // 移除事件关注
    for (var id in this._events)
    {
        var eventData = this._events[id];
        if (!eventData)
            continue;

        eventData[0].remove(eventData[1], eventData[2]);
    }
    this._events = [];

    this.visible = false;
    this._destroying = true;
    if (this.phaser)
        this.phaser.destroy();
    this._destroying = false;
};

/**
 * 在当前节点下，查找子节点。path可以以"/"进行分隔，表示查找的目录层次
 * 例如：find("UIRoot/ui_login/loginBtn/../")
 *
 * @param path {string} - 查找的node路径
 * @return {qc.Node}
 */
Node.prototype.find = function(path) {
    // 就是我自身
    if (path === '' || path === '.' || path === './') return this;
    var arr = path.split("/");
    var curr = this;
    for (var i = 0; i < arr.length - 1; i++) {
        var p = arr[i];
        if (p === '') continue;
        if (p === '..') {
            // 父亲
            curr = this.parent;
            if (curr === this.game.stage) return null;
            continue;
        }

        // 查找儿子
        curr = curr._findByName(arr[i]);
        if (!curr) return curr;
    }

    var p = arr[arr.length - 1];
    if (p === '' || p === '.') return curr;
    if (p === '..') return curr.parent === this.game.stage ? null : curr.parent;
    return curr._findByName(p);
};

/**
 * 查找指定名字的孩子
 * @private
 */
Node.prototype._findByName = function(name) {
    var children = this.children;
    for (var i in children) {
        if (children[i].name === name) {
            return children[i];
        }
    }
};

/**
 * 派发孩子变化事件
 * @param type 事件派发类型：'name'|parent'|'removeChildren'|'destroy'
 * @param target 发生变化的Node对象
 * @private
 */
Node.prototype._dispatchModelChangeEvent = function(type, target) {
    if (type !== 'name') {
        this._children = null;
    }
    var world = this.game.world;
    world.onModelChange.dispatch({
        type: type,
        target: target
    });
};

/**
 * 调用逻辑脚本的方法
 * @private
 */
Node.prototype._sendMessage = function(method, checkRet) {
    if (!this.scripts) return;
    var len = this.scripts.length;
    var arg = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < len; i++) {
        var script = this.scripts[i];
        if (script && script.enable) {
            var func = script[method];
            if (!func) continue;

            // 调度之，如果有指明返回值为true就停止掉
            var ret = func.apply(script, arg);
            if (checkRet === true && ret === true) return true;
        }
    }
};

/**
 * 对自身和孩子调用方法
 * @private
 */
Node.prototype._broadcast = function(method) {
    if (!this.scripts) return;
    var i = this.scripts.length;
    var arg = Array.prototype.slice.call(arguments, 1);
    while (i--) {
        var script = this.scripts[i];
        if (!script || !script.enable) continue;

        // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
        if (this.game.device.editor === true && script.runInEditor !== true) continue;

        // 节点在脚本中析构了，就不继续调度了
        if (this._toDestroy || this._destroy) return;

        // 调度之
        var func = script[method];
        if (!func) continue;
        func.apply(script, arg);
    }

    // 把所有的儿子也调度下
    var children = this._children;
    if (!children) children = this.getChildren();
    var length = children.length;
    for (i = 0; i < length; i++) {
        children[i][method](arg);
    }
};

/**
 * 遍历父亲节点，找出关注子节点变化事件的进行通知
 * @param type
 * @param children
 * @private
 */
Node.prototype._dispatchChildrenChanged = function(type, children) {
    var parent = this;
    var event = {
        source : this,
        type : type,
        children : children
    };
    while (parent) {
        if (parent._onChildrenChanged) {
            parent._onChildrenChanged.dispatch(event);
        }
        parent = parent.parent;
    }
};

/**
 * 通知孩子，节点的可视化信息发生了变化
 * @private
 */
Node.prototype._notifyVisibleChanged = function(isVisible) {
    if (this.onVisibleChange) this.onVisibleChange();

    var children = this._children;
    if (!children) children = this.children;
    var i = children.length;
    while (i--) {
        if (!children[i].visible) continue;
        children[i]._notifyVisibleChanged(isVisible);
    }
};

/**
 * 通知孩子，节点的缓存信息发生了变化
 * @private
 */
Node.prototype._notifyCacheChanged = function(enable) {
    this.cacheEnable = enable;

    var children = this._children;
    if (!children) children = this.children;
    var i = children.length;
    while (i--) {
        children[i]._notifyCacheChanged(enable);
    }
};

/**
 * 调用子孙的某个方法
 * @private
 */
Node.prototype._callChildrenFunc = function(funcName) {
    var func = this[funcName];
    if (func) func.apply(this, arguments);

    var children = this._children;
    if (!children) children = this.children;
    var i = children.length;
    while (i--) {
        var child = children[i];
        if (!child) continue;
        func = child[funcName];
        if (func) func.apply(child, arguments);
    }
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
Node.prototype.addListener = function(signal, listener, listenerContext, priority) {

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
Node.prototype.addListenerOnce = function(signal, listener, listenerContext, priority) {

    // 注册事件
    signal.addOnce(listener, listenerContext, priority);
};

/**
 * 手动移除事件关注
 * @method removeListener
 * @param {int} 监听编号
 */
Node.prototype.removeListener = function(id) {

    var eventData = this._events[id];
    if (!eventData)
        return;

    eventData[0].remove(eventData[1], eventData[2]);
    delete this._events[id];
};
