/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * action 对象
 */

/**
 * action
 *
 * @class qc.Action
 * @constructor
 * @internal
 */
var Action = qc.Action = function(game) {
    var self = this;

    // action 的 property 列表
    self.propertyList = {};

    // 各子 action 的数组列表
    self.actionList = [];

    qc.ActionState.call(self, game);

    self.class = 'qc.Action';
};
Action.prototype = Object.create(qc.ActionState.prototype);
Action.prototype.constructor = Action;

Object.defineProperties(Action.prototype, {

    // 目标对象
    targetObject : {
        get : function() {
            return this._targetObject;
        },
        set : function(v) {
            if (this.unpackDone && v === this._targetObject && this._targetObject)
                return;

            this._targetObject = v;

            if (!this.unpackDone)
                return;

            // 根据新目录对象，重新生成 action 列表
            this.actionList = [];
            if (!v)
                return;
            this.refreshActionList();
        }
    },
});

Action.prototype.awake = function() {

    this.unpackDone = true;

    if (typeof(this.targetObject) === 'string')
        this.targetObject = this.game.nodePool.find(this.targetObject);
    else if(typeof(this.targetObject) === 'object' && this.actionList.length === 0)
        this.refreshActionList();

    if (!this.targetObject && this.targetLocked)
    {
        this.game.log.trace('Action({0}) can not find targetObject.', this.name);
        return;
    }
};

// 析构
Action.prototype.destroy = function() {
    var self = this;

    self.targetObject = null;
    self.isRunning = false;

    // 移除所有 action
    for (var key in self.propertyList)
        self.propertyList[key].destroy();
    self.propertyList = {};

    self.actionList = [];
    self.eventList = [];

    self.onFinished.removeAll();
    self.onLoopFinished.removeAll();
}

// 生成该 action 播放列表
Action.prototype.refreshActionList = function() {

    if (!this.targetObject)
    {
        this.game.log.trace('Action({0}) can not find targetObject.', this.name);
        return;
    }

    this.actionList = [];
    for (var key in this.propertyList)
    {
        var match = key.match(/(.*):(.*)/);
        var path = match[1];
        var propertyId = match[2];
        var target = this.targetObject.find(path);
        if (target)
        {
            this.actionList.push({
                target : target,
                propOb : this.propertyList[key],
            });
        }
        else
            this.game.log.error('In action({0}), target({1}) not find child({2})',
                                      this.key, this.targetObject ? this.targetObject.name : null, path);
    }
};

// 加入 property
Action.prototype.addProperty = function(path, propertyId, propList, refresh) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (propertyOb)
    {
        this.game.log.important('Action has duplicate key : {0} in addProperty', key);
        return;
    }

    var propertyInfo = qc.ActionProperties[propertyId];
    if (!propertyInfo)
    {
        this.game.log.important('Can\'t find propertyId : {0} in addProperty', propertyId);
        return;
    }
    var clazz = qc.Util.findClass(propertyInfo.class);
    propertyOb = new clazz(this, path, propertyId);
    var duration = propertyOb.fromJson(propertyInfo, propList);
    if (this.duration < duration)
        this.duration = duration;

    this.propertyList[key] = propertyOb;

    if (refresh)
        this.refreshActionList();
};

// 移除 property
Action.prototype.removeProperty = function(path, propertyId) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action not find key : {0} in removeProperty', key);
        return;
    }

    propertyOb.destroy();
    delete this.propertyList[key];
    this.refreshActionList();
};

// 取得指定 property 的信息
Action.prototype.getPropertyInfo = function(path, propertyId) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action not find key : {0} in getPropertyInfo', key);
        return;
    }

    return propertyOb.getPropMap();
};

// 设置属性信息
Action.prototype.setData = function(path, propertyId, attrib, data) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action has\'t property : {0} in setData', key);
        return;
    }

    propertyOb.setData(attrib, data);
};

// 新增 Key
Action.prototype.addKey = function(path, propertyId, attrib, time, value) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action has\'t property : {0} in addKey', key);
        return;
    }

    var idx = propertyOb.addKey(attrib, time, value);
    if (time > this.duration)
        this.duration = time;
};

// 删除 Key
Action.prototype.deleteKey = function(path, propertyId, attrib, index) {

    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action has\'t property : {0} in deleteKey', key);
        return;
    }

    // 取得该关键帧的时间
    var timeList = propertyOb.getKeyTimeList(attrib);
    var preTime = timeList[index];

    // 删除该关键帧
    propertyOb.deleteKey(attrib, index);

    if (this.duration == preTime)
        // 若该关键帧的时长正好是 action 时长，则需要重新计算 action 时长
        this.duration = this.getDuration(true, true);
};

