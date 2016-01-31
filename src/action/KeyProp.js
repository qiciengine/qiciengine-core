/**
 * @author chenx
 * @date 2015.1.2
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  关键帧类型的 action 属性处理类
 */

var KeyProp = qc.KeyProp = function(action, path, propertyId) {

    var self = this;
    qc.Prop.call(self, action, path, propertyId);

    // 关键帧序号映射
    self.keyIndexMap = {};
};
KeyProp.prototype = Object.create(qc.Prop.prototype);
KeyProp.prototype.constructor = KeyProp;

// 反序列化属性数据
// propertyInfo 为 qc.ActionProperties 中定义的属性信息
// json 为该指定属性的序列化的数据信息
KeyProp.prototype.fromJson = function(propertyInfo, json) {

    this.propertyInfo = propertyInfo;
    this.forceUpdate = propertyInfo.forceUpdate;

    var duration = 0;
    var properties = propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
        var attrib = properties[i].attrib;
        this.propDefaultValue[attrib] = properties[i].default;
        if (!json)
        {
            // 新增 property 的情况
            this.propMap[attrib] = [ properties[i].type, [] ];
            continue;
        }

        // 从文件中还原对象的情况
        var data = json[i];
        if (!data)
        {
            this.propMap[attrib] = [ properties[i].type, [] ];
            continue;
        }
        var type = data[0], list = data[1];
        var propData = [];
        for (var j = 0; j < list.length; j++)
            propData.push([list[j][0], this.restoreValue(type, list[j][1])]);
        this.propMap[attrib] = [type, propData];
        if (propData.length > 0)
        {
            var time = propData[propData.length - 1][0];
            if (duration < time)
                duration = time;
        }
    }

    return duration;
}

// 序列化
KeyProp.prototype.toJson = function(context) {
    var json = [];
    var properties = this.propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
         var attrib = properties[i].attrib;
         var propInfo = this.propMap[attrib];
         var type = propInfo[0], list = propInfo[1];
         if (!type || !list)
             continue;

         var propData = [];
         for (var j = 0; j < list.length; j++)
             propData.push([list[j][0], this.saveValue(type, list[j][1], context)]);
         json.push([type, propData]);
    }

    return json;
}

// 增加关键帧
KeyProp.prototype.addKey = function(attrib, time, value) {

    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('KeyProp not find attrib({0}) in addKey.', attrib);
        return;
    }

    var _keyframeLess = function(one, two) {
        return one[0] < two[0];
    };

    if ((value === undefined || value === null) && this.propDefaultValue[attrib] != undefined)
        value = this.propDefaultValue[attrib];
    var idx = qc.Util.insertSortedList(prop[1], [time, value], _keyframeLess);

    return idx;
}

// 删除关键帧
KeyProp.prototype.deleteKey = function(attrib, index) {

    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('KeyProp not find attrib({0}) in deleteKey.', attrib);
        return;
    }

    return prop[1] ? prop[1].splice(index, 1) : null;
}

// 取得关键帧的时间列表
KeyProp.prototype.getKeyTimeList = function(attrib) {
    var list = [];
    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('KeyProp not find attrib({0}) in getKeyTimeList.', attrib);
        return [];
    }
    for (var i = 0; i < prop[1].length; i++)
        list.push(prop[1][i][0]);

    return list;
}

// 取得时长
KeyProp.prototype.getDuration = function() {
    var duration = 0;
    for (var attrib in this.propMap)
    {
        var prop = this.propMap[attrib];
        if (prop[1].length === 0)
            continue;

        if (prop[1][prop[1].length - 1][0] > duration)
            duration = prop[1][prop[1].length - 1][0];
    }

    return duration;
}

// 判断指定时间点是否为关键帧
KeyProp.prototype.isKey = function(attrib, time) {
    var prop = this.propMap[attrib];
    if (prop[1].length === 0)
        return false;

    for (var i = 0; i < prop[1].length; i++)
    {
        if (this.action.game.math.fuzzyEqual(prop[1][i][0], time))
            return i;
    }
}

// 设置指定时间对应的值
KeyProp.prototype.setValue = function(attrib, time, value) {
    var index = this.isKey(attrib, time);
    if (typeof(index) != 'number')
    {
        // 不是关键帧，则新增关键帧
        this.addKey(attrib, time, value);
        if (time > this.action.duration)
            this.action.duration = time;
        return true;
    }

    // 变更现有的关键帧的值
    var prop = this.propMap[attrib];
    prop[1][index][1] = value;

    return;
}

// 取得指定时间对应的值
KeyProp.prototype.getValue = function(attrib, time) {
    var prop = this.propMap[attrib];
    if (prop[1].length === 0)
        return null;

    for (var i = 0; i < prop[1].length; i++)
    {
        if (prop[1][i][0] <= time)
            continue;

        i = i > 0 ? i - 1 : 0;
        return prop[1][i][1];
    }

    return prop[1][prop[1].length - 1][1];
}

// 取得指定帧序号对应的值
KeyProp.prototype.getValueByIndex = function(attrib, keyIndex) {
    var prop = this.propMap[attrib];
    if (prop[1].length === 0)
        return null;

    return prop[1][keyIndex] ? prop[1][keyIndex][1] : null;
}

// 更新目标对象属性值
KeyProp.prototype.updateAttrib = function(target, attrib, value) {
    target[attrib] = value;
}

// 帧调度
KeyProp.prototype.update = function(target, elapsedTime, isBegin, inEditor, forceUpdate) {
    if (isBegin)
        this.keyIndexMap = {};

    for (var attrib in this.propMap)
    {
        var keyIndex = this.keyIndexMap[attrib] || 0;
        var prop = this.propMap[attrib];
        if (prop[1].length === 0)
            continue;

        if (keyIndex > prop[1].length)
        {
            this.keyIndexMap[attrib] = prop[1].length;
            keyIndex = prop[1].length;
        }

        if (keyIndex < prop[1].length && prop[1][keyIndex][0] <= elapsedTime)
        {
            // 当前帧向后查找
            for (var i = keyIndex; i < prop[1].length; i++)
            {
                if (prop[1][i][0] <= elapsedTime)
                {
                    // 达到该关键帧的时间，设置属性
                    this.updateAttrib(target, attrib, prop[1][i][1]);
                    this.keyIndexMap[attrib] = i + 1;
                    continue;
                }

                break;
            }
        }
        else
        {
            // 当前帧向前查找
            var flag = false;
            for (var i = keyIndex - 1; i >= 0; i--)
            {
                if (!prop[1][i])
                {
                    this.action.game.log.error('{0}:{1}~{2} update error: keyIndex({3}), propList({4})',
                            this.path, this.propertyId, attrib, keyIndex, prop[1]);
                    continue;
                }
                if (prop[1][i][0] > elapsedTime)
                    continue;

                flag = true;
                if (i !== keyIndex - 1 || (inEditor && (forceUpdate || this.forceUpdate)))
                {
                    this.updateAttrib(target, attrib, prop[1][i][1]);
                    this.keyIndexMap[attrib] = i + 1;
                }
                break;
            }
            if (!flag)
                this.keyIndexMap[attrib] = 0;
        }
    }
}
