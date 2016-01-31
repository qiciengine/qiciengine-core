/**
 * @author chenx
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 启动 cluster 集群的启动脚本
 */

util = require('util');
os = require('os');
var path = require('path');
G = {};
G.serverRoot = path.dirname(__dirname);

// 定义全局的代码载入函数
require(path.join(G.serverRoot, 'global/base/Compiler'));

// 预先加载关键的全局代码
update('global/base/Config.js');
update('global/daemons/Log.js');

cluster = require('cluster');
numCPUs = require('os').cpus().length;

// 设置 fork 进程的启动脚本
cluster.setupMaster({
  exec: 'gs/StartGS.js',
});

// Fork workers.
var clusterNum = G.getConfig().clusterNum || numCPUs;
for (var i = 0; i < clusterNum; i++) {
    var worker = cluster.fork();

    // 关注来自 worker 的消息
    worker.on('message', workerMessageListener);
}

var normalExit;
function workerMessageListener(msg)
{
    trace('receive worker message %s', msg);
    if (msg == 'fork')
    {
        // 新 fork 一个进程
        var worker = cluster.fork();
        worker.on('message', workerMessageListener);
    }
    else if (msg == 'shutdown')
    {
        // 关闭所有的 worker
        normalExit = true;

        // 先断开
        cluster.disconnect(shutdownCallback);

        // 一段时间没断开，强制 kill
        setTimeout(function() {
            Object.keys(cluster.workers).forEach(function(id){
                cluster.workers[id].kill();
            })
        }, 2000);
    }
}

function shutdownCallback()
{
    console.log('Server shutdown success.');
}

cluster.on('listening',function(worker,address){
});

// worker 退出事件
cluster.on('exit', function(worker, code, signal) {
    if (normalExit)
        return;

    error('worker %d died!!! code : %d, signal : %d', worker.process.pid, code, signal);
});
