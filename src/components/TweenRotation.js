/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 旋转动画组件
 * @class qc.TweenAlpha
 */
var TweenRotation = defineBehaviour('qc.TweenRotation', qc.Tween, function() {
    var self = this;

    /**
     * @property {number} from - 起始的弧度
     */
    self.from = 0;

    /**
     * @property {number} to - 最终的弧度
     */
    self.to = 1;

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.NUMBER,
    to : qc.Serializer.NUMBER
});

// 菜单上的显示
TweenRotation.__menu = 'Tween/TweenRotation';

// 帧调度: 驱动动画
TweenRotation.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from, _to = self.to;
    self.gameObject.rotation = _from + factor * (_to - _from);
};

/**
 * 将开始状态设成当前状态
 */
TweenRotation.prototype.setStartToCurrValue = function() {
    this.gameObject.rotation = this.from;
};

/**
 * 将结束状态设成当前状态
 */
TweenRotation.prototype.setEndToCurrValue = function() {
    this.gameObject.rotation = this.to;
};

/**
 * 将当前状态设为开始状态
 */
TweenRotation.prototype.setCurrToStartValue = function() {
    this.from = this.gameObject.rotation;
};

/**
 * 将当前状态设置为结束状态
 */
TweenRotation.prototype.setCurrToEndValue = function() {
    this.to = this.gameObject.rotation;
};

/**
 * 开始旋转
 * @param node {qc.Node} - 需要旋转的节点
 * @param duration {number} - 变色的时间
 * @param rotation {number} - 最终旋转角度
 * @returns {qc.TweenAlpha}
 */
TweenRotation.begin = function(node, duration, rotation) {
    var tween = qc.Tween.begin('qc.TweenRotation', node, duration);
    tween.from = node.rotation;
    tween.to  = rotation;
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};