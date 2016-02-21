/**
 * @author chenx
 * @date 2015.1.28
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  texture 类型的 action 属性处理类
 */

var TextureKeyProp = qc.TextureKeyProp = function(action, path, propertyId) {

    var self = this;
    qc.KeyProp.call(self, action, path, propertyId);
};
TextureKeyProp.prototype = Object.create(qc.KeyProp.prototype);
TextureKeyProp.prototype.constructor = TextureKeyProp;

// 更新目标对象属性值
TextureKeyProp.prototype.updateAttrib = function(target, attrib, value, attribArray) {
    if (!value)
    {
        var texture = this.action.game.assets.find('__builtin_resource__');
        var frame = texture ? texture.frameNames[0] : 0;
        value = [texture, frame];
    }
    var texture = value[0], frame = value[1];
    var targetValue = texture ? new qc.Texture(texture, frame) : null;
    if (!attribArray)
        target[attrib] = targetValue;
    else
    {
        var len = attribArray.length;
        if (len === 2 && target[attribArray[0]])
            target[attribArray[0]][attribArray[1]] = targetValue;
        else if (len > 2)
        {
            var o = target;
            for (var i = 0; i < len - 1; i++)
            {
                o = o[attribArray[i]];
                if (!o)
                    break;
            }
            if (o)
                o[attribArray[len - 1]] = targetValue;
        }
    }
}
