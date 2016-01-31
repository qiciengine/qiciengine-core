/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 文本资源序列化
 */
Serializer.prototype.saveTextAsset = function(ob, json, context, key, value) {
    json[key] = this._saveTextAssetItem(value, context);
};

/**
 * 文本元素反序列化
 */
Serializer.prototype.restoreTextAsset = function(ob, json, key, value) {
    ob[key] = this._restoreTextAssetItem(value);
};

/**
 * 序列化数组的一个文本资源
 * @private
 */
Serializer.prototype._saveTextAssetItem = function(value, context) {
    if (!(value instanceof qc.TextAsset)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });

    return [Serializer.TEXTASSET, value.key, value.uuid];
};

/**
 * 反序列化数组的一个文本资源
 * @private
 */
Serializer.prototype._restoreTextAssetItem = function(value) {
    if (!value) return null;

    var asset = this.game.assets.find(value[1]);
    if (!asset)
        asset = this.game.assets.findByUUID(value[2]);
    if (!asset) {
        console.error('文本资源尚未载入, 无法反序列化.', value[1]);
        return null;
    }

    return asset instanceof qc.TextAsset ? asset : null;
};
