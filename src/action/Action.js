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
var Action = qc.Action = function(game, id) {

    var self = this;

    // game instance
    self.game = game;
    self.id = id;
    self.name = '';

    // 播放 action 的对象
    self.targetObject = null;

    // 目标对象是否锁定
    self.targetLocked = false;

    // 帧数
    self.samples = 60;

    // action 的 property 列表
    self.propertyList = {};

    // 各子 action 的数组列表
    self.actionList = [];

    // 事件列表
    self.eventList = [];

    // 该 action 的时长
    self.duration = 0;

    // 开始时间
    self.startTime = 0;

    // 流逝帧数
    self.elapsedFrame = 0;

    // 是否循环
    self.loop = false;

    // 是否在编辑器中播放事件
    self.playEventInEditor = true;

    // 是否在运行中
    self.isRunning = false;

    // 结束事件
    self.onFinished = new qc.Signal();

    // 循环过程中单次结束事件
    self.onLoopFinished = new qc.Signal();

    // 是否解包完成
    self.unpackDone = false;
};
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
    else if(typeof(this.targetObject) === 'object')
        this.refreshActionList();
};

// 析构
Action.prototype.destroy = function() {
    var self = this;

    self.targetObject = null;

    // 移除所有 action
    for (var key in self.propertyList)
        self.propertyList[key].destroy();
    self.propertyList = {};

    self.actionList = [];
    self.eventList = [];

    self.onFinished.removeAll();
    self.onLoopFinished.removeAll();
}

// 设置 action 编号
Action.prototype.setId = function(id) {
    this.id = id;
}

// 生成该 action 播放列表
Action.prototype.refreshActionList = function() {

    if (!this.targetObject)
        return;
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

    //console.log('addKey', path, propertyId, attrib, time, idx)
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

    //console.log('deleteKey', path, propertyId, attrib, index)
    // 删除该关键帧
    propertyOb.deleteKey(attrib, index);

    if (this.duration == preTime)
        // 若该关键帧的时长正好是 action 时长，则需要重新计算 action 时长
        this.duration = this.getDuration(true);
};

// 增加动画帧事件
Action.prototype.addEvent = function(time, funcName, para) {
    var lessFunc = function(one, two) {
        return one[0] < two[0];
    }

    var idx = qc.Util.insertSortedList(this.eventList, [time, funcName, para], lessFunc, true);
    return idx;
}

// 删除动画帧事件
Action.prototype.deleteEvent = function(idx) {
    return this.eventList ? this.eventList.splice(idx, 1) : null;
}

// 设置动画帧信息
Action.prototype.setEvent = function(idx, index, funcNameOrPara)
{
    var eventInfo = this.eventList[idx];
    if (!eventInfo)
        return;

    eventInfo[index] = funcNameOrPara;
}

// 取得事件相关信息
Action.prototype.getEventInfo = function(idx) {
    var eventInfo = this.eventList[idx];
    if (!eventInfo)
        return;

    return {
        func: eventInfo[1],
        para: eventInfo[2],
    }
}

// 取得 action 时长
Action.prototype.getDuration = function(recalc) {
    if (!recalc)
        return this.duration;

    var duration = 0;
    for (var key in this.propertyList)
    {
        var propOb = this.propertyList[key];
        var value = propOb.getDuration();
        if (duration < value)
            duration = value;
    }

    this.duration = duration;
    return duration;
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
};

// 帧调度
Action.prototype.update = function(deltaTime, isBegin, inEditor, forceUpdate) {

    if (!this.isRunning && !inEditor)
        return;

    var time = this.game.time.scaledTime;
    if (!inEditor && this.elapsedFrame >= this.duration)
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

            // 循环播放，重新设置起初时间
            deltaTime = (this.elapsedFrame - this.duration) / this.samples * 1000;
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

    //console.log('Action frame update:', this.elapsedFrame);

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
    {
        var minTime = this.eventList[0][0];
        var maxTime = this.eventList[this.eventList.length - 1][0];
        if (this.elapsedFrame < minTime || preElapsedTime > maxTime)
            return;

        for (var i = 0; i < this.eventList.length; i++)
        {
            if (this.eventList[i][0] <= preElapsedTime)
                continue;
            else if (this.eventList[i][0] <= this.elapsedFrame)
            {
                // 调用动画帧事件
                if (this.eventList[i][1])
                {
                    for (var j = 0; j < this.targetObject.scripts.length; j++)
                    {
                        var script = this.targetObject.scripts[j];
                        if (script[this.eventList[i][1]])
                        {
                            var para = this.eventList[i][2];
                            if (!Array.isArray(para))
                            {
                                if (typeof(para) === 'string')
                                    para = [para];
                                else
                                    para = [];
                            }
                            var ret = script[this.eventList[i][1]].apply(script, para);
                            if (ret)
                                return ret;
                        }
                    }
                }
            }
            else
                break;
        }
    }
};

