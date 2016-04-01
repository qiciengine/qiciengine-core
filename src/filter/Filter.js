/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * Filter 对象基类
 * 注意：
 * 着色器中，只能额外添加7个贴图
 * 配置贴图名为 bbbbb, 对应的坐标为aBbbbbCoord
 */
var Filter = qc.Filter = function(game) {
    Phaser.Filter.call(this, game);
    this._textureCount = 1;
    this.extraAttribute = [];
};
Filter.prototype = Object.create(Phaser.Filter.prototype);
Filter.prototype.constructor = Filter;

Object.defineProperties(Filter.prototype, {
    /**
     * @property {number} textureCount - 当前着色器使用的贴图数量
     */
    textureCount : {
        get : function() { return this._textureCount; }
    }
});

/**
 * 保存所有的自定义着色器
 * @type {{}}
 */
Filter.filters = {};

/**
 * 着色器可以用的绑定类型
 */
Filter.F1 = '1f';
Filter.F1V = '1fv';
Filter.I1 = '1i';
Filter.F2 = '2f';
Filter.F2V = '2fv';
Filter.I2 =  '2i';
Filter.I2V = '2iv';
Filter.F3 = '3f';
Filter.F3V = '3fv';
Filter.I3 = '3i';
Filter.I3V = '3iv';
Filter.F4 = '4f';
Filter.F4V = '4fv';
Filter.I4 = '4i';
Filter.I4V = '4iv';
Filter.MAT2 = 'mat2';
Filter.MAT3 = 'mat3';
Filter.MAT4 = 'mat4';
Filter.SAMPLER2D = 'sampler2D';

/**
 * 一个着色器中最大的贴图数量
 * @constant
 * @type {number}
 */
Filter.MAX_SAMPLE_COUNT = 8;

Filter.mixinUniform = function(ob, extra) {
    if (!extra)
        return;
    for (var name in extra) {
        var type = extra[name];
        var isSampler = type === Filter.SAMPLER2D;
        if (isSampler && ob.textureCount >= Filter.MAX_SAMPLE_COUNT) {
            continue;
        }
        var valueFunc = function() {
            var key = name;
            if (isSampler) {
                ob._textureCount++;
                return function() {
                    return ob[key] && ob[key].filterTexture;
                };
            }
            else {
                return function() {
                    return ob[key];
                };
            }

        };
        ob.uniforms[name] = new UniformHelp(type, valueFunc());
        if (isSampler) {
            var coordName = 'a' + name.substring(0,1).toUpperCase() + name.substring(1) + 'Coord';
            ob.extraAttribute.push({name : coordName, texture: name});
        }
    }
};

/**
 * 将一个 uniform 字段序列化
 * @param uniformType
 * @param value
 * @param context
 * @returns {*[]}
 */
Filter.uniformToJson = function(uniformType, value, context) {
    switch (uniformType) {
        case Filter.F1:
        case Filter.I1:
        case Filter.I2V:
        case Filter.F2V:
        case Filter.I3V:
        case Filter.F3V:
        case Filter.I4V:
        case Filter.F4V:
        case Filter.MAT2:
        case Filter.MAT3:
        case Filter.MAT4:
            return [uniformType, value];
        case Filter.I2:
        case Filter.F2:
            return [uniformType, [value.x, value.y]];
        case Filter.I3:
        case Filter.F3:
            return [uniformType, [value.x, value.y, value.z]];
        case Filter.I4:
        case Filter.F4:
            return [uniformType, [value.x, value.y, value.z, value.w]];
        case Filter.SAMPLER2D:
            if (!(value instanceof FilterTexture)) return [uniformType, []];
            var atlas = value.texture;
            if (atlas) {
                // 记录资源依赖
                context.dependences.push({
                    key : atlas.key,
                    uuid : atlas.uuid
                });
                return [uniformType, [atlas.key, atlas.url, atlas.uuid, value.frame]];    
            }
            else {
                return [uniformType, []];
            }
            
    }
    return [uniformType, []];
};

/**
 * 将一个 uniform 字段反序列化为值
 * @param ob
 * @param key
 * @param uniformType
 * @param value
 * @returns {*}
 */
