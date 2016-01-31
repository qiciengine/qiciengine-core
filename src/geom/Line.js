/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Line = Phaser.Line;

/**
 * 类名
 */
Object.defineProperty(qc.Line.prototype, 'class', {
    get : function() { return 'qc.Line'; }
});

/**
 * 序列化
 */
qc.Line.prototype.toJson = function() {
    return [this.start.x, this.start.y, this.end.x, this.end.y];
}

/**
 * 反序列化
 */
qc.Line.prototype.fromJson = function(v) {
    this.start.setTo(v[0], v[1]);
    this.end.setTo(v[2], v[3]);
}

