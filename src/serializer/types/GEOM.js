/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 给定的元素是不是几何类型
 * @param v
 * @returns {boolean}
 */
Serializer.prototype.isGeom = function(v) {
    return v instanceof qc.Circle ||
        v instanceof qc.Ellipse ||
        v instanceof qc.Line ||
        v instanceof qc.Matrix ||
        v instanceof qc.Polygon ||
        v instanceof qc.Rectangle ||
        v instanceof qc.RoundedRectangle ||
        v instanceof qc.Point;
}

/**
 * 几何元素序列化
 */
Serializer.prototype.saveGeom = function(ob, json, context, key, value) {
    json[key] = this._saveGeomItem(value, context);
}

/**
 * 几何元素反序列化
 */
Serializer.prototype.restoreGeom = function(ob, json, key, value) {
    ob[key] = this._restoreGeomItem(value);
}

/**
 * 序列化数组的一个元素
 * @private
 */
Serializer.prototype._saveGeomItem = function(value, context) {
    var type = Serializer.GEOM;
    if (value instanceof qc.Point)
        type = Serializer.POINT;
    else if (value instanceof qc.Rectangle)
        type = Serializer.RECTANGLE;
    else if (value instanceof qc.Circle)
        type = Serializer.CIRCLE;
    else if (value instanceof qc.Ellipse)
        type = Serializer.ELLIPSE;

    if (value)
        return [type, value.class, value.toJson()];
    else
        return null;
}

/**
 * 反序列化数组的一个元素
 * @private
 */
Serializer.prototype._restoreGeomItem = function(value) {
    if (!value) return null;

    // 第二个元素指明是哪个类（类名）
    var func = qc.Util.findClass(value[1]);
    var geom = new func();
    geom.fromJson(value[2]);
    return geom;
}
