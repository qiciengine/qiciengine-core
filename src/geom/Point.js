/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Point = Phaser.Point;

/**
 * 类名
 */
Object.defineProperty(qc.Point.prototype, 'class', {
    get : function() { return 'qc.Point'; }
});

/**
 * 序列化
 */
qc.Point.prototype.toJson = function() {
    return [this.x, this.y];
}

/**
 * 反序列化
 */
qc.Point.prototype.fromJson = function(v) {
    this.x = v[0];
    this.y = v[1];
}