// 取得 action 时长
Action.prototype.getDuration = function(recalc, singleLoop) {
    if (recalc)
    {
        // 重新计算单次循环的时长
        var duration = 0;
        for (var key in this.propertyList)
        {
            var propOb = this.propertyList[key];
            var value = propOb.getDuration();
            if (duration < value)
                duration = value;
        }

        this.duration = duration;
    }

    if (this.loop && !singleLoop)
        // 该动作循环播放，且不是获得单次循环的时长，则返回 MAX_DURATION
        return qc.MAX_DURATION;

    return this.duration;
}

// 取得指定属性指定时间点的值
Action.prototype.getValue = function(path, propertyId, attrib, time, curveValue) {
    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action has\'t property : {0} in getValue', key);
        return;
    }

    return propertyOb.getValue(attrib, time, curveValue);
}

// 取得指定帧序号的值
Action.prototype.getValueByIndex = function(path, propertyId, attrib, keyIndex) {
    var key = path + ':' + propertyId;
    var propertyOb = this.propertyList[key];
    if (!propertyOb)
    {
        this.game.log.important('Action has\'t property : {0} in getValueByIndex', key);
        return;
    }

    return propertyOb.getValueByIndex(attrib, keyIndex);
}

// 重置
Action.prototype.reset = function() {

    this.elapsedFrame = 0;
    this.startTime = 0;

    // 依次重置各 action
    for (var i = 0; i < this.actionList.length; i++)
    {
        var data = this.actionList[i];
        data.propOb.reset();
    }
};

// 帧调度
Action.prototype.update = function(deltaTime, isBegin, inEditor, forceUpdate) {
    if ((!this.isRunning && !inEditor) || !this.targetObject)
        return;

    var time = this.game.time.scaledTime;
    if (this.elapsedFrame >= this.duration)
    {
        if (!this.loop)
        {
            // 该 action 执行完毕
            this.isRunning = false;
            this.onFinished.dispatch(this);
            return qc.FinishTrigger;
        }
        else
        {
            this.onLoopFinished.dispatch(this);

            this.isRunning = true;

            // 循环播放，重新设置起初时间
            var elapsedFrame = this.elapsedFrame - this.duration;
            while(elapsedFrame >= this.duration)
                elapsedFrame = elapsedFrame - this.duration;
            deltaTime = elapsedFrame / this.samples * 1000;
            this.reset();
            this.startTime = time - deltaTime;
        }
    }

    deltaTime = typeof(deltaTime) === 'number' ? deltaTime : this.game.time.deltaTime;
    if (!this.startTime)
        this.startTime = time;

    if (time === this.startTime)
        // 刚刚开始，则间隔时间为0
        deltaTime = 0;

    var preElapsedTime = isBegin ? -1 : this.elapsedFrame;
    this.elapsedFrame += deltaTime / 1000 * this.samples;

    // 更新属性
    for (var i = 0; i < this.actionList.length; i++)
    {
        var data = this.actionList[i];
        data.propOb.update(data.target, this.elapsedFrame, isBegin, inEditor, forceUpdate);
    }

    if (inEditor && !this.playEventInEditor)
        return;

    // 判断是否触发动画帧事件
    if (this.eventList.length > 0)
        this.triggerEvent(preElapsedTime);
}

// 打包空的 qc.Action 对象
Action.buildEmptyBundle = function() {
    return {
        propertyList : {},
    }
}

// 打包 qc.Action 对象
Action.buildBundle = function(ob) {
    var content = qc.ActionState.buildBundle(ob);

    // 打包 propertyList
    var propertyList = {};
    for (var key in ob.propertyList)
    {
        var match = key.match(/(.*):(.*)/);
        var path = match[1];
        var propertyId = match[2];

        propertyList[path] = propertyList[path] || {};
        propertyList[path][propertyId] = ob.propertyList[key].toJson(content);
    }
    content.propertyList = propertyList;

    return content;
}

// 还原 action 对象
Action.restoreBundle = function(asset, game, inEditor) {
    var json = asset.json;
    var action = new qc.Action(game);

    // 还原 properties
    for (var path in json.propertyList)
    {
        for (var propertyId in json.propertyList[path])
            action.addProperty(path, propertyId, json.propertyList[path][propertyId]);
    }

    action = qc.ActionState.restoreBundle(action, asset, inEditor);

    return action;
}
