/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  曲线类型的 action 属性处理类
 */

var CurveProp = qc.CurveProp = function(action, path, propertyId) {

    var self = this;
    qc.Prop.call(self, action, path, propertyId);
};
CurveProp.prototype = Object.create(qc.Prop.prototype);
CurveProp.prototype.constructor = CurveProp;

// 反序列化属性数据
// propertyInfo 为 qc.ActionProperties 中定义的属性信息
// json 为该指定属性的序列化的数据信息
CurveProp.prototype.fromJson = function(propertyInfo, json) {

    this.propertyInfo = propertyInfo;

    var duration = 0;
    var properties = propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
        var attrib = properties[i].attrib;
        this.propDefaultValue[attrib] = properties[i].default;
        if (!json)
        {
            // 新增 property 的情况
            this.propMap[attrib] = {
                curveType: qc.CURVE_TYPE_ABSOLUTE,
                curve : new qc.BezierCurve(),
                to : 0,
            }
            continue;
        }

        // 从文件中还原对象的情况
        var data = json[i];
        var curve = new qc.BezierCurve();
        this.propMap[attrib] = {
            curveType : data[0],
            curve : curve,
            to : 0,
        };
        curve.fromJson(data[1]);
        if (data[0] >= qc.CURVE_TYPE_TWEEN_RELATIVE)
        {
            this.propMap[attrib]['from'] = data[2][0];
            this.propMap[attrib]['to'] = data[2][1] || 0;
        }
        if (curve._keys.length > 0)
        {
            var time = curve._keys[curve._keys.length - 1].time
            if (duration < time)
                duration = time;
        }
    }

    return duration;
}

// 序列化
CurveProp.prototype.toJson = function(context) {
    var json = [];
    var properties = this.propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
         var attrib = properties[i].attrib;
         var propInfo = this.propMap[attrib];
         var prop = [propInfo.curveType, propInfo.curve.toJson()];
         if (propInfo.curveType >= qc.CURVE_TYPE_TWEEN_RELATIVE)
             prop.push([propInfo.from, propInfo.to]);
         json.push(prop);
    }

    return json;
}

// 设置数据
CurveProp.prototype.setData = function(attrib, data) {

    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('CurveProp not find attrib({0}) in setData.', attrib);
        return;
    }

    if (typeof(data.curveType) === 'number')
        prop.curveType = data.curveType;
    if (typeof(data.from) === 'number')
        prop.from = data.from;
    if (typeof(data.to) === 'number')
        prop.to = data.to;
}


// 取得曲线的 from 初始值
CurveProp.prototype.getFromValue = function(target, attrib, time) {
    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('CurveProp not find attrib({0}) in getFromValue.', attrib);
        return;
    }
    if (typeof(prop.from) === 'number')
        return prop.from;

    // 不存在 from 值，则根据曲线值和目标当前值计算得出
    if (!target)
        return;

    var targetValue = target[attrib];
    var value = this.getValue(attrib, time, true) || 0;
    var to = prop.to;
    var fromValue = value;
    if (prop.curveType === qc.CURVE_TYPE_RELATIVE)
        fromValue = targetValue - value;
    else if (prop.curveType === qc.CURVE_TYPE_TWEEN_RELATIVE)
        fromValue = targetValue - (to ? to * value : 0);
    prop.from = fromValue;

    return fromValue;
}

// 增加关键帧
CurveProp.prototype.addKey = function(attrib, time, value) {

    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('CurveProp not find attrib({0}) in addKey.', attrib);
        return;
    }

    if ((value === undefined || value === null) && this.propDefaultValue[attrib] != undefined)
        value = this.propDefaultValue[attrib];
    value = value || 0;
    var idx = prop.curve.addKey(time, value);
    prop.curve.makeKeyframeLinear(idx - 1);
    prop.curve.makeKeyframeLinear(idx);
    prop.curve.makeKeyframeLinear(idx + 1);

    return idx;
}

