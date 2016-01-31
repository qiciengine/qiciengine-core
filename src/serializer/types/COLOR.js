/**
 * Created by luohj on 15/6/2.
 */

/**
 * Color元素序列化
 */
Serializer.prototype.saveColor = function(ob, json, context, key, value) {
    json[key] = this._saveColorItem(value);
}

/**
 * Color元素反序列化
 */
Serializer.prototype.restoreColor = function(ob, json, key, value) {
    ob[key] = this._restoreColorItem(value);
}

/**
 * 序列化qc.Color数组的一个元素
 * @private
 */
Serializer.prototype._saveColorItem = function(value) {
    if (!(value instanceof Color)) return null;
    return [Serializer.COLOR, value.toNumber(true)];
}

/**
 * 反序列化Color数组的一个元素
 * @private
 */
Serializer.prototype._restoreColorItem = function(value) {
    if (!value) return null;

    return new Color(value[1]);
}