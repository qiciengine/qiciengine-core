/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 序列化支持
 * 当前我们支持游戏数据序列化的类型有：
 * # number - 数字类型
 * # string - 字符串
 * # object - 普通类型的数值对
 * # texture - 贴图数据
 * # prefab - 预制资源(其他序列化后的游戏对象、场景等)
 * # array - 普通类型的数组
 * # prefab[] - 多个预制资源
 * # texture[] - 多个贴图资源
 * # node - 内部的node节点引用
 * # node[] - 内部多个node节点的引用
 * # audio - 音频数据
 *
 * @class qc.Serializer
 * @construct
 */
var Serializer = qc.Serializer = function(game) {
    this.game = game;
};

Serializer.prototype = {};
Serializer.prototype.constructor = Serializer;

// 自定义Node的反序列化方法，通常用于扩展Node
Serializer.customDeserializers = {};

/**
 * 序列化时所有支持的字段类型
 */
Serializer.AUTO = 0;
Serializer.INT  = 1;
Serializer.INTS = 2;        // 整数
Serializer.NUMBER  = 3;
Serializer.NUMBERS = 4;     // 数字
Serializer.BOOLEAN  = 5;
Serializer.BOOLEANS = 6;    // 布尔
Serializer.STRING  = 7;
Serializer.STRINGS = 8;     // 字符串
Serializer.MAPPING = 9;     // 数值对，value为字符串
Serializer.TEXTURE  = 10;
Serializer.TEXTURES = 11;   // 图集（贴图）
Serializer.AUDIO  = 12;
Serializer.AUDIOS = 13;     // 音效
Serializer.COLOR  = 14;     // 颜色
Serializer.COLORS = 15;     // 颜色数组
Serializer.PREFAB  = 16;
Serializer.PREFABS = 17;    // 预制
Serializer.NODE  = 18;
Serializer.NODES = 19;      // 场景节点
Serializer.SCRIPT  = 20;
Serializer.SCRIPTS = 21;    // 逻辑脚本
Serializer.GEOM  = 22;
Serializer.GEOMS = 23;      // 几何体，例如：点、线、矩形、圆等
Serializer.POINT  = 24;
Serializer.POINTS = 25;     // 点
Serializer.RECTANGLE  = 26;
Serializer.RECTANGLES = 27; // 矩形
Serializer.CIRCLE  = 28;
Serializer.CIRCLES = 29;    // 圆
Serializer.ELLIPSE  = 30;
Serializer.ELLIPSES = 31;   // 椭圆
Serializer.FONT = 32;       // 字体
Serializer.FONTS = 33;
Serializer.FILTER = 34;
Serializer.FILTERS = 35;    // 着色器
Serializer.TEXTASSET = 36;  // 文本资源
Serializer.TEXTASSETS = 37; // 文本资源数组
Serializer.EXCELASSET = 38; // Excel资源
Serializer.EXCELASSETS = 39; // Excel资源数组
Serializer.ACTION = 40;  // action
Serializer.ACTIONMANAGER = 41;  // action 管理器
Serializer.ANIMATOR = 42;  // action 或 action管理器
Serializer.ANIMATORS = 43;  // action 或 action管理器数组

/**
 * 打包一个Node节点
 * context为打包上下文信息
 */
Serializer.prototype.buildBundle = function(ob, context, json) {
    if (!context.dependences)
        // 初始化依赖项
        context.dependences = [];

    var meta = {};
    if (ob.getMeta)
        meta = ob.getMeta();
    json = json || {};
    for (var k in meta) {
        // 逐个字段序列化
        this.toJson(ob, json, context, k, ob[k], meta[k]);
    }

    // 返回object（这里不要打成字符串，免得递归调用时多次序列化，影响效率）
    return {
        class : ob.class,
        data : json,
        __json: ob.__json
    };
};

/**
 * 合并依赖资源(Node节点需要进一步调度，将所有孩子的依赖整合到根节点中)
 */
Serializer.prototype.combineDependence = function(context) {
    var list = {};
    for (var i in context.dependences) {
        var atlas = context.dependences[i];
        if (!list[atlas.uuid])
            list[atlas.uuid] = atlas;
    }
    return list;
};

