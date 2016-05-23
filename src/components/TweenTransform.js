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

Object.defineProperties(TweenTransform.prototype, {
    /**
     * @property {qc.Node} from - 起始位置
     */
    from : {
        get : function() {
            return this._from;
        },
        set : function(v) {
            this._from = v;

           var worldFrom = this._from.getWorldPosition();
           this.localFrom = this.gameObject.parent.toLocal(worldFrom);
        }
    },

    /**
     * @property {qc.Node} to - 终点位置
     */
    to : {
        get : function() {
            return this._to;
        },
        set : function(v) {
            this._to = v;

           var worldTo = this._to.getWorldPosition();
           this.localTo = this.gameObject.parent.toLocal(worldTo);
        }
    }
});

// 帧调度: 驱动位置
TweenTransform.prototype.onUpdate = function(factor, isFinished) {
    var self = this;

    self.gameObject.x = self.localFrom.x + factor * (self.localTo.x - self.localFrom.x);
    self.gameObject.y = self.localFrom.y + factor * (self.localTo.y - self.localFrom.y);
};
