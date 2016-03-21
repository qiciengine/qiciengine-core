/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * action 管理器
 */

// qc.ActionManager类定义
var ActionManager = qc.ActionManager = function(game) {

    var self = this;

    // 缓存 action 列表
    self.actionList = [];

    qc.ActionState.call(self, game);

    self.class = 'qc.ActionManager';

    // 结束线的帧数
    self._endLinePos = -1;

    // 正在运行中的 action
    self.runningActions = {};
};

ActionManager.prototype = Object.create(qc.ActionState.prototype);
ActionManager.prototype.constructor = ActionManager;

ActionManager.prototype.awake = function() {

    this.unpackDone = true;

    if (typeof(this.targetObject) === 'string')
        this.targetObject = this.game.nodePool.find(this.targetObject);

    if (!this.targetObject && this.targetLocked)
    {
        this.game.log.trace('Action({0}) can not find targetObject.', this.name);
        return;
    }

    for (var i = 0; i < this.actionList.length; i++)
    {
        if (this.actionList[i] && this.actionList[i][1])
            this.actionList[i][1].awake();
    }
};

// 析构
ActionManager.prototype.destroy = function() {

    var self = this;

    self.isRunning = false;
    self._targetObject = null;

    // 移除所有 action
    for (var i = 0; i < this.actionList.length; i++)
    {
        if (this.actionList[i] && this.actionList[i][1])
            this.actionList[i][1].destroy();
    }
    self.actionList = [];
}

Object.defineProperties(ActionManager.prototype, {

    // 目标对象
    targetObject : {
        get : function() {
            return this._targetObject;
        },
        set : function(v) {
            if (this.unpackDone && v === this._targetObject && this._targetObject)
                return;

            this._targetObject = v;

            // 依次设置 action 的 targetObject
            for (var i = 0; i < this.actionList.length; i++)
            {
                if (!this.actionList[i])
                    continue;
                var action = this.actionList[i][1];
                if (action && !action.targetLocked)
                    action.targetObject = v;
            }
        }
    },
    // 是否运行中
    isRunning : {
        get : function() {
            return this._isRunning;
        },
        set : function(v) {
            this._isRunning = v;

            // 依次设置 action 的 targetObject
            for (var i = 0; i < this.actionList.length; i++)
            {
                if (!this.actionList[i])
                    continue;
                var action = this.actionList[i][1];
                if (action)
                    action.isRunning = v;
            }
        }
    },
    // 结束线位置
    endLinePos : {
        get : function() {
            return this._endLinePos;
        },
        set : function(v) {
            this._endLinePos = v;
            if (v > -1)
                // 设置动作时长
                this.duration = v;
            else
            {
                // 重新计算动作时长
                this.getDuration(true);
            }
        }
    }
});

// 重置
ActionManager.prototype.reset = function() {

    this.elapsedFrame = 0;
    this.startTime = 0;

    this.runningActions = {};

    // 依次重置各 action
    for (var i = 0; i < this.actionList.length; i++)
    {
        if (!this.actionList[i])
            continue;
        var action = this.actionList[i][1];
        if (action)
            action.reset();
    }
};

// 帧调度
ActionManager.prototype.update = function(deltaTime, isBegin, inEditor, forceUpdate) {
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
            var setStartTime = function(action, time, deltaTime) {
                action.startTime = time;
                var deltaFrame = deltaTime * action.samples / 1000;
                if (action.duration < deltaFrame)
                    // 若子 action 的时长少于 deltaFrame，则将 elapsedFrame 设置为 deltaFrame
                    action.elapsedFrame = deltaFrame;

                if (action instanceof qc.ActionManager)
                {
                    for (var i = 0; i < action.actionList.length; i++)
                    {
                        var actionInfo = action.actionList[i];
                        if (!actionInfo)
                            continue;
                        var subAction = actionInfo[1];
                        setStartTime(subAction, time, deltaTime);
                    }
                }
            }
            setStartTime(this, time - deltaTime, deltaTime);
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

    // 判断是否触发动画帧事件
    if (this.eventList.length > 0 && !(inEditor && !this.playEventInEditor))
        this.triggerEvent(preElapsedTime);

    // 更新属性
    for (var i = 0; i < this.actionList.length; i++)
    {
        var actionInfo = this.actionList[i];
        if (!actionInfo)
            continue;
        var time = actionInfo[0], action = actionInfo[1];

        if (this.elapsedFrame < time)
            // 还没到该 action 的执行时间
            continue;

        var begin = false;
        if (!this.runningActions[i])
            begin = true;

        action.update(deltaTime, begin, inEditor, forceUpdate);
        this.runningActions[i] = true;
    }
}

