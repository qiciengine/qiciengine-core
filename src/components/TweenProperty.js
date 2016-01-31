/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 属性变化
 * @class qc.TweenProperty
 */
var TweenProperty = defineBehaviour('qc.TweenProperty', qc.Tween, function() {
    var self = this;

    /**
     * @property {number} from - 起始的数值
     */
    self.from = 0;

    /**
     * @property {number} to - 最终的数值
     */
    self.to = 1;

    /**
     * @property {string} property - 对象的属性
     */
    self.property = '';

    // 默认情况下不可用
    self.enable = false;
},{
    from : qc.Serializer.NUMBER,
    to : qc.Serializer.NUMBER,
    property: qc.Serializer.STRING
});

// 菜单上的显示
TweenProperty.__menu = 'Tween/TweenProperty';

Object.defineProperties(TweenProperty.prototype, {
    property: {
        get: function() { return this._property; },
        set: function(v) {
            if (v === this._property) return;

            // 记录对象和最后一级的属性
            var arr = v.split('.');
            var o = this.gameObject;
            for (var i = 0; i < arr.length - 1; i++) {
                o = o[arr[i]];
                if (!o) {
                    this.game.log.important('The property({0}) non-exist.', v);
                    return;
                }
            }
            this._ob = o;
            this._attrib = arr[arr.length - 1];
            this._property = v;
        }
    }
});

// 帧调度
TweenProperty.prototype.onUpdate = function(factor, isFinished) {
    var self = this;
    var _from = self.from, _to = self.to;

    self._ob[self._attrib] = _from + factor * (_to - _from);
};

/**
 * 将开始状态设成当前状态
 */
TweenProperty.prototype.setStartToCurrValue = function() {
    this._ob[this._attrib] = this.from;
};

/**
 * 将结束状态设成当前状态
 */
TweenProperty.prototype.setEndToCurrValue = function() {
    this._ob[this._attrib] = this.to;
};

/**
 * 将当前状态设为开始状态
 */
TweenProperty.prototype.setCurrToStartValue = function() {
    this.from = this._ob[this._attrib];
};

/**
 * 将当前状态设置为结束状态
 */
TweenProperty.prototype.setCurrToEndValue = function() {
    this.to = this._ob[this._attrib];
};
/**
 * 开始变化
 * @param node {qc.Node} - 需要改变的节点
 * @param duration {number} - 经历的时间
 * @param vallue {number} - 最终值
 * @returns {qc.TweenProperty}
 */
TweenProperty.begin = function(node, duration, value) {
    var tween = qc.Tween.begin('qc.TweenProperty', node, duration);
    tween.from = this._ob[this._attrib];
    tween.to  = value;
    if (duration <= 0) {
        tween.sample(1, true);
        tween.enable = false;
    }
    return tween;
};
