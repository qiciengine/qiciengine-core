/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 音效元素序列化
 */
Serializer.prototype.saveAudio = function(ob, json, context, key, value) {
    json[key] = this._saveAudioItem(value, context);
}

/**
 * 音效元素反序列化
 */
Serializer.prototype.restoreAudio = function(ob, json, key, value) {
    ob[key] = this._restoreAudioItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveAudioItem = function(value, context) {
    if (!(value instanceof qc.SoundAsset)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });

    return [Serializer.AUDIO, value.key, value.uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreAudioItem = function(value) {
    if (!value) return null;

    var asset = this.game.assets.find(value[1]);
    if (!asset)
        asset = this.game.assets.findByUUID(value[2]);
    if (!asset) {
        console.error('音频资源尚未载入, 无法反序列化.', value[1]);
        return null;
    }

    return asset instanceof qc.SoundAsset ? asset : null;
}
