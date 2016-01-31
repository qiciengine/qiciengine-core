/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * @property {string} class - 类名字
 * @readonly
 * @internal
 */
Object.defineProperty(Node.prototype, 'class', {
    get : function() { return 'qc.Node' }
});

/**
 * Node需要序列化的属性描述
 */
Node.prototype.getMeta = function() {
    var s = qc.Serializer;
    var self = this;
    return {
        // 基础信息
        uuid : {
            type : s.STRING,
            get : function(ob, context) {
                return ob.uuid;
            },
            set : function(context, v) {
                // 记录新的uuid与旧的关系
                self.game.serializer.restoreContext[v] = self.uuid;
            }
        },
        _prefab : s.STRING,
        __lock : s.BOOLEAN,
        name : s.STRING,
        ignoreDestroy : s.BOOLEAN,
        alpha : s.NUMBER,
        visible : s.BOOLEAN,
        colorTint : s.COLOR,
        static : s.BOOLEAN,
        scripts : {
            get : function(ob, context) {
                return self._packScripts.call(ob, context);
            },
            set : function(context, v) {
                self._unpackScripts.call(context, v);
            }
        },

        // 位置相关部分的序列化
        position : {
            get : function(ob, context) {
                return [ob.pivotX, ob.pivotY, ob.anchoredX, ob.anchoredY, // 0
                    ob.x, ob.y, ob.width, ob.height,                      // 4
                    ob.left, ob.right, ob.top, ob.bottom,                 // 8
                    ob.minAnchor.x, ob.minAnchor.y, ob.maxAnchor.x, ob.maxAnchor.y // 12
                ];
            },
            set : function(context, v) {
                // 注意反序列化的顺序
                var ob = context;
                ob._minAnchor = new qc.Point(v[12], v[13]);
                ob._maxAnchor = new qc.Point(v[14], v[15]);
                ob.phaser.anchor = new qc.Point(v[0], v[1]);
                ob._anchoredX = v[2];
                ob._anchoredY = v[3];

                // 根据情况确定使用边距还是长宽
                if (ob._minAnchor.x < ob._maxAnchor.x) {
                    ob._left = v[8];
                    ob._right = v[9];
                }
                else {
                    ob.setWidth(v[6]);
                }
                if (ob._minAnchor.y < ob._maxAnchor.y) {
                    ob._top = v[10];
                    ob._bottom = v[11];
                }
                else {
                    ob.setHeight(v[7]);
                }
                ob.relayout();
            }
        },
        scaleX : s.NUMBER,
        scaleY : s.NUMBER,
        rotation : s.NUMBER,

        // 交互信息
        serializeHitArea : s.AUTO,

        interactive : s.BOOLEAN,

        isFiltersThrough : s.BOOLEAN,

        // 孩子应该在最后面再来序列化和反序列化
        children : {
            get : function(ob, context) {
                return self._packChildren.call(ob, context);
            },
            set : function(context, v) {
                self._unpackChildren.call(context, v);
            }
        }
    };
};

/**
 * 序列化我的孩子
 * @private
 */
Node.prototype._packChildren = function(context) {
    var children = this.children;
    if (children.length === 0)
        return [];

    // 如果是Text/Sprite等，就不要序列化孩子了（不能挂载其他节点）
    if (this instanceof qc.UIText || this instanceof qc.Sprite)
        return [];

    var list = [];
    for (var i in children) {
        var child = children[i];
        var json = this.game.serializer.buildBundle(child, context);
        list.push(json);
    }
    return list;
};

/**
 * 反序列化我的孩子列表
 * @private
 */
Node.prototype._unpackChildren = function(data) {
    for (var i in data) {
        var child = this.game.serializer.restoreBundle(data[i], this, true);
    }
};

/**
 * 序列化挂载的脚本
 * @private
 */
