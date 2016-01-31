/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Excel资源序列化
 */
Serializer.prototype.saveExcelAsset = function(ob, json, context, key, value) {
    json[key] = this._saveExcelAssetItem(value, context);
};

/**
 * Excel元素反序列化
 */
Serializer.prototype.restoreExcelAsset = function(ob, json, key, value) {
    ob[key] = this._restoreExcelAssetItem(value);
};

/**
 * 序列化数组的一个Excel资源
 * @private
 */
Serializer.prototype._saveExcelAssetItem = function(value, context) {
    if (!(value instanceof qc.ExcelAsset)) return null;

    // 记录资源依赖
    context.dependences.push({
        key : value.key,
        uuid : value.uuid
    });

    return [Serializer.EXCELASSET, value.key, value.uuid];
};

/**
 * 反序列化数组的一个Excel资源
 * @private
 */
Serializer.prototype._restoreExcelAssetItem = function(value) {
    if (!value) return null;

    var asset = this.game.assets.find(value[1]);
    if (!asset)
        asset = this.game.assets.findByUUID(value[2]);
    if (!asset) {
        return null;
    }

    return asset instanceof qc.ExcelAsset ? asset : null;
};
