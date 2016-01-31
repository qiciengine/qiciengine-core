/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 字体元素序列化
 */
Serializer.prototype.saveFont = function(ob, json, context, key, value) {
    json[key] = this._saveFontItem(value, context);
}

/**
 * 字体元素反序列化
 */
Serializer.prototype.restoreFont = function(ob, json, key, value) {
    ob[key] = this._restoreFontItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveFontItem = function(value, context) {
    if (value instanceof qc.Font) {
        var font = value;
    }

    if (font && font instanceof qc.Font) {
        // 记录资源依赖
        context.dependences.push({
            key : font.key,
            uuid : font.uuid
        });
        var uuid = font.uuid;
        value = font.key;
    }
    return [Serializer.FONT, value, uuid];
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreFontItem = function(value, self) {
    if (!value) return null;

    self = self || this;
    var asset = self.game.assets.find(value[1]);
    if (!asset)
        asset = self.game.assets.findByUUID(value[2]);
    if (!asset) {
        asset = value[1];
    }

    return asset;
}