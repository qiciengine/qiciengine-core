/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 淡入淡出动画组件
 * @class qc.TweenAlpha
 */
var TweenAlpha = defineBehaviour('qc.TweenAlpha', qc.Tween, function() {
    var self = this;

    /**
     * @property {number} from - 起始的透明度
     */
    self.from = 0;

    /**
     * @property {number} to - 最终的透明度
     */
    self.to = 1;

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.NUMBER,
    to : qc.Serializer.NUMBER
});

// 菜单上的显示
TweenAlpha.__menu = 'Tween/TweenAlpha';

// 帧调度: 驱动位置
TweenAlpha.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from, _to = self.to;
    self.gameObject.alpha = Phaser.Math.clamp(_from + factor * (_to - _from), 0, 1)
};

/**
 * 将开始状态设成当前状态
 */
TweenAlpha.prototype.setStartToCurrValue = function() {
    this.gameObject.alpha = this.from;
};

/**
 * 将结束状态设成当前状态
 */
TweenAlpha.prototype.setEndToCurrValue = function() {
    this.gameObject.alpha = this.to;
};

/**
 * 将当前状态设为开始状态
 */
TweenAlpha.prototype.setCurrToStartValue = function() {
    this.from = this.gameObject.alpha;
};

/**
 * 将当前状态设置为结束状态
 */
TweenAlpha.prototype.setCurrToEndValue = function() {
    this.to = this.gameObject.alpha;
};
/**
 * 开始透明化
 * @param node {qc.Node} - 需要改变的节点
 * @param duration {number} - 经历的时间
 * @param alpha {number} - 最终透明度
 * @returns {qc.TweenAlpha}
 */
TweenAlpha.begin = function(node, duration, alpha) {
    var tween = qc.Tween.begin('qc.TweenAlpha', node, duration);
    tween.from = node.alpha;
    tween.to  = alpha;
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};