// 加入 action
ActionManager.prototype.addAction = function(actionInfo) {
    var self = this;
    var index = self.actionList.push(actionInfo);

    var time = actionInfo[0], action = actionInfo[1];

    if (self.endLinePos > -1)
        return index;

    // 没有指定结束线，则计算最大的时长
    var duration = action.getDuration();
    if (duration === qc.MAX_DURATION)
        self.duration = duration;
    else if (self.duration < time + duration)
        self.duration = time + duration;

    return index;
};

// 删除 action
ActionManager.prototype.deleteAction = function(index) {
    var self = this;
    if (!self.actionList[index])
        return;

    // 移除 action 映射记录
    var action = self.actionList[index][1];
    var preTime = 0;

    // 析构 action
    if (action)
    {
        var duration = action.getDuration();
        if (duration === qc.MAX_DURATION)
            preTime = qc.MAX_DURATION;
        else
            preTime = self.actionList[index][0] + duration;
        action.destroy();
    }
    delete self.actionList[index];

    if (this.duration === preTime)
        this.getDuration(true);
};

// 更新 action
ActionManager.prototype.updateActionTime = function(index, time) {
    var self = this;
    var actionInfo = self.actionList[index];
    if (!actionInfo)
        return;

    actionInfo[0] = time;
};

// 取得 action 时长
ActionManager.prototype.getDuration = function(recalc, singleLoop) {
    if (recalc && this.endLinePos <= -1)
    {
        // 重新计算单次循环的时长
        var duration = 0;
        for (var i = 0; i < this.actionList.length; i++)
        {
            var actionInfo = this.actionList[i];
            if (!actionInfo)
                continue;
            var value = actionInfo[1].getDuration();
            var time = actionInfo[0];
            if (value === qc.MAX_DURATION)
                duration = qc.MAX_DURATION;
            else if (duration < time + value)
                duration = time + value;
        }
        this.duration = duration;
    }

    if (this.loop && !singleLoop)
        // 该动作循环播放，且不是获得单次循环的时长，则返回 MAX_DURATION
        return qc.MAX_DURATION;

    if (this.endLinePos > -1)
        // 有结束线，则直接取该线所在的位置
        return this.endLinePos;

    return this.duration;
}

// 打包空的 qc.ActionManager 对象
ActionManager.buildEmptyBundle = function() {
    return {
        actionList : [],
    }
}

// 打包 qc.ActionManager 对象
ActionManager.buildBundle = function(ob) {
    var content = qc.ActionState.buildBundle(ob);

    // 打包 endLinePos
    content.endLinePos = ob.endLinePos;

    // 打包 actionList
    var actionList = [];
    for (var i = 0; i < ob.actionList.length; i++)
    {
        var actionInfo = ob.actionList[i];
        if (!actionInfo)
            continue;
        var action = actionInfo[1];
        var time = actionInfo[0];
        var uuid = action.uuid;
        var loop = action.loop;
        var targetUUID = action.targetObject ? action.targetObject.uuid : undefined;
        content.dependences.push({ key : action.key, uuid : uuid });
        actionList.push([time, uuid, loop, targetUUID, action.targetLocked]);
    }
    content.actionList = actionList;

    return content;
}

// 还原出 qc.ActionManager 对象
ActionManager.restoreBundle = function(asset, game, inEditor, context) {
    var json = asset.json;
    var actionManager = new qc.ActionManager(game);

    if (!context)
        context = {};
    if (context[asset.uuid])
    {
        // 出现递归死循环引用
        game.log.error('Failed to add this action({0}) because of recursive reference.', asset.key);
        return false;
    }
    context[asset.uuid] = true;

    // 还原 endLinePos
    actionManager.endLinePos = json.endLinePos ? json.endLinePos : -1;

    // 还原 actionList
    for (var i = 0; i < json.actionList.length; i++)
    {
        var actionInfo = json.actionList[i] || [];
        var time = actionInfo[0], uuid = actionInfo[1], loop = actionInfo[2];
        var targetUUID = actionInfo[3], targetLocked = actionInfo[4];
        var actionAsset = game.assets.findByUUID(uuid);
        if (actionAsset)
        {
            var action;

            // 还原出 action 对象
            if (actionAsset instanceof qc.ActionAsset)
                action = qc.Action.restoreBundle(actionAsset, game, !game.serializer.isRestoring);
            else if (actionAsset instanceof qc.ActionManagerAsset)
            {
                action = qc.ActionManager.restoreBundle(actionAsset, game, !game.serializer.isRestoring, context);
                if (!action)
                {
                    delete context[asset.uuid];
                    return false;
                }
            }

            action.loop = loop;
            if (!game.serializer.isRestoring)
                action.targetObject = game.nodePool.find(targetUUID);
            else
                action.targetObject = game.nodePool.find(targetUUID) || targetUUID;
            action.targetLocked = targetLocked;

            // 将 action 相关信息加入 actionManager 对象
            actionManager.addAction([time, action]);
        }
    }
    delete context[asset.uuid];

    actionManager = qc.ActionState.restoreBundle(actionManager, asset, inEditor);

    return actionManager;
}