Node.prototype._packScripts = function(context) {
    var scripts = this.scripts;
    if (!scripts || scripts.length === 0)
        return [];

    var list = [];
    for (var i in scripts) {
        var c = scripts[i],
            data = null;
        if (c._clazz === 'qc.NonexistScript') {
            // 丢失的脚本组件特殊处理下
            list.push({
                clazz: c.script,
                data: c.data.uuid[1]
            });
            continue;
        }
        else {
            if (this.__json && this.__json[c.uuid]) {
                data = this.__json[c.uuid].data;
            }
            data = this.game.serializer.buildBundle(c, context, data);
        }
        
        list.push({
            clazz: c._clazz,
            data: c.uuid
        });
        
        // 记录下序列化结果
        if (!this.__json) {
            this.__json = {
            };
        }
        this.__json[c.uuid] = data;
    }
    return list;
};

/**
 * 反序列化挂载的脚本
 * @private
 */
Node.prototype._unpackScripts = function(data) {
    for (var i in data) {
        var scriptJson = data[i];
        var d = scriptJson.data;
        if (typeof d === 'string') {
            // 兼容旧版本(新版本从__json中获取)
            d = this.__json[d].data;
        }
        else {
            d = d.data;
        }
        
        var clazz = qc.Util.findClass(scriptJson.clazz);
        if (typeof clazz !== 'function') {
            if (d && d.uuid) {
                var c = this.addScript('qc.NonexistScript');
                c.script = scriptJson.clazz;
                c.data = d;
            }
            console.error('Class: ' + scriptJson.clazz + ' is not exist!');
            continue;
        }
        
        try {
            // 还原出脚本的属性信息
            var c = this.addScript(scriptJson.clazz, false);
            var meta = {};
            if (c.getMeta)
                meta = c.getMeta();
            for (var k in meta) {
                try {
                    this.game.serializer.fromJson(c, d, k, meta[k]);    
                }
                catch (e) {
                    console.error('Deserialize fail!', e);
                    qc.Util.popupError(e.message); 
                }
            }  
        }
        catch (e) {
            console.error('Deserialize error!', e);
            qc.Util.popupError(e.message); 
        }
    }
    
    if (!this.game.device.editor) {
        delete this.__json;
    }
};

/**
 * 查找节点ob相对于本节点的路径（序列化时需要获取到），例如：
 * /ob
 * /../../p2/ob
 *
 * @private
 */
Node.prototype._findPath = function(ob, searchParent) {
    var path = '';
    if (ob === this) return path;
    if (searchParent === undefined) searchParent = true;

    // 在我的孩子中寻找
    var children = this.children;
    for (var i in children) {
        var node = children[i];
        var path2 = node._findPath(ob, false);
        if (path2 === '') {
            // 找到了，孩子即为目标节点
            path += node.name;
            return path;
        }
        else if (path2) {
            // 孩子的子孙为目标节点
            path += node.name + '/' + path2;
            return path;
        }
    }

    // 在我的孩子中还是没有找到，需要王父亲节点上查找了
    if (!searchParent) return null;
    var curr = this.parent;
    path += '/..';
    while (curr !== this.game.stage) {
        var path2 = curr._findPath(ob, false);
        if (path2 === '') {
            // 找到了，祖先即为目标节点
            return path;
        }
        else if (path2) {
            // 找到了，祖先的子孙为目标节点
            path += "/" + path2;
            return path;
        }

        // 继续下一级查找
        curr = curr.parent;
        path += '/..';
    }

    // 没有找到
    return null;
};

/**
 * 关联Node的引用关系
 * @private
 */
