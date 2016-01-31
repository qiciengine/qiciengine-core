/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 位置动画组件
 * @class qc.TweenPosition
 */
var TweenPosition = defineBehaviour('qc.TweenPosition', qc.Tween, function() {
    var self = this;

    /**
     * @property {qc.Point} from - 起始点
     */
    self.from = new qc.Point(0, 0);

    /**
     * @property {qc.Point} to - 终点
     */
    self.to = new qc.Point(0, 0);

    /**
     * @property {number} moveAxis - 当前改变位置的类型
     */
    self.moveAxis = TweenPosition.BOTH;

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.POINT,
    to : qc.Serializer.POINT,
    moveAxis : qc.Serializer.NUMBER
});

// 菜单上的显示
TweenPosition.__menu = 'Tween/TweenPosition';

// 帧调度: 驱动位置
TweenPosition.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from, _to = self.to;
    ((self.moveAxis & TweenPosition.ONLY_X) !== 0) && (self.gameObject.x = _from.x + factor * (_to.x - _from.x));
    ((self.moveAxis & TweenPosition.ONLY_Y) !== 0) && (self.gameObject.y = _from.y + factor * (_to.y - _from.y));
};

/**
 * 将开始位置设成当前位置
 */
TweenPosition.prototype.setStartToCurrValue = function() {
    ((this.moveAxis & TweenPosition.ONLY_X) !== 0) && (this.gameObject.x = this.from.x);
    ((this.moveAxis & TweenPosition.ONLY_Y) !== 0) && (this.gameObject.y = this.from.y);
};

/**
 * 将结束位置设成当前位置
 */
TweenPosition.prototype.setEndToCurrValue = function() {
    ((this.moveAxis & TweenPosition.ONLY_X) !== 0) && (this.gameObject.x = this.to.x);
    ((this.moveAxis & TweenPosition.ONLY_Y) !== 0) && (this.gameObject.y = this.to.y);
};

/**
 * 将当前位置设为开始位置
 */
TweenPosition.prototype.setCurrToStartValue = function() {
    this.from = new qc.Point(this.gameObject.x, this.gameObject.y);
};

/**
 * 将当前位置设置为结束位置
 */
TweenPosition.prototype.setCurrToEndValue = function() {
    this.to = new qc.Point(this.gameObject.x, this.gameObject.y);
};

/**
 * 开始缩放
 * @param node {qc.Node} - 需要移动的节点
 * @param duration {number} - 经历的时间
 * @param position {qc.Point} - 需要移动到的点
 * @returns {qc.TweenPosition}
 */
TweenPosition.begin = function(node, duration, position) {
    var tween = qc.Tween.begin('qc.TweenPosition', node, duration);
    tween.from = new qc.Point(node.x, node.y);
    tween.to  = position.clone();
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};

/**
 * x，y 轴位置都进行改变
 * @constant
 * @type {number}
 */
TweenPosition.BOTH = 255;
/**
 * 只改变 x 轴位置
 * @constant
 * @type {number}
 */
TweenPosition.ONLY_X = 1;
/**
 * 只改变 y 轴位置
 * @constant
 * @type {number}
 */
TweenPosition.ONLY_Y = 2;

