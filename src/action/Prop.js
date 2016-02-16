/**
 * @author chenx
 * @date 2015.1.4
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  action 属性基类
 */

var Prop = qc.Prop = function(action, path, propertyId) {

    var self = this;

    // action instance
    self.action = action;

    self.path = path;
    self.propertyId = propertyId;

    // 属性列表
    self.propMap = {};

    // 属性默认值
    self.propDefaultValue = {};
};
Prop.prototype.constructor = Prop;

// 析构
Prop.prototype.destroy = function() {
    this.action = null;
    this.propMap = {};
}

// 返回该曲线属性的信息
Prop.prototype.getPropMap = function() {
    return this.propMap;
}

// 转换成序列化格式
Prop.prototype.saveValue = function(type, value, context) {
    var ret;

    // 按类型赋值
    switch (type) {
    case Serializer.INT:
    case Serializer.NUMBER:
    case Serializer.STRING:
    case Serializer.BOOLEAN:
    case Serializer.MAPPING:
        // 普通的类型
        ret = value;
        break;
    case Serializer.COLOR:
        if (!(value instanceof Color))
           ret = null;
        else
            ret = value.toNumber(true);
        break;
    case Serializer.GEOM:
    case Serializer.POINT:
    case Serializer.RECTANGLE:
    case Serializer.CIRCLE:
    case Serializer.ELLIPSE:
        ret = [value.class, value.toJson()];
        break;
    case Serializer.TEXTURE:
        if (!value)
            ret = null;
        else if (!(value[0] instanceof qc.Texture))
            ret = null;
        else
        {
            var atlas = value[0], frame = value[1];
            // 记录资源依赖
            context.dependences.push({
                key : atlas.key,
                uuid : atlas.uuid
            });
            ret = [atlas.uuid, frame];
        }
        break;
    case Serializer.AUDIO:
        if (!(value instanceof qc.SoundAsset))
            ret = null;
        else
        {
            // 记录资源依赖
            context.dependences.push({
                key : value.key,
                uuid : value.uuid
            });
            ret = value.uuid;
        }
        break;
    default:
        throw new Error('unsupported asset type:' + type);
    }

    return ret;
}

// 还原值
Prop.prototype.restoreValue = function(type, value) {
    var ret;

    // 按类型赋值
    switch (type) {
    case Serializer.INT:
    case Serializer.NUMBER:
    case Serializer.STRING:
    case Serializer.BOOLEAN:
    case Serializer.MAPPING:
        // 普通的类型
        ret = value;
        break;
    case Serializer.COLOR:
        ret = new Color(value);
        break;
    case Serializer.GEOM:
    case Serializer.POINT:
    case Serializer.RECTANGLE:
    case Serializer.CIRCLE:
    case Serializer.ELLIPSE:
        if (!value)
            ret = null;
        else
        {
            var func = qc.Util.findClass(value[0]);
            var geom = new func();
            geom.fromJson(value[1]);
            ret = geom;
        }
        break;
    case Serializer.TEXTURE:
        if (!value)
            ret = [];
        else
        {
            var texture = value[0], frame = value[1];
            var atlas = this.action.game.assets.findByUUID(texture);
            if (!atlas) {
                console.error('贴图资源尚未载入，无法反序列化。', value);
                ret = [null, frame];
            }
            else if (!(atlas instanceof qc.Texture))
                ret = [null, frame];
            else
                ret = [atlas, frame];
        }
        break;
    case Serializer.AUDIO:
        if (!value)
            ret = null;
        else
        {
            var atlas = this.action.game.assets.findByUUID(value);
            if (!atlas) {
                console.error('音频资源尚未载入，无法反序列化。', value);
                ret = null;
            }
            else if (!(atlas instanceof qc.SoundAsset))
                ret = null;
            else
                ret = atlas;
        }
        break;
    default:
        throw new Error('unsupported asset type:' + type);
    }

    return ret;
}

// 设置数据
// 子类根据需要自行重载
Prop.prototype.setData = function(attrib, data) {
    return;
}

// 反序列化属性数据
// 子类需要重载
Prop.prototype.fromJson = function(propertyInfo, json) {
    return 0;
}

// 序列化
// 子类需要重载
Prop.prototype.toJson = function(context) {
    return [];
}

// 增加关键帧
// 子类需要重载
Prop.prototype.addKey = function(attrib, time, value) {
    return 0;
}

// 删除关键帧
// 子类需要重载
Prop.prototype.deleteKey = function(attrib, index) {
    return 0;
}

// 时长
// 子类需要重载
Prop.prototype.getDuration = function() {
    return {};
}

// 取得指定时间对应的值
//  子类需要重载
Prop.prototype.getValue = function(attrib, time) {
    return;
}

// 取得指定帧序号对应的值
//  子类需要重载
Prop.prototype.getValueByIndex = function(attrib, keyIndex) {
    return;
}

// 设置指定时间对应的值
// 返回 true 表示新增关键帧
//  子类需要重载
Prop.prototype.setValue = function(attrib, time, value) {
    return;
}

// 判断指定时间点是否为关键帧
// 子类需要重载
Prop.prototype.isKey = function(attrib, time) {
    return false;
}

// 帧调度
// 子类需要重载
Prop.prototype.update = function(target, elapsedTime, isBegin, inEditor, forceUpdate) {
}
