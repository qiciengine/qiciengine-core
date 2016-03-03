/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 位置动画组件，起始位置和目标位置由两个Node决定，无须指定绝对位置
 * @class qc.TweenTransform
 */
var TweenTransform = defineBehaviour('qc.TweenTransform', qc.Tween, function() {
    var self = this;

    // 默认情况下不可用
    self.enable = false;

    // 起始位置的本地坐标
    self.localFrom = new qc.Point();

    // 目标位置的本地坐标
    self.localTo = new qc.Point();
},{
    from : qc.Serializer.NODE,
    to : qc.Serializer.NODE
});

// 菜单上的显示
TweenTransform.__menu = 'Tween/TweenTransform';

// 初始化：计算起点和目标点位置对应的本地坐标
TweenTransform.prototype.awake = function() {
    var self = this;

    if (!self.from || !self.to)
        return;

    var worldFrom = self.from.getWorldPosition();
    var worldTo   = self.to.getWorldPosition();

    self.localFrom = this.gameObject.parent.toLocal(worldFrom);
    self.localTo   = this.gameObject.parent.toLocal(worldTo);
};

// 帧调度: 驱动位置
TweenTransform.prototype.onUpdate = function(factor, isFinished) {
    var self = this;

    self.gameObject.x = self.localFrom.x + factor * (self.localTo.x - self.localFrom.x);
    self.gameObject.y = self.localFrom.y + factor * (self.localTo.y - self.localFrom.y);
};