/**
 * 还原出Node节点，第一遍还原时对于Node节点的引用，都只临时记录其path位置
 * 然后整个节点树构建完毕后再扫描path并赋值
 * awake事件需要在这些事情全部干完后才能派发
 */
Serializer.prototype.restoreBundle = function(json, parent, restoreChild) {
    if (!restoreChild) {
        // 初始化上下文环境
        this.restoreContext = {};
    }

    this.isRestoring = true;

    var uuid = json.data.uuid;
    if (this.game.nodePool.find(uuid))
        uuid = this.game.math.uuid();

    var ob = this.newNode(json.class, parent, uuid);
    if (json.__json) ob.__json = deepCopy(json.__json);

    // 逐个字段解析出来
    var meta = {};
    if (ob.getMeta)
        meta = ob.getMeta();
    var data = json.data;
    for (var k in meta) {
        this.fromJson(ob, data, k, meta[k]);
    }

    // 反序列化子孙的话，就不需要后续流程，等待根节点序列化完成后一次性执行就好了
    if (restoreChild) {
        // 派发node的反序列化完成事件
        if (ob.onDeserialized)
            ob.onDeserialized();

        return ob;
    }

    // 序列化Node节点的引用
    ob._restoreNodeRef();

    // 字段序列化完成后初始化一把
    ob._restoreInit();

    // 派发逻辑脚本的awake事件
    ob._dispatchAwake();

    // 派发 enable 事件
    ob._dispatchEnable();

    // 搞定收工
    this.restoreContext = {};
    this.isRestoring = false;
    return ob;
};

/**
 * 还原场景信息
 * @internal
 */
Serializer.prototype.restoreState = function(json) {
    // 先还原出所有子孙
    var arr = [];
    this.restoreContext = {};
    this.isRestoring = true;
    for (var i in json.children) {
        var child = this.restoreBundle(json.children[i], this.game.world, true);
        arr.push(child);
    }

    // 需要在世界节点上处理还原信息
    for (var i in arr) {
        arr[i]._restoreNodeRef();
    }
    for (var i in arr) {
        arr[i]._restoreInit();
    }
    for (var i in arr) {
        arr[i]._dispatchAwake();
    }
    for (var i in arr) {
        arr[i]._dispatchEnable();
    }

    // 清理下
    this.restoreContext = {};
    this.isRestoring = false;
};

/**
 * 序列化一个字段，并存入json中
 * @internal
 */
