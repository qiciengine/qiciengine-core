/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 预制元素序列化
 */
Serializer.prototype.savePrefab = function(ob, json, context, key, value) {
    json[key] = this._savePrefabItem(value, context);
}

/**
 * 预制元素反序列化
 */
Serializer.prototype.restorePrefab = function(ob, json, key, value) {
    ob[key] = this._restorePrefabItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._savePrefabItem = function(value, context) {
    if (!(value instanceof Prefab)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.uuid,
        uuid : value.uuid
    });
    return [Serializer.PREFAB, value.uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restorePrefabItem = function(value) {
    if (!value) return null;

    var ob = this.game.assets.findByUUID(value[1]);
    return ob instanceof Prefab ? ob : null;
}
