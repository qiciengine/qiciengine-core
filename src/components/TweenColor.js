/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 颜色渐变动画
 * @class qc.TweenAlpha
 */
var TweenColor = defineBehaviour('qc.TweenColor', qc.Tween, function() {
    var self = this;

    /**
     * @property {qc.Color} from - 起始的颜色值
     */
    self.from = Color.black;

    /**
     * @property {qc.Color} to - 最终的颜色值
     */
    self.to = Color.white;

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.COLOR,
    to : qc.Serializer.COLOR
});

// 菜单上的显示
TweenColor.__menu = 'Tween/TweenColor';

/**
 * 处理对应的变化逻辑
 * @param factor {number} - 形变的因子
 * @param isFinished {boolean} - 是否已经结束
 */
TweenColor.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from.rgb, _to = self.to.rgb;
    var currColor = [
        Phaser.Math.clamp(Math.round(_from[0] + factor * (_to[0] - _from[0])), 0, 255),
        Phaser.Math.clamp(Math.round(_from[1] + factor * (_to[1] - _from[1])), 0, 255),
        Phaser.Math.clamp(Math.round(_from[2] + factor * (_to[2] - _from[2])), 0, 255),
        Phaser.Math.clamp(self.from.alpha + factor * (self.to.alpha - self.from.alpha), 0, 1)
    ];
    var color = new Color(currColor);
    self.gameObject.colorTint = color;
};

/**
 * 将开始状态设成当前状态
 */
TweenColor.prototype.setStartToCurrValue = function() {
    this.gameObject.colorTint = new Color(this.from.toString());
};

/**
 * 将结束状态设成当前状态
 */
TweenColor.prototype.setEndToCurrValue = function() {
    this.gameObject.colorTint = new Color(this.to.toString());
};

/**
 * 将当前状态设为开始状态
 */
TweenColor.prototype.setCurrToStartValue = function() {
    this.from = new Color(this.gameObject.colorTint.toString());
};

/**
 * 将当前状态设置为结束状态
 */
TweenColor.prototype.setCurrToEndValue = function() {
    this.to = new Color(this.gameObject.colorTint.toString());
};

/**
 * 开始变色
 * @param node {qc.Node} - 需要变色的节点
 * @param duration {number} - 变色的时间
 * @param color {qc.Color} - 最终颜色
 * @returns {qc.TweenColor}
 */
TweenColor.begin = function(node, duration, color) {
    var tween = qc.Tween.begin('qc.TweenColor', node, duration);
    tween.from = new Color(node.colorTint.toString());
    tween.to  = color;
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};
