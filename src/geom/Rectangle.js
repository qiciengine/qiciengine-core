/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Rectangle = Phaser.Rectangle;

/**
 * 类名
 */
Object.defineProperty(qc.Rectangle.prototype, 'class', {
    get : function() { return 'qc.Rectangle'; }
});

/**
 * 序列化
 */
qc.Rectangle.prototype.toJson = function() {
    return [this.x, this.y, this.width, this.height];
}

/**
 * 反序列化
 */
qc.Rectangle.prototype.fromJson = function(v) {
    this.setTo(v[0], v[1], v[2], v[3]);
}
