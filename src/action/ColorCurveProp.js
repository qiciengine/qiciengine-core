/**
 * @author chenx
 * @date 2015.12.31
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  color 曲线类型的 action 属性处理类
 */

var ColorCurveProp = qc.ColorCurveProp = function(action) {
    qc.CurveProp.call(this, action);
};

ColorCurveProp.prototype = Object.create(qc.CurveProp.prototype);
ColorCurveProp.prototype.constructor = ColorCurveProp;

// 反序列化属性数据
// propertyInfo 为 qc.ActionProperties 中定义的属性信息
// json 为该指定属性的序列化的数据信息
ColorCurveProp.prototype.fromJson = function(propertyInfo, json) {

    this.propertyInfo = propertyInfo;

    var duration = 0;
    var properties = propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
        var attrib = properties[i].attrib;
        if (!json)
        {
            // 新增 property 的情况
            this.propMap[attrib] = {
                from : 0,
                to : 0,
                curve : new qc.BezierCurve(new qc.Keyframe(0,0), new qc.Keyframe(1,1)),
            }
            continue;
        }

        // 从文件中还原对象的情况
        var data = json[i];
        var curve = new qc.BezierCurve();
        this.propMap[attrib] = {
            from : new qc.Color(data[0]),
            to : new qc.Color(data[1]),
            curve : curve,
        };
        curve.fromJson(data[2]);
        var time = curve.keys[curve.keys.length - 1].time
        if (duration < time)
            duration = time;
    }

    return duration;
}

// 序列化
ColorCurveProp.prototype.toJson = function(context) {
    var json = [];
    var properties = this.propertyInfo.properties;
    for (var i = 0; i < properties.length; i++)
    {
         var attrib = properties[i].attrib;
         var propInfo = this.propMap[attrib];
         json.push([propInfo.from.toNumber(true), propInfo.to.toNumber(true), propInfo.curve.toJson()]);
    }

    return json;
}

// 帧调度
ColorCurveProp.prototype.update = function(target, elapsedTime) {
    for (var attrib in this.propMap)
    {
        var prop = this.propMap[attrib];
        var from = prop.from;
        var to = prop.to;
        var curve = prop.curve;

        if (from === 0 || to === 0)
            continue;

        // 取得该时间点的值
        var value = curve.evaluate(elapsedTime);

        var _from = prop.from.rgb, _to = prop.to.rgb;
        var currColor = [
            Phaser.Math.clamp(Math.round(_from[0] + value * (_to[0] - _from[0])), 0, 255),
            Phaser.Math.clamp(Math.round(_from[1] + value * (_to[1] - _from[1])), 0, 255),
            Phaser.Math.clamp(Math.round(_from[2] + value * (_to[2] - _from[2])), 0, 255),
            Phaser.Math.clamp(prop.from.alpha + value * (prop.to.alpha - prop.from.alpha), 0, 1)
        ];
        var color = new Color(currColor);

        // 设置属性值
        target[attrib] = color;
    }
}
