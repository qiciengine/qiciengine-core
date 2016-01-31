/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */;

/**
 * 缩放动画组件
 * @class qc.TweenAlpha
 */
var TweenScale = defineBehaviour('qc.TweenScale', qc.Tween, function() {
    var self = this;

    /**
     * @property {qc.Point} from - 起始的缩放信息
     */
    self.from = new qc.Point(0, 0);

    /**
     * @property {qc.Point} to - 最终的缩放信息
     */
    self.to = new qc.Point(1, 1);

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.POINT,
    to : qc.Serializer.POINT
});

// 菜单上的显示
TweenScale.__menu = 'Tween/TweenScale';

// 帧调度: 驱动动画
TweenScale.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from, _to = self.to;
    var scale = new qc.Point(
        _from.x + factor * (_to.x - _from.x),
        _from.y + factor * (_to.y - _from.y)
    );

    self.gameObject.scaleX = scale.x;
    self.gameObject.scaleY = scale.y;
};

/**
 * 将开始状态设成当前状态
 */
TweenScale.prototype.setStartToCurrValue = function() {
    this.gameObject.scaleX = this.from.x;
    this.gameObject.scaleY = this.from.y;
};

/**
 * 将结束状态设成当前状态
 */
TweenScale.prototype.setEndToCurrValue = function() {
    this.gameObject.scaleX = this.to.x;
    this.gameObject.scaleY = this.to.y;
};

/**
 * 将当前状态设为开始状态
 */
TweenScale.prototype.setCurrToStartValue = function() {
    this.from = new qc.Point(this.gameObject.scaleX, this.gameObject.scaleY);
};

/**
 * 将当前状态设置为结束状态
 */
TweenScale.prototype.setCurrToEndValue = function() {
    this.to = new qc.Point(this.gameObject.scaleX, this.gameObject.scaleY);
};

/**
 * 开始缩放
 * @param node {qc.Node} - 需要缩放的节点
 * @param duration {number} - 经历的时间
 * @param scale {qc.Point} - 最终缩放
 * @returns {qc.TweenScale}
 */
TweenScale.begin = function(node, duration, scale) {
    var tween = qc.Tween.begin('qc.TweenScale', node, duration);
    tween.from = new qc.Point(node.scaleX, node.scaleY);
    tween.to  = scale.clone();
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};
