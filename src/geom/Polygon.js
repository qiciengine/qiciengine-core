/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Polygon = Phaser.Polygon;

/**
 * 类名
 */
Object.defineProperty(qc.Polygon.prototype, 'class', {
    get : function() { return 'qc.Polygon'; }
});

/**
 * 序列化
 */
qc.Polygon.prototype.toJson = function() {
    return [this.toNumberArray(), this.closed];
}

/**
 * 反序列化
 */
qc.Polygon.prototype.fromJson = function(v) {
    this.setTo(v[0]);
    this.closed = v[1];
}
