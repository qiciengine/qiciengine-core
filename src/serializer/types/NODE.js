/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 节点元素序列化
 */
Serializer.prototype.saveNode = function(ob, json, context, key, value) {
    json[key] = this._saveNodeItem(value, context);
}

/**
 * 节点元素反序列化
 */
Serializer.prototype.restoreNode = function(ob, json, key, value) {
    // 场景内其他节点，先只记录其标识符
    ob['__BUILTIN_NODE__' + key] = value[1];
}

/**
 * 反序列化多个节点
 */
Serializer.prototype.restoreNodes = function(ob, json, key, value) {
    // 场景内其他节点，先只记录其标识符
    ob['__BUILTIN_NODE_ARRAY__' + key] = value[1];
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveNodeItem = function(value, context) {
    if (!(value instanceof qc.Node)) return null;

    return [Serializer.NODE, value.uuid];
}
