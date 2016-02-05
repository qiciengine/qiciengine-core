/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 游戏对象池管理
 *
 * @class qc.NodePool
 * @constructor
 * @internal
 */
var NodePool = qc.NodePool = function(game) {
    this._game = game;
    this._nodes = {};
    this._nameUuidMap = {};
}
NodePool.prototype = {};
NodePool.prototype.constructor = NodePool;

Object.defineProperties(NodePool.prototype, {
    /**
     * @property {qc.Game} game - 游戏实例的引用
     * @readonly
     */
    game : {
        get : function() { return this._game; }
    }
});

/**
 * 添加一个对象
 * @method qc.NodePool#add
 */
NodePool.prototype.add = function(uuid, node) {
    if (this._nodes[uuid]) {
        this.game.log.error('uuid {0} already exists', uuid);
    }
    this._nodes[uuid] = node;
    if (node.uniqueName && !this._nameUuidMap[node.uniqueName])
        this._nameUuidMap[node.uniqueName] = uuid;
}

/**
 * 移除一个对象
 * @method qc.NodePool@remove
 */
NodePool.prototype.remove = function(uuid) {
    if (this._nodes[uuid])
    {
        if (this._nodes[uuid].uniqueName)
            delete this._nameUuidMap[this._nodes[uuid].uniqueName];
        delete this._nodes[uuid];
    }
}

/**
 * 查找对象
 * @method qc.NodePool#find
 */
NodePool.prototype.find = function(uuid) {
    if (this._nodes[uuid])
        return this._nodes[uuid];
}

/**
 * 根据唯一名字查找对象
 * @method qc.NodePool#findByName
 */
NodePool.prototype.findByName = function(uniqueName) {
    var uuid = this._nameUuidMap[uniqueName];
    if (uuid)
        return this._nodes[uuid];
}

/**
 * 移除 name 与 uuid 的映射
 * @method qc.NodePool#removeName
 */
NodePool.prototype.removeName = function(uniqueName) {
    delete this._nameUuidMap[uniqueName];
}

/**
 * 增加 name 与 uuid 的映射
 * @method qc.NodePool#addName
 */
NodePool.prototype.addName = function(uniqueName, uuid) {
    this._nameUuidMap[uniqueName] = uuid;
}

/**
 * 根据唯一名字查找对象
 */
qc.N = function(uniqueName) {

    var game;
    if (window.parent && window.parent.G)
        game = window.parent.G.game;
    else if (typeof(qici) !== 'undefined' && qici.config)
    {
        var gameInstance = qici.config.gameInstance;
        game = window[gameInstance];
    }
    if (!game)
        return;

    return game.nodePool.findByName(uniqueName);
}
