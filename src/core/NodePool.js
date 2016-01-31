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
}

/**
 * 移除一个对象
 * @method qc.NodePool@remove
 */
NodePool.prototype.remove = function(uuid) {
    if (this._nodes[uuid])
        delete this._nodes[uuid];
}

/**
 * 查找对象
 * @method qc.NodePool#find
 */
NodePool.prototype.find = function(uuid) {
    if (this._nodes[uuid])
        return this._nodes[uuid];
}