/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 自定义插件的基类模板
 *
 * @class qc.Plugin
 * @param {qc.Game} game
 * @param {any} owner - 谁来管理这个插件？通常为：qc.PluginManager
 * @constructor
 */
var Plugin = qc.Plugin = Phaser.Plugin;

// 看起来没有需要额外定制的，直接使用（减少PluginManager的封装工作）
