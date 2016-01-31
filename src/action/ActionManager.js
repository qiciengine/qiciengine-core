/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * action 管理器
 */

// qc.ActionManager类定义
var ActionManager = qc.ActionManager = function(game, id) {

    var self = this;
    self.game = game;
    self.class = 'qc.ActionManager';

    self.id = id;

    // 播放 action 的对象
    self._targetObject = null;

    // 目标对象是否锁定
    self.targetLocked = false;

    // 缓存 action 列表
    self.actionList = {};

    // 当前正在运行的 action
    self.curActionList = [];

    // 缓存 transition 列表
    self.transitionList = {};

    // 记录 action 目标的连接路线
    self.transitionToLink = {};

    // 记录 action 来源的连接路线
    self.transitionFromLink = {};

    // 是否在运行中
    self.isRunning = false;

    // 所有挂载的脚本
    self.scripts = [];

    // 递增编号
    self.cookie = 1;
};

ActionManager.prototype = {};
ActionManager.prototype.constructor = ActionManager;

ActionManager.prototype.awake = function() {

    if (typeof(this.targetObject) === 'string')
        this.targetObject = this.game.nodePool.find(this.targetObject);

    // 所有的脚本派发awake事件
    for (var s in this.scripts) {
        var script = this.scripts[s];

        if (script.awake)
            script.awake.call(script);
    }

    for (var id in this.actionList)
        this.actionList[id].awake();
};

// 析构
ActionManager.prototype.destroy = function() {

    var self = this;

    self.isRunning = false;
    self._targetObject = null;

    // 通知所有挂载的脚本移除
    var i = self.scripts.length;
    while (i--) {
        self.scripts[i].destroy();
    }
    self.scripts = [];

    // 移除所有 action
    for (var id in self.actionList)
        self.actionList[id].destroy();
    self.actionList = {};

    // 移除所有 transition
    for (var id in self.transitionList)
        self.transitionList[id].destroy();
    self.transitionList = {};

    self.curActionList = [];
    self.transitionToLink = {};
    self.transitionFromLink = {};
}

// 引用 qc.Node 的 script 脚本机制
ActionManager.prototype.removeScript = qc.Node.prototype.removeScript;
ActionManager.prototype.getScript = qc.Node.prototype.getScript;
ActionManager.prototype._packScripts = qc.Node.prototype._packScripts;
ActionManager.prototype._unpackScripts = qc.Node.prototype._unpackScripts;

ActionManager.prototype.addScript = function(script, dispatchAwake) {
    var c = qc.Node.prototype.addScript.call(this, script, dispatchAwake);

    // 判断是否脚本有 Serializer.NODE 类型，不允许有该类型
    var meta = {};
    if (c.getMeta)
        meta = c.getMeta();
    for (var k in meta) {
        if (meta[k] === qc.Serializer.NODE)
        {
            var str = 'ActionManger\'s script is not allowed to set Serializer.NODE variable';
            console.error(str);
            qc.Util.popupError(str);
        }
    }

    return c;
};

Object.defineProperties(ActionManager.prototype, {

    // 目标对象
    targetObject : {
        get : function() {
            return this._targetObject;
        },
        set : function(v) {
            if (v === this._targetObject && this._targetObject)
                return;

            this._targetObject = v;

            if (typeof(v) === 'string')
                return;

            // 依次设置 action 的 targetObject
            for (var id in this.actionList)
                if (!this.actionList[id].targetLocked)
                    this.actionList[id].targetObject = v;

        }
    },
});

