/**
 * @author chenx
 * @date 2016.2.24
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 管理 actionState 对象，qc.Action 和 qc.ActionManager 的父类
 */

/**
 * actionState
 *
 * @class qc.ActionState
 * @constructor
 * @internal
 */
var ActionState = qc.ActionState = function(game) {

    var self = this;

    // game instance
    self.game = game;
    self.name = '';

    // 播放 action 的对象
    self.targetObject = null;

    // 目标对象是否锁定
    self.targetLocked = false;

    // 事件列表
    self.eventList = [];

    // 帧数
    self.samples = 60;

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
ActionState.prototype.constructor = ActionState;

ActionState.prototype.awake = function() {

    this.unpackDone = true;

    if (typeof(this.targetObject) === 'string')
        this.targetObject = this.game.nodePool.find(this.targetObject);
};

// 析构
ActionState.prototype.destroy = function() {
    var self = this;

    self.targetObject = null;
    self.isRunning = false;
    self.eventList = [];

    self.onFinished.removeAll();
    self.onLoopFinished.removeAll();
}

// 取得 action 时长
ActionState.prototype.getDuration = function(recalc) {
    return this.duration;
}

// 重置
ActionState.prototype.reset = function() {

    this.elapsedFrame = 0;
    this.startTime = 0;
};

// 开始播放
ActionState.prototype.playAction = function(targetObject, fromBegin) {

    this.isRunning = true;

    if (!this.targetLocked && targetObject)
        this.targetObject = targetObject;

    if (fromBegin)
        this.reset();

    return this.update(null, true);
};

// 停止播放
ActionState.prototype.stop = function() {
    this.isRunning = false;
}

// 增加动画帧事件
ActionState.prototype.addEvent = function(time, funcName, para) {
    var lessFunc = function(one, two) {
        return one[0] < two[0];
    }

    var idx = qc.Util.insertSortedList(this.eventList, [time, funcName, para], lessFunc, true);
    return idx;
}

// 删除动画帧事件
ActionState.prototype.deleteEvent = function(idx) {
    return this.eventList ? this.eventList.splice(idx, 1) : null;
}

// 设置动画帧信息
ActionState.prototype.setEvent = function(idx, index, funcNameOrPara)
{
    var eventInfo = this.eventList[idx];
    if (!eventInfo)
        return;

    eventInfo[index] = funcNameOrPara;
}

// 取得事件相关信息
ActionState.prototype.getEventInfo = function(idx) {
    var eventInfo = this.eventList[idx];
    if (!eventInfo)
        return;

    return {
        func: eventInfo[1],
        para: eventInfo[2],
    }
}

// 触发事件
ActionState.prototype.triggerEvent = function(preElapsedTime) {
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
                        script[this.eventList[i][1]].apply(script, para);
                    }
                }
            }
        }
        else
            break;
    }
}

// 帧调度
ActionState.prototype.update = function(deltaTime, isBegin, inEditor, forceUpdate) {
}

// 打包空的 qc.Action 对象
ActionState.buildEmptyBundle = function() {
    return {}
}

// 打包对象
ActionState.buildBundle = function(ob) {
    var content = { dependences : [] };

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

    // 打包 events
    content.eventList = JSON.stringify(ob.eventList);

    return content;
}

// 还原动作
ActionState.restoreBundle = function(action, asset, inEditor) {
    var json = asset.json;
    var game = action.game;
    action.uuid = asset.uuid;
    action.key = asset.key;

    // 还原名字
    if (json.name)
        action.name = json.name;
    else
        action.name = asset.key.match(/\/([^\/]+?).bin/)[1];

    if (json.__json)
        action.__json = json.__json;

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
    if (inEditor)
        action.targetObject = game.nodePool.find(json.targetObject);
    else
        action.targetObject = game.nodePool.find(json.targetObject) || json.targetObject;

    if (inEditor)
        action.awake();

    return action;
}