// 开始播放
Action.prototype.playAction = function(targetObject, fromBegin) {

    this.isRunning = true;

    if (!this.targetLocked && targetObject)
        this.targetObject = targetObject;

    if (fromBegin)
        this.reset();

    return this.update(null, true);
};

// 定时 update
Action.prototype._update = function(delay, loop, isBegin) {
    this.lastTime = this.lastTime || this.game.time.scaledTime;
    var deltaTime = this.game.time.scaledTime - this.lastTime;
    this.lastTime = this.game.time.scaledTime;

    if (this.update(deltaTime, isBegin) === qc.FinishTrigger)
    {
        this.reset();
        this.isRunning = true;

        if (!loop)
            // 单次播放，则停止播放
            this.stop();
    }
}

// 单独播放 action
Action.prototype.play = function(loop, frameRate) {

    this.isRunning = true;
    frameRate = frameRate || this.game.time.frameRate;
    var delay = 1000 / frameRate;
    this.lastTime = this.game.time.scaledTime;
    this._update(delay, loop, true);
    this.playTimer = this.game.timer.loop(delay, this._update, this, delay, loop);
}

// 停止播放
Action.prototype.stop = function() {
    this.isRunning = false;

    if (this.playTimer)
        this.game.timer.remove(this.playTimer);
    this.playTimer = null;
}

// 打包空的 qc.Action 对象
Action.buildEmptyBundle = function() {
    return {
        id : 0,
        propertyList : {},
    }
}

// 打包 qc.Action 对象
Action.buildBundle = function(ob) {
    var content = { dependences : [] };

    // 打包 id
    content.id = ob.id;

    // 打包 owner
    if (ob.targetObject)
        content.targetObject = ob.targetObject.uuid;

    // 打包 targetLocked
    content.targetLocked = ob.targetLocked;

    // 打包 loop
    content.loop = ob.loop;

    // 打包 samples
    content.samples = ob.samples;

    // 打包 playEventInEditor
    content.playEventInEditor = ob.playEventInEditor;

    // 打包名字
    if (ob.name)
        content.name = ob.name;

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

    // 打包 events
    content.eventList = JSON.stringify(ob.eventList);

    return content;
}

// 还原 action 对象
Action.restoreBundle = function(asset, game, inEditor) {
    var json = asset.json;
    var action = new qc.Action(game, json.id);
    action.uuid = asset.uuid;
    action.key = asset.key;

    // 还原名字
    if (json.name)
        action.name = json.name;
    else
        action.name = asset.key.match(/\/([^\/]+?).bin/)[1];

    if (json.__json)
        action.__json = json.__json;

    // 还原 properties
    for (var path in json.propertyList)
    {
        for (var propertyId in json.propertyList[path])
            action.addProperty(path, propertyId, json.propertyList[path][propertyId]);
    }

    // 还原 eventList
    if (json.eventList)
    {
        try {
            action.eventList = JSON.parse(json.eventList);
        }
        catch(e)
        {
            game.log.error(e.stack);
        }
    }

    // 还原 targetLocked
    action.targetLocked = json.targetLocked;

    // 还原 loop
    action.loop = json.loop;

    // 还原 samples
    action.samples = json.samples || 60;

    // 还原 playEventInEditor
    action.playEventInEditor = typeof(json.playEventInEditor) === 'boolean' ? json.playEventInEditor : true;

    // 还原 targetObject
    action.targetObject = json.targetObject;

    if (inEditor)
        action.awake();

    return action;
}
