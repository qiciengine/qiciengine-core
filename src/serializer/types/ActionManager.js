/**
 * @author chenx
 * @date 2015.12.29
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * action manager 序列化
 */
Serializer.prototype.saveActionManager = function(ob, json, context, key, value) {
    json[key] = this._saveActionManagerItem(value, context);
}

/**
 *  action manager 反序列化
 */
Serializer.prototype.restoreActionManager = function(ob, json, key, value) {
    ob[key] = this._restoreActionManagerItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveActionManagerItem = function(value, context) {
    if (!(value instanceof qc.ActionManagerAsset)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });
    return [Serializer.ACTIONMANAGER, value.uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreActionManagerItem = function(value) {
    if (!value) return null;

    var ob = this.game.assets.findByUUID(value[1]);
    return ob instanceof qc.ActionManagerAsset ? ob : null;
}
