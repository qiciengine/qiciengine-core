/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Matrix = Phaser.Matrix;

/**
 * 类名
 */
Object.defineProperty(qc.Matrix.prototype, 'class', {
    get : function() { return 'qc.Matrix'; }
});

/**
 * 序列化
 */
qc.Matrix.prototype.toJson = function() {
    return this.toArray();
}

/**
 * 反序列化
 */
qc.Matrix.prototype.fromJson = function(v) {
    this.fromArray(v);
}
