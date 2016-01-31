/**
 * @author chenx
 * @date 2015.1.2
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  color 线性渐变类型的 action 属性处理类
 */

var ColorLinearProp = qc.ColorLinearProp = function(action, path, propertyId) {

    var self = this;
    qc.LinearProp.call(self, action, path, propertyId);
};
ColorLinearProp.prototype = Object.create(qc.LinearProp.prototype);
ColorLinearProp.prototype.constructor = ColorLinearProp;

// 计算两点间的线性插值的 color
ColorLinearProp.prototype.calcValue = function(from, to, factor) {
    if (!from || !to)
        return qc.Color.white;

    var _from = from.rgb, _to = to.rgb;
    var currColor = [
        Phaser.Math.clamp(Math.round(_from[0] + factor * (_to[0] - _from[0])), 0, 255),
        Phaser.Math.clamp(Math.round(_from[1] + factor * (_to[1] - _from[1])), 0, 255),
        Phaser.Math.clamp(Math.round(_from[2] + factor * (_to[2] - _from[2])), 0, 255),
        Phaser.Math.clamp(from.alpha + factor * (to.alpha - from.alpha), 0, 1)
    ];
    var color = new Color(currColor);

    return color;
}
