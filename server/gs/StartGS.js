/**
 * @author chenx
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 负责游戏服务器的启动逻辑
 */

util = require('util');
os = require('os');

// 记录全局函数
G = {};

// 建立事件派发器
var eventEmitter = require('events').EventEmitter;
G.emitter = new eventEmitter();

// 记录当前服务器根路径
var path = require('path');
G.serverRoot = path.dirname(__dirname);

// 定义全局的代码载入函数
require(path.join(G.serverRoot, 'global/base/Compiler.js'));

// 预先加载关键的全局代码
update('global/base/Config.js');
update('global/daemons/Log.js');

// 加载全局 global 相关目录
//

// 全局定义
loadDir('global/include');
// 全局函数
loadDir('global/base');
// 全局模块
loadDir('global/daemons');
// 全局对象
loadDir('global/clone');
// 全局消息
loadDir('global/cmds');
// 全局 websocket 消息
loadDir('global/cmds/socket');

// 加载 gs 相关目录
//

// gs相关定义
loadDir('gs/include');
// gs相关全局函数
loadDir('gs/base');
// gs模块
loadDir('gs/daemons');
// gs对象
loadDir('gs/clone');
// gs消息
loadDir('gs/cmds');
// gs websocket 消息
loadDir('gs/cmds/socket');

// 调用所有模块注册的postInit回调
G.postInit();

// 等待所有模块 postInit 完成
G.waitPostInit();
