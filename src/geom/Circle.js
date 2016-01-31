/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Circle = Phaser.Circle;

/**
 * 类名
 */
Object.defineProperty(qc.Circle.prototype, 'class', {
    get : function() { return 'qc.Circle'; }
});

/**
 * 序列化
 */
qc.Circle.prototype.toJson = function() {
    return [this.x, this.y, this.diameter];
}

/**
 * 反序列化
 */
qc.Circle.prototype.fromJson = function(v) {
    this.x = v[0];
    this.y = v[1];
    this.diameter = v[2];
}
