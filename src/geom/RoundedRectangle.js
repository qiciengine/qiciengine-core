/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.RoundedRectangle = Phaser.RoundedRectangle;

/**
 * 类名
 */
Object.defineProperty(qc.RoundedRectangle.prototype, 'class', {
    get : function() { return 'qc.RoundedRectangle'; }
});

/**
 * 序列化
 */
qc.RoundedRectangle.prototype.toJson = function() {
    return [this.x, this.y, this.width, this.height, this.radius];
}

/**
 * 反序列化
 */
qc.RoundedRectangle.prototype.fromJson = function(v) {
    this.x = v[0];
    this.y = v[1];
    this.width = v[2];
    this.height = v[3];
    this.radius = v[4];
}