Node.prototype._restoreNodeRef = function() {
    // 还原我的关联和所有逻辑脚本的关联
    var meta = {};
    if (this.getMeta)
        meta = this.getMeta();
    for (var k in meta) {
        // 处理单个节点
        var k2 = '__BUILTIN_NODE__' + k;
        if (this[k2] && typeof this[k2] === 'string') {
            this[k] = this.game.serializer.findNodeRef(this[k2]);
            delete this[k2];
        }

        // 处理多个节点
        var k3 = '__BUILTIN_NODE_ARRAY__' + k;
        if (this[k3] && typeof this[k3] === 'object') {
            var list = [];
            for (var i in this[k3]) {
                if (this[k3][i] && this[k3][i][1])
                    list.push(this.game.serializer.findNodeRef(this[k3][i][1]));
                else
                    list.push(null);
            }
            this[k] = list;
            delete this[k3];
        }
    }
    for (var i in this.scripts) {
        // 处理单个节点
        var script = this.scripts[i];
        var meta = {};
        if (script.getMeta)
            meta = script.getMeta();
        for (var k in meta) {
            var k2 = '__BUILTIN_NODE__' + k;
            if (script[k2] && typeof script[k2] === 'string') {
                script[k] = this.game.serializer.findNodeRef(script[k2]);
                delete script[k2];
            }

            // 处理多个节点
            var k3 = '__BUILTIN_NODE_ARRAY__' + k;
            if (script[k3] && typeof script[k3] === 'object') {
                var list = [];
                for (var i in script[k3]) {
                    if (script[k3][i] && script[k3][i][1])
                        list.push(this.game.serializer.findNodeRef(script[k3][i][1]));
                    else
                        list.push(null);
                }
                script[k] = list;
                delete script[k3];
            }
        }
    }

    // 还原我的孩子
    var children = this.children;
    for (var k in children) {
        children[k]._restoreNodeRef();
    }
};

/**
 * 字段序列化完成后的处理工作
 * @private
 */
Node.prototype._restoreInit = function() {
    this._initGetSetField();

    // 调用所有脚本的初始化工作
    for (var i in this.scripts) {
        var script = this.scripts[i];
        if (script._restoreInit)
            script._restoreInit();
    }

    // 所有孩子也派发下
    var children = this.children;
    for (var k in children) {
        children[k]._restoreInit();
    }
};

/**
 * 序列化完成后派发awake事件
 * @private
 */
Node.prototype._dispatchAwake = function() {
    // 通知所有的孩子派发本事件
    var children = this.children;
    for (var k in children) {
        children[k]._dispatchAwake();
    }

    // 所有的脚本派发awake事件
    for (var s in this.scripts) {
        var script = this.scripts[s];

        // 编辑器模式下不要派发（如果不声明runInEditor）
        if (this.game.device.editor === true && !script.runInEditor) continue;
        if (script.awake)
            script.awake.call(script);
    }
};

/**
 * 序列化完成后派发enable事件
 * @private
 */
Node.prototype._dispatchEnable = function() {
    // 通知所有的孩子派发本事件
    var children = this.children;
    for (var k in children) {
        children[k]._dispatchEnable();
    }

    // 所有的脚本派发enable事件
    for (var s in this.scripts) {
        var script = this.scripts[s];

        // 编辑器模式下不要派发（如果不声明runInEditor）
        if (this.game.device.editor === true && !script.runInEditor) continue;
        if (script.enable && script.onEnable)
            script.onEnable();
    }
};

/**
 * get/set字段序列化完的初始化工作
 * @private
 */
Node.prototype._initGetSetField = function() {
    var list = this.__GET_SET__;
    if (!list) return;

    for (var i in list) {
        var field = list[i];
        this[field] = this['__BUILTIN_SET__' + field];
        delete this['__BUILTIN_SET__' + field];
    }
    delete this.__GET_SET__;
};

/**
 * get/set字段的反序列化
 * @private
 */
var _CUSTOM_FIELD = function(field, type) {
    return {
        type : type,
        get : function(context) { return context[field]; },
        set : function(context, v) {
            context['__BUILTIN_SET__' + field] = v;

            // 记录下字段
            if (context.__GET_SET__) context.__GET_SET__.push(field);
            else
                context.__GET_SET__ = [ field ];
        }
    };
};