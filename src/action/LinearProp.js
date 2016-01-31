/**
 * @author chenx
 * @date 2015.1.2
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  线性渐变类型的 action 属性处理类
 */

var LinearProp = qc.LinearProp = function(action, path, propertyId) {

    var self = this;
    qc.KeyProp.call(self, action, path, propertyId);
};
LinearProp.prototype = Object.create(qc.KeyProp.prototype);
LinearProp.prototype.constructor = LinearProp;

// 计算两点间的线性插值
LinearProp.prototype.calcValue = function(from, to, factor) {
    return from + factor * (to - from);
}

// 取得指定时间对应的值
LinearProp.prototype.getValue = function(attrib, time) {
    var prop = this.propMap[attrib];
    if (prop[1].length === 0)
        return null;

    if (time <= prop[1][0][0])
        return prop[1][0][1];

    for (var i = 0; i < prop[1].length; i++)
    {
        if (prop[1][i][0] < time)
            continue;

        i = i > 0 ? i - 1 : 0;
        var factor = (time - prop[1][i][0]) / (prop[1][i+1][0] - prop[1][i][0]);
        return this.calcValue(prop[1][i][1], prop[1][i+1][1], factor);
    }

    return prop[1][prop[1].length - 1][1];
}

// 帧调度
LinearProp.prototype.update = function(target, elapsedTime, isBegin, inEditor, forceUpdate) {
    if (isBegin)
        this.keyIndexMap = {};

    for (var attrib in this.propMap)
    {
        var keyIndex = this.keyIndexMap[attrib] || 0;
        var prop = this.propMap[attrib];
        if (prop[1].length === 0)
            continue;

        if (keyIndex >= prop[1].length)
        {
            this.keyIndexMap[attrib] = prop[1].length - 1;
            keyIndex = prop[1].length - 1;
        }

        if (prop[1][keyIndex][0] <= elapsedTime)
        {
            // 当前帧向后查找
            for (var i = keyIndex; i < prop[1].length; i++)
            {
                if (i === prop[1].length - 1)
                {
                    // 最后一帧
                    if (i !== keyIndex)
                    {
                        target[attrib] = prop[1][i][1];
                        this.keyIndexMap[attrib] = i;
                    }
                }
                else if (prop[1][i][0] <= elapsedTime && prop[1][i+1][0] > elapsedTime)
                {
                    // 当前时间在第 i 和 第 i + 1 帧之间，线性取值
                    var factor = (elapsedTime - prop[1][i][0]) / (prop[1][i+1][0] - prop[1][i][0]);
                    if (prop[1][i][1] && prop[1][i+1][1])
                    {
                        var value = this.calcValue(prop[1][i][1], prop[1][i+1][1], factor);
                        target[attrib] = value;
                    }
                    this.keyIndexMap[attrib] = i;
                    break;
                }
            }
        }
        else
        {
            if (prop[1][0][0] > elapsedTime)
            {
                this.keyIndexMap[attrib] = 0;
                continue;
            }

            // 从头到当前帧进行查找
            for (var i = 0; i < keyIndex; i++)
            {
                if (prop[1][i][0] <= elapsedTime && prop[1][i+1][0] > elapsedTime)
                {
                    // 当前时间在第 i 和 第 i + 1 帧之间，线性取值
                    var factor = (elapsedTime - prop[1][i][0]) / (prop[1][i+1][0] - prop[1][i][0]);
                    if (prop[1][i][1] && prop[1][i+1][1])
                    {
                        var value = this.calcValue(prop[1][i][1], prop[1][i+1][1], factor);
                        target[attrib] = value;
                    }
                    this.keyIndexMap[attrib] = i;
                    break;
                }
            }
        }
    }
}
