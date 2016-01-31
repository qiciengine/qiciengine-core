/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 管理运行所有的自定义系统插件
 *
 * @class qc.PluginManager
 * @param {Phaser.PluginManager} phaser
 * @constructor
 * @internal
 */
var PluginManager = qc.PluginManager = function(phaser) {
    // 建立下关联
    phaser._qc = this;
    this.phaser = phaser;
}
PluginManager.prototype = {};
PluginManager.prototype.constructor = PluginManager;

Object.defineProperties(PluginManager.prototype, {
    /**
     * @property {qc.Game} game
     * @readonly
     */
   'game' : {
       get : function() { return this.phaser.game._qc; }
   },

    /**
     * @property {qc.Plugin[]} plugins - 所有的插件列表
     * @readonly
     */
    'plugins' : {
        get : function() { return this.phaser.plugins; }
    }
});

/**
 * 添加一个插件
 *
 * @method qc.PluginManager#add
 * @param {object|qc.Plugin} plugin - 待添加的插件
 * @pram {...*} parameter - 额外参数，在调用插件的init时原样传入
 */
PluginManager.prototype.add = function(plugin) {
    var plugin = this.phaser.add.apply(this.phaser, arguments);
    plugin.game = this.game;
    return plugin;
}

/**
 * 移除一个插件
 *
 * @method qc.PluginManager#remove
 * @param {qc.Plugin} plugin - 待移除的插件
 */
PluginManager.prototype.remove = function(plugin) {
    this.phaser.remove(plugin);
}

/**
 * 移除所有的插件
 *
 * @method qc.PluginManager#removeAll
 */
PluginManager.prototype.removeAll = function() {
    this.phaser.removeAll();
}

/**
 * 析构插件管理器
 *
 * @method qc.PluginManager#destroy
 */
PluginManager.prototype.destroy = function() {
    this.phaser.destroy();
    delete this.phaser;
}