Serializer.prototype.toJson = function(ob, json, context, key, value, type) {
    type = type || Serializer.AUTO;

    if (typeof type === 'object' && typeof type.get === 'function' && typeof type.set === 'function') {
        // 自定义方法进行序列化
        json[key] = type.get.call(ob, ob, context);
        return;
    }

    switch (type) {
    case Serializer.AUTO:
        type = this.getAutoType(value);
        if (type === undefined) json[key] = value;
        else
            this.toJson(ob, json, context, key, value, type);
        break;

    case Serializer.INT:
    case Serializer.NUMBER:
    case Serializer.STRING:
    case Serializer.BOOLEAN:
        // 普通类型的序列化
        this._saveCommonType(ob, json, context, key, value, type);
        break;

    case Serializer.INTS:
    case Serializer.NUMBERS:
    case Serializer.STRINGS:
    case Serializer.BOOLEANS:
        // 普通类型数组的序列化
        this._saveCommonArray(ob, json, context, key, value, type);
        break;

    case Serializer.MAPPING:
        // 普通类型键值对的序列化
        this._saveMapping(ob, json, context, key, value, type);
        break;

    case Serializer.COLOR:
        this.saveColor(ob, json, context, key, value);
        break;
    case Serializer.COLORS:
        this._saveArray(ob, json, context, key, value, type, this._saveColorItem);
        break;

    case Serializer.GEOM:
    case Serializer.POINT:
    case Serializer.RECTANGLE:
    case Serializer.CIRCLE:
    case Serializer.ELLIPSE:
        // GEOM元素的序列化
        this.saveGeom(ob, json, context, key, value);
        break;

    case Serializer.POINTS:
    case Serializer.RECTANGLES:
    case Serializer.CIRCLES:
    case Serializer.ELLIPSES:
        // GEOM元素数组的序列化
        this._saveArray(ob, json, context, key, value, type, this._saveGeomItem);
        break;

    case Serializer.PREFAB:
        this.savePrefab(ob, json, context, key, value);
        break;
    case Serializer.PREFABS:
        this._saveArray(ob, json, context, key, value, type, this._savePrefabItem);
        break;

    case Serializer.TEXTURE:
        this.saveTexture(ob, json, context, key, value);
        break;
    case Serializer.TEXTURES:
        this._saveArray(ob, json, context, key, value, type, this._saveTextureItem);
        break;

    case Serializer.AUDIO:
        this.saveAudio(ob, json, context, key, value);
        break;
    case Serializer.AUDIOS:
        this._saveArray(ob, json, context, key, value, type, this._saveAudioItem);
        break;

    case Serializer.TEXTASSET:
        this.saveTextAsset(ob, json, context, key, value);
        break;
    case Serializer.TEXTASSETS:
        this._saveArray(ob, json, context, key, value, type, this._saveTextAssetItem);
        break;

    case Serializer.EXCELASSET:
        this.saveExcelAsset(ob, json, context, key, value);
        break;
    case Serializer.EXCELASSETS:
        this._saveArray(ob, json, context, key, value, type, this._saveExcelAssetItem);
        break;

    case Serializer.FONT:
        this.saveFont(ob, json, context, key, value);
        break;
    case Serializer.FONTS:
        this._saveArray(ob, json, context, key, value, type, this._saveFontItem);
        break;

    case Serializer.NODE:
        this.saveNode(ob, json, context, key, value);
        break;
    case Serializer.NODES:
        this._saveArray(ob, json, context, key, value, type, this._saveNodeItem);
        break;
    case Serializer.FILTER:
        this._saveFilter(ob, json, context, key, value);
        break;
    case Serializer.FILTERS:
        this._saveArray(ob, json, context, key, value, type, this._saveFilterItem);
        break;
    case Serializer.ACTION:
        this.saveAction(ob, json, context, key, value);
        break;
    case Serializer.ACTIONMANAGER:
        this.saveActionManager(ob, json, context, key, value);
        break;
    case Serializer.ANIMATOR:
        if (value instanceof qc.ActionAsset)
            this.saveAction(ob, json, context, key, value);
        else if (value instanceof qc.ActionManagerAsset)
            this.saveActionManager(ob, json, context, key, value);
        break;
    case Serializer.ANIMATORS:
        if (value)
        {
            json[key] = [type, []];
            for (var i in value) {
                var v = value[i];
                if (v instanceof qc.ActionAsset)
                    json[key][1].push(this._saveActionItem(v, context));
                else if (v instanceof qc.ActionManagerAsset)
                    json[key][1].push(this._saveActionManagerItem(v, context));
            }
        }
        break;
    default:
        throw new Error('unsupported asset type:' + type);
    }
}

/**
 * 反序列化
 * @internal
 */