Filter.uniformFromJson = function(game, ob, key, uniformType, value) {
    if (!value) {
        return;
    }
    switch (uniformType) {
        case Filter.F1:
        case Filter.I1:
        case Filter.I2V:
        case Filter.F2V:
        case Filter.I3V:
        case Filter.F3V:
        case Filter.I4V:
        case Filter.F4V:
        case Filter.MAT2:
        case Filter.MAT3:
        case Filter.MAT4:
            ob[key] = value;
            return;
        case Filter.I2:
        case Filter.F2:
            if (ob[key]) {
                ob[key].x = value[0];
                ob[key].y = value[1];
            }
            else {
                ob[key] = { x: value[0], y : value[1] };
            }
            return;
        case Filter.I3:
        case Filter.F3:
            if (ob[key]) {
                ob[key].x = value[0];
                ob[key].y = value[1];
                ob[key].z = value[2];
            }
            else {
                ob[key] = { x: value[0], y : value[1], z : value[2] };
            }
            return;
        case Filter.I4:
        case Filter.F4:
            if (ob[key]) {
                ob[key].x = value[0];
                ob[key].y = value[1];
                ob[key].z = value[2];
                ob[key].w = value[3];
            }
            else {
                ob[key] = { x: value[0], y : value[1], z : value[2], w : value[3] };
            }
            return;
        case Filter.SAMPLER2D:
            if (!value) return;
            var texture = new FilterTexture(game);
            if (value.length > 0) {
                var atlas = game.assets.find(value[0], value[1]);
                if (!atlas)
                    atlas = game.assets.findByUUID(value[2]);
                if (!atlas) {
                    game.log.error('Texture({0}) not loaded, deserialize fail.', value[1]);
                    return;
                }
                if (!(atlas instanceof qc.Atlas))
                    return;

                texture.texture = atlas;
                texture.frame = value[3];
            }
            ob[key] = texture;
            return;
    }
};

/**
 * 序列化一个着色器对象
 * @param ob
 * @param json
 * @param context
 * @param key
 * @param value
 * @private
 */
Serializer.prototype._saveFilter = function(ob, json, context, key, value) {
    if (value)
        json[key] = this._saveFilterItem(value, context);
};

/**
 * 反序列化一个着色器对象
 * @param ob
 * @param json
 * @param key
 * @param value
 * @private
 */
Serializer.prototype._restoreFilter = function(ob, json, key, value) {
    ob[key] = this._restoreFilterItem(value);
};

/**
 * 序列化一个着色器对象
 * @param value
 * @param context
 * @private
 */
Serializer.prototype._saveFilterItem = function(value, context) {
    var extra = value.getExtraUniforms();
    var json = {};
    for (var name in extra) {
        var type = extra[name];
        json[name] = Filter.uniformToJson(type, value[name], context);
    }
    return [Serializer.FILTER, value.class, json];
};

/**
 * 反序列化着色器
 * @param value
 * @returns {cls}
 * @private
 */
Serializer.prototype._restoreFilterItem = function(value) {
    var cls = qc.Util.findClass(value[1]);
    if (!cls) {
        console.warn('着色器脚本：{0}未找到，无法反序列化。', value[1]);
        return;
    }
    var uniforms = value[2];
    var filter = new cls(this.game);
    var extra = filter.getExtraUniforms();
    for (var name in extra) {
        var type = extra[name];
        if (!uniforms[name] || type !== uniforms[name][0]) {
            continue;
        }
        Filter.uniformFromJson(this.game, filter, name, type, uniforms[name][1]);
    }
    return filter;
};

/**
 * 定义一个着色器
 * @type {Function}
 */
var defineFilter = qc.defineFilter = function(clazz, parent, init, extraUniforms) {
// 先将clazz分解下，并创建包
    var arr = clazz.split('.');
    var curr = window;
    for (var i = 0; i < arr.length - 1; i++) {
        if (!curr[arr[i]]) curr[arr[i]] = {};
        curr = curr[arr[i]];
    }
    var name = arr[arr.length - 1];

    parent = parent || qc.Filter;
    if (typeof extraUniforms === 'function')
    // 指定了函数，则调用下取返回值
        extraUniforms = extraUniforms.call(this);
    extraUniforms = extraUniforms || {};
    curr[name] = function(game) {
        // 记录父亲和类名
        parent.call(this, game);
        this.class = clazz;
        this.super = parent.prototype;
        var uniforms = this.getExtraUniforms();
        Filter.mixinUniform(this, uniforms);

        // 调用初始化函数
        if (typeof init === 'function')
            init.call(this, game);
    }
    curr[name].prototype = Object.create(parent.prototype);
    curr[name].prototype.constructor = curr[name];

    // 设置需要同步到显卡的字段
    curr[name].prototype.getExtraUniforms = function() {
        var uniforms = parent.prototype.getExtraUniforms ? parent.prototype.getExtraUniforms.call(this) : {};
        // 合并下
        return mixin(uniforms, extraUniforms);
    };

    curr[name].prototype.clazz = clazz;

    Filter.filters[clazz] = curr[name];
    return curr[name];
};