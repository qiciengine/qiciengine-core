/**
 * @author chenx
 * @date 2016.4.9
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  animation 类型的 action 属性处理类
 */

var AnimationKeyProp = qc.AnimationKeyProp = function(action, path, propertyId) {

    var self = this;
    qc.KeyProp.call(self, action, path, propertyId);
};
AnimationKeyProp.prototype = Object.create(qc.KeyProp.prototype);
AnimationKeyProp.prototype.constructor = AnimationKeyProp;

// 更新目标对象属性值
AnimationKeyProp.prototype.updateAttrib = function(target, attrib, value, attribArray) {
    var action = this.action;
    var speed = action.speed;
    while (action.parent)
    {
        speed *= action.parent.speed;
        action = action.parent;
    }

    target.playAnimation(value, speed);
}
