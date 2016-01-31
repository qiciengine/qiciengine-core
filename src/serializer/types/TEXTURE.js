/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 图集元素序列化
 */
Serializer.prototype.saveTexture = function(ob, json, context, key, value) {
    json[key] = this._saveTextureItem(value, context);
}

/**
 * 图集元素反序列化
 */
Serializer.prototype.restoreTexture = function(ob, json, key, value) {
    ob[key] = this._restoreTextureItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveTextureItem = function(value, context) {
    if (!(value instanceof qc.Atlas)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });
    return [Serializer.TEXTURE, value.key, value.uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreTextureItem = function(value) {
    if (!value) return null;

    var atlas = this.game.assets.find(value[1]);
    if (!atlas)
        atlas = this.game.assets.findByUUID(value[2]);
    if (!atlas) {
        console.error('贴图资源尚未载入，无法反序列化。', value[1]);
        return null;
    }
    if (!(atlas instanceof qc.Atlas)) return null;

    return atlas;
}