// 帧调度
ActionManager.prototype.update = function() {

    if (!this.isRunning)
        return;

    var addList = [];
    var removeAction;
    var isFinished;

    // 遍历正在运行中的 action，依次执行
    for (var i = 0; i < this.curActionList.length; i++)
    {
        var action = this.curActionList[i];

        // 执行 action 更新
        // 若有返回值，则表示 action 移向下一个 action 的 condition 值
        // qc.FinishTrigger 表示 action 已完成；qc.EventTrigger 表示 action 中途移向下个 action。
        var condition = action.update();
        if (condition)
        {
            // 取得满足该 condition 的 transition
            var actionId = action.id;
            var transitions = this.transitionToLink[actionId] || [];
            for (var i = 0; i < transitions.length; i++)
            {
                var transition = transitions[i];
                if (transition.condition !== condition)
                    continue;

                if (transition.toAction === -1)
                    // 表示下一个为 Exit 节点
                    isFinished = true;
                else
                {
                    // 移向下一个 action
                    var toAction = this.actionList[transition.toAction];
                    var actionList = transition.moveToAction(this, toAction);

                    // 将该 action 加入当前列表中
                    addList.push.apply(addList, actionList)
                }
            }
        }

        if (condition == qc.FinishTrigger)
        {
            // 该 action 运行结束，需要从当前列表中移除
            this.curActionList[i] = undefined;
            removeAction = true;
        }
    }

    if (isFinished)
    {
        // 该 action manager 播放完毕
        this.isRunning = false;
        this.curActionList = [];
        return qc.FinishTrigger;
    }

    // 若有需要移除的 action，则重新构建 action 当前列表
    if (removeAction)
    {
        var tempActionList = [];
        for (var i = 0; i < this.curActionList.length; i++)
        {
            if (this.curActionList[i])
                tempActionList.push(this.curActionList[i]);
        }
        this.curActionList = tempActionList;
    }

    // 将新的 action 加入当前列表
    for (var i = 0; i < addList.length; i++)
        this.curActionList.push(addList[i]);
};

// 加入 action
ActionManager.prototype.addAction = function(action, isRestore) {

    if (isRestore)
    {
        self.actionList[action.id] = action;
        return action.id;
    }

    var self = this;
    self.cookie += 1;

    // 设置 action ID
    action.setId(self.cookie);
    self.actionList[self.cookie] = action;

    return self.cookie;
};

// 删除 action
ActionManager.prototype.deleteAction = function(action) {

    // 移除该 action 的连接关系
    var fromLink = this.transitionFromLink[action.id] || [];
    for (var i = 0; i < fromLink.length; i++)
    {
        var transition = fromLink[i];

        // 移除缓存
        this.transitionList[transition.id] = undefined;

        // 析构 transition
        transition.destroy();
    }
    this.transitionFromLink[action.id] = undefined;

    var toLink = this.transitionToLink[action.id] || [];
    for (var i = 0; i < toLink.length; i++)
    {
        var transition = toLink[i];

        // 移除缓存
        this.transitionList[transition.id] = undefined;

        // 析构 transition
        transition.destroy();
    }
    this.transitionToLink[action.id] = undefined;


    // 移除 action 映射记录
    self.actionList[action.id] = undefined;

    // 析构 action
    action.destroy();
};

// 加入 transition
ActionManager.prototype.addTransition = function(transition, isRestore) {

    // 取得连接线的源 action 和目标 action 的编号
    var fromAction = transition.fromAction;
    var toAction = transition.toAction;

    // 建立连接关系
    this.transitionToLink[fromAction] = this.transitionToLink[fromAction] || [];
    this.transitionToLink[fromAction].push(transition);
    this.transitionFromLink[toAction] = this.transitionFromLink[toAction] || [];
    this.transitionFromLink[toAction].push(transition);

    if (!isRestore)
    {
        this.cookie += 1;
        transition.setId(this.cookie);
        this.transitionList[transition.id] = transition;
    }
};

// 删除 transition
ActionManager.prototype.deleteTransition = function(transition) {

    var fromAction = transition.fromAction;
    var toAction = transition.toAction;

    // 移除 fromAction 的目标连接关系
    var toLink = this.transitionToLink[fromAction] || [];
    var tempLink = [];
    for (var i = 0; i < toLink.length; i++)
    {
        if (transition !== toLink[i])
            tempLink.push(toLink[i]);
    }
    this.transitionToLink[fromAction] = tempLink;

    // 移除 toAction 的来源连接关系
    var fromLink = this.transitionFromLink[toAction] || [];
    tempLink = [];
    for (var i = 0; i < fromLink.length; i++)
    {
        if (transition !== fromLink[i])
            tempLink.push(fromLink[i]);
    }
    this.transitionFromLink[toAction] = tempLink;

    // 移除缓存
    this.transitionList[transition.id] = undefined;

    // 析构 transition
    transition.destroy();

};

