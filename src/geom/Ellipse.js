/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.Ellipse = Phaser.Ellipse;

/**
 * 类名
 */
Object.defineProperty(qc.Ellipse.prototype, 'class', {
    get : function() { return 'qc.Ellipse'; }
});

/**
 * 序列化
 */
qc.Ellipse.prototype.toJson = function() {
    return [this.x, this.y, this.width, this.height];
}

/**
 * 反序列化
 */
qc.Ellipse.prototype.fromJson = function(v) {
    this.x = v[0];
    this.y = v[1];
    this.width = v[2];
    this.height = v[3];
}