// 删除关键帧
CurveProp.prototype.deleteKey = function(attrib, index) {

    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('CurveProp not find attrib({0}) in deleteKey.', attrib);
        return;
    }

    prop.curve.removeKey(index);
}

// 取得关键帧的时间列表
CurveProp.prototype.getKeyTimeList = function(attrib) {
    var list = [];
    var prop = this.propMap[attrib];
    if (!prop)
    {
        this.action.game.log.important('CurveProp not find attrib({0}) in getKeyTimeList.', attrib);
        return [];
    }
    for (var i = 0; i < prop.curve._keys.length; i++)
        list.push(prop.curve._keys[i].time);

    return list;
}

// 取得时长
CurveProp.prototype.getDuration = function() {
    var duration = 0;
    for (var attrib in this.propMap)
    {
        var prop = this.propMap[attrib];
        var curve = prop.curve;
        if (curve._keys.length < 1)
            continue;

        var time = curve._keys[curve._keys.length - 1].time;
        if (duration < time)
            duration = time;
    }

    return duration;
}

// 取得指定时间对应的值
CurveProp.prototype.getValue = function(attrib, time, curveValue) {
    var prop = this.propMap[attrib];
    var from = prop.from;
    var to = prop.to;
    var curveType = prop.curveType;
    var curve = prop.curve;

    // 取得该时间点的值
    var value = curve.evaluate(time);
    if (curveValue)
        return value;

    if (curveType === qc.CURVE_TYPE_ABSOLUTE)
        return value;
    else if (curveType === qc.CURVE_TYPE_RELATIVE)
        return from + value;
    else if (curveType === qc.CURVE_TYPE_TWEEN_ABSOLUTE)
        return from + value * (to - from);
    else
        return from + value * to;
}

// 取得指定帧序号对应的值
CurveProp.prototype.getValueByIndex = function(attrib, keyIndex) {
    var prop = this.propMap[attrib];
    var curve = prop.curve;

    return curve._keys[keyIndex] ?  curve._keys[keyIndex].value : null;
}

// 设置指定时间对应的值
CurveProp.prototype.setValue = function(attrib, time, value) {
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
    var curve = prop.curve;
    curve._keys[index].value = value;

    prop.curve.makeKeyframeLinear(index - 1);
    prop.curve.makeKeyframeLinear(index);
    prop.curve.makeKeyframeLinear(index + 1);
    return;
}

// 判断指定时间点是否为关键帧
CurveProp.prototype.isKey = function(attrib, time) {
    var prop = this.propMap[attrib];
    var curve = prop.curve;

    if (curve._keys.length === 0)
        return false;

    for (var i = 0; i < curve._keys.length; i++)
    {
        if (this.action.game.math.fuzzyEqual(curve._keys[i].time, time))
            return i;
    }
}

// 帧调度
CurveProp.prototype.update = function(target, elapsedTime, isBegin, forceUpdate) {
    for (var attrib in this.propMap)
    {
        var prop = this.propMap[attrib];
        var curveType = prop.curveType;
        if (isBegin)
        {
            if (curveType === qc.CURVE_TYPE_RELATIVE ||
                curveType === qc.CURVE_TYPE_TWEEN_RELATIVE)
                prop.from = target[attrib];
        }
        var from = this.getFromValue(target, attrib, elapsedTime);
        var to = prop.to;
        var curve = prop.curve;

        if (curve._keys.length <= 0)
            continue;

        // 取得该时间点的值
        var value = curve.evaluate(elapsedTime);

        // 设置属性值
        if (curveType === qc.CURVE_TYPE_ABSOLUTE)
            target[attrib] = value;
        else if (curveType === qc.CURVE_TYPE_RELATIVE)
            target[attrib] = from + value;
        else if (curveType === qc.CURVE_TYPE_TWEEN_ABSOLUTE)
            target[attrib] = from + value * (to - from);
        else
            target[attrib] = from + value * to;
    }
}