// 重置
ActionManager.prototype.reset = function() {
    this.playAction(null, true);
};

// 开始播放
ActionManager.prototype.playAction = function(targetObject, fromBegin) {

    this.isRunning = true;

    if (!this.targetLocked && targetObject)
        this.targetObject = targetObject;

    // 当前没有 action 在运行中或从头播放，则取入口的 action
    if (this.curActionList.length == 0 || fromBegin)
    {
        if (!this.transitionToLink[0])
        {
            this.game.log.important('entry action not exist.');
            return;
        }

        this.curActionList = [];
        for (var i = 0; i < this.transitionToLink[0].length; i++)
        {
            var transition = this.transitionToLink[0][i];
            var toActionId = transition.toAction;
            var toAction = this.actionList[toActionId];

            // 移到下个 action
            var actionList = transition.moveToAction(this, toAction);

            // 记录为当前运行 action
            this.curActionList.push.apply(this.curActionList, actionList);
        }
    }

    return this.update();
};

// 打包 qc.ActionManager 对象
ActionManager.buildBundle = function(ob) {
    var content = { dependences : [] };

    // 打包 id
    content.id = ob.id;

    // 打包 scripts
    content.scripts = ob._packScripts(content);
    content.__json = ob.__json;

    // 打包 targetObject
    if (ob.targetObject)
        content.targetObject = ob.targetObject.uuid;

    // 打包 targetLocked
    content.targetLocked = ob.targetLocked;

    // 打包 actionList
    var actionList = {};
    for (var id in ob.actionList)
    {
        actionList[id] = ob.actionList[id].uuid;
        content.dependences.push({ key : ob.actionList[id].key, uuid : actionList[id] });
    }
    content.actionList = actionList;

    // 打包 transition
    var transitionList = {};
    for (var id in ob.transitionList)
    {
        transitionList[id] = {
            condition : ob.transitionList[id].condition,
            funcName : ob.transitionList[id].funcName,
            funcPara : ob.transitionList[id].funcPara,
        }
    }
    content.transitionList = transitionList;

    return content;
}

// 还原出 qc.ActionManager 对象
ActionManager.restoreBundle = function(asset, game, inEditor) {
    var json = asset.json;
    var actionManager = new qc.ActionManager(game, json.id);
    actionManager.uuid = asset.uuid;
    actionManager.key = asset.key;
    actionManager.name = asset.key.match(/\/([^\/]+?).bin/)[1];

    if (json.__json)
        actionManager.__json = json.__json;

    // 还原 scripts
    actionManager._unpackScripts(json.scripts);

    // 还原 actionList
    for (var id in json.actionList)
    {
        var uuid = json.actionList[id];
        var actionAsset = game.assets.findByUUID(uuid);
        if (actionAsset)
        {
            // 还原出 action 对象
            var action;
            if (actionAsset instanceof qc.ActionAsset)
                action = qc.Action.restoreBundle(actionAsset, game);
            else if (actionAsset instanceof qc.ActionManagerAsset)
                action = qc.ActionManager.restoreBundle(actionAsset, game);

            // 将 action 加入 actionManager 对象
            actionManager.addAction(action, true);
        }
    }

    // 遍历 transitionList
    for (var id in json.transitionList)
    {
        var data = json.transitionList[id];
        var transition = new qc.Transition(game, id, data.condition, data.funcName, data.funcPara);
        actionManager.addTransition(transition);
    }

    // 还原 targetLocked
    actionManager.targetLocked = json.targetLocked;

    // 还原 targetObject
    actionManager.targetObject = game.nodePool.find(json.targetObject) || json.targetObject;

    if (inEditor)
        actionManager.awake();

    return actionManager;
}
