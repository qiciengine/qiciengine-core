/**
 * @author chenx
 * @date 2015.12.29
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * action 序列化
 */
Serializer.prototype.saveAction = function(ob, json, context, key, value) {
    json[key] = this._saveActionItem(value, context);
}

/**
 *  action 反序列化
 */
Serializer.prototype.restoreAction = function(ob, json, key, value) {
    ob[key] = this._restoreActionItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveActionItem = function(value, context) {
    if (!(value instanceof qc.ActionAsset)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });
    return [Serializer.ACTION, value.uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreActionItem = function(value) {
    if (!value) return null;

    var ob = this.game.assets.findByUUID(value[1]);
    return ob instanceof qc.ActionAsset ? ob : null;
}
