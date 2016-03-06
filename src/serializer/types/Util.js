/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 序列化与反序列化的一些公共逻辑
 */

/**
 * 注册自定义Node的反序列化方法
 */
Serializer.registerCustomDeserializer = function(clazz, method) {
    var methods = Serializer.customDeserializers;

    if (methods[clazz]) {
        console.error('Duplicate custom deserializer');
        return;
    }
    methods[clazz] = method;
}

/**
 * 自动判定元素序列化的类型
 */
Serializer.prototype.getAutoType = function(v) {
    if (v === undefined || v === null || v === NaN) return undefined;
    if (typeof v === 'number') return Serializer.NUMBER;
    if (typeof v === 'string') return Serializer.STRING;
    if (typeof v === 'boolean') return Serializer.BOOLEAN;
    if (v instanceof qc.Node) return Serializer.NODE;
    if (v instanceof qc.Texture) return Serializer.TEXTURE;
    if (v instanceof qc.SoundAsset) return Serializer.AUDIO;
    if (v instanceof qc.TextAsset) return Serializer.TEXTASSET;
    if (v instanceof qc.ActionAsset) return Serializer.ACTION;
    if (v instanceof qc.ActionManagerAsset) return Serializer.ACTIONMANAGER;
    if (this.isGeom(v)) return Serializer.GEOM;

    console.error(v);
    throw new Error('');
};

/**
 * 根据类名构造组件
 */
Serializer.prototype.newNode = function(clazz, parent, uuid) {
    switch (clazz) {
    case 'qc.UIImage':
        return this.game.add.image(parent, uuid);
    case 'qc.Sprite':
        return this.game.add.sprite(parent, uuid);
    case 'qc.UIRoot':
        return new qc.UIRoot(this.game, uuid);
    case 'qc.Button':
        return this.game.add.button(parent, uuid);
    case 'qc.Toggle':
        return new qc.Toggle(this.game, parent, uuid);
    case 'qc.UIText':
        return this.game.add.text(parent, uuid);
    case 'qc.Sound':
        return this.game.add.sound(parent, uuid);
    case 'qc.Node':
        return this.game.add.node(parent, uuid);
    case 'qc.ScrollView':
        return this.game.add.scrollView(parent, uuid);
    case 'qc.ScrollBar':
        return this.game.add.scrollBar(parent, false, uuid);
    case 'qc.InputField':
        return this.game.add.inputField(parent, uuid);
    case 'qc.ProgressBar':
        return this.game.add.progressBar(parent, false, uuid);
    case 'qc.Slider':
        return this.game.add.slider(parent, false, uuid);
    case 'qc.Tilemap':
        return this.game.add.tilemap(parent, uuid);
    case 'qc.TileLayer':
        return this.game.add.tileLayer(parent, uuid);
    case 'qc.ObjectLayer':
        return this.game.add.objectLayer(parent, uuid);
    case 'qc.Dom':
        return this.game.add.dom(parent, uuid);
    case 'qc.Graphics':
        return this.game.add.graphics(parent, uuid);
    case 'qc.Dropdown':
        return this.game.add.dropdown(parent, uuid);
    default:
        // 尝试查找自定义构造方法，通常用于用户扩展的Node
        var method = Serializer.customDeserializers[clazz];
        if (method)
            return method(this.game, parent, uuid);
        else
            throw new Error('unsupported class:' + clazz);
    }
};

/**
 * 序列化普通的类型，直接记录其数据即可
 * @private
 */
Serializer.prototype._saveCommonType = function(ob, json, context, key, value, type) {
    json[key] = [type, value];
};

/**
 * 反序列化普通的类型
 * @private
 */
Serializer.prototype._restoreCommonType = function(ob, json, key, type) {
    // 直接给值
    ob[key] = json[key][1];
};

/**
 * 序列化普通类型数组
 * @private
 */
Serializer.prototype._saveCommonArray = function(ob, json, context, key, value, type) {
    json[key] = [type, []];
    if (!value) return;

    for (var i in value) {
        json[key][1].push(value[i]);
    }
};

/**
 * 反序列化普通类型数组
 * @private
 */
Serializer.prototype._restoreCommonArray = function(ob, json, key, value) {
    var list = [];
    if (value) {
        for (var i in value[1]) {
            list.push(value[1][i]);
        }
    }
    ob[key] = list;
};

/**
 * 序列化普通类型键值对
 * @private
 */
Serializer.prototype._saveMapping = function(ob, json, context, key, value, type) {
    json[key] = [type, {}];
    if (!value) return;

    for (var i in value) {
        json[key][1][i] = value[i];
    }
};

/**
 * 反序列化普通类型键值对
 * @private
 */
Serializer.prototype._restoreMapping = function(ob, json, key, value) {
    var map = {};
    if (value) {
        for (var i in value[1]) {
            map[i] = value[1][i];
        }
    }
    ob[key] = map;
};

/**
 * 序列化一个数组，里面的元素交给回调处理
 * @private
 */
Serializer.prototype._saveArray = function(ob, json, context, key, value, type, func) {
    json[key] = [type, []];
    if (!value) return;

    // 逐一元素打包
    for (var i in value) {
        var v = value[i];
        var result = func.call(this, v, context);
        json[key][1].push(result);
    }
};

/**
 * 反序列化一个数组，里面的元素交给回调来反序列化
 * @private
 */
Serializer.prototype._restoreArray = function(ob, json, key, value, func) {
    var self = this;
    var list = [];
    if (value) {
        // 逐一反序列化出来
        for (var i in value[1]) {
            list.push(func.call(this, value[1][i], self));
        }
    }
    ob[key] = list;
};