Serializer.prototype.fromJson = function(ob, json, key, type) {
    type = type || Serializer.AUTO;
    if (typeof type === 'object' && typeof type.get === 'function' && typeof type.set === 'function') {
        // 自定义方法进行序列化
        type.set.call(ob, ob, json[key]);
        return;
    }

    // 先处理NULL的情形
    var value = json[key];
    if (value === undefined) {
        // 没有数据就不处理了
        return;
    }
    if (value === null || value === NaN) {
        // 空值
        ob[key] = value;
        return;
    }

    // 按类型赋值，第一个元素指明了数据类型
    switch (value[0]) {
    case Serializer.INT:
    case Serializer.NUMBER:
    case Serializer.STRING:
    case Serializer.BOOLEAN:
        // 普通的类型
        this._restoreCommonType(ob, json, key, value[0]);
        break;

    case Serializer.INTS:
    case Serializer.NUMBERS:
    case Serializer.STRINGS:
    case Serializer.BOOLEANS:
        // 普通类型数组
        this._restoreCommonArray(ob, json, key, value);
        break;

    case Serializer.MAPPING:
        // 普通类型键值对
        this._restoreMapping(ob, json, key, value);
        break;

    case Serializer.COLOR:
        this.restoreColor(ob, json, key, value);
        break;
    case Serializer.COLORS:
        this._restoreArray(ob, json, key, value, this._restoreColorItem);
        break;

    case Serializer.GEOM:
    case Serializer.POINT:
    case Serializer.RECTANGLE:
    case Serializer.CIRCLE:
    case Serializer.ELLIPSE:
        // GEOM元素的反序列化
        this.restoreGeom(ob, json, key, value);
        break;

    case Serializer.POINTS:
    case Serializer.RECTANGLES:
    case Serializer.CIRCLES:
    case Serializer.ELLIPSES:
        // GEOM元素数组的序列化
        this._restoreArray(ob, json, key, value, this._restoreGeomItem);
        break;

    case Serializer.PREFAB:
        this.restorePrefab(ob, json, key, value);
        break;
    case Serializer.PREFABS:
        this._restoreArray(ob, json, key, value, this._restorePrefabItem);
        break;

    case Serializer.TEXTURE:
        this.restoreTexture(ob, json, key, value);
        break;
    case Serializer.TEXTURES:
        this._restoreArray(ob, json, key, value, this._restoreTextureItem);
        break;

    case Serializer.EXCELASSET:
        this.restoreExcelAsset(ob, json, key, value);
        break;
    case Serializer.EXCELASSETS:
        this._restoreArray(ob, json, key, value, this._restoreExcelAssetItem);
        break;

    case Serializer.AUDIO:
        this.restoreAudio(ob, json, key, value);
        break;
    case Serializer.AUDIOS:
        this._restoreArray(ob, json, key, value, this._restoreAudioItem);
        break;

    case Serializer.TEXTASSET:
        this.restoreTextAsset(ob, json, key, value);
        break;
    case Serializer.TEXTASSETS:
        this._restoreArray(ob, json, key, value, this._restoreTextAssetItem);
        break;

    case Serializer.FONT:
        this.restoreFont(ob, json, key, value);
        break;
    case Serializer.FONTS:
        this._restoreArray(ob, json, key, value, this._restoreFontItem);
        break;

    case Serializer.NODE:
        this.restoreNode(ob, json, key, value);
        break;
    case Serializer.NODES:
        this.restoreNodes(ob, json, key, value);
        break;
    case Serializer.FILTER:
        this._restoreFilter(ob, json, key, value);
        break;
    case Serializer.FILTERS:
        this._restoreArray(ob, json, key, value, this._restoreFilterItem);
        break;
    case Serializer.ACTION:
        this.restoreAction(ob, json, key, value);
        break;
    case Serializer.ACTIONMANAGER:
        this.restoreActionManager(ob, json, key, value);
        break;
    case Serializer.ANIMATORS:
        var list = [];
        if (value) {
            // 逐一反序列化出来
            for (var i in value[1]) {
                if (value[1][i][0] === Serializer.ACTION)
                    list.push(this._restoreActionItem(value[1][i]));
                else if (value[1][i][0] === Serializer.ACTIONMANAGER)
                    list.push(this._restoreActionItem(value[1][i]));
            }
        }
        ob[key] = list;
        break;
    default:
        throw new Error('unsupported asset type:' + type);
    }
}

/**
 * base64字符串转普通字符串
 * @param str
 * @returns {string}
 */
Serializer.prototype.atob = function(str) {
    return decodeURIComponent(atob(str));
}

/**
 * 普通字符串转为base64
 * @param base
 */
Serializer.prototype.btoa = function(str) {
    return btoa(encodeURIComponent(str));
};

// 将 Uint8Array 转为 String
Serializer.prototype.unpackUTF8 = function(array) {
    var out, i, len, c;
    var char2, char3;
    var i = 0, len = array.length;

    out = "";
    while(i < len) {
        c = array[i++];
        switch(c >> 4)
        {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
            out += String.fromCharCode(c);
            break;
        case 12: case 13:
            // 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
        case 14:
            // 1110 xxxx  10xx xxxx  10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
            break;
        }
    }

    return out;
};

/**
 * 取得key对应的节点引用
 * @param key
 * @internal
 */
Serializer.prototype.findNodeRef = function(key) {
    var k = this.restoreContext[key] ? this.restoreContext[key] : key;
    return this.game.nodePool.find(k);
};
