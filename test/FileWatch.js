/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 监控文件系统，提供以下服务给web：
 * 1. 获取某路径下的所有文件目录树信息
 * 2. web socket 获取某个具体文件的content
 * 3. http 获取某个具体文件的content
 * 4. 监视当前根目录下所有文件变更，第一时间广播给所有的活着的连接
 */

// 服务配置信息
var serverPort = 8001;
var rootPath = '/..'

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
var path = require('path');
var qs = require('querystring');
var util = require('util');

// 简单的验证当前服务是否活着
app.get('/', function(req, res) {
    res.send('Welcome to FileWatch Service.');
});

// http 方式提供直接的访问文件的方式
app.use(express.static(getFullPath('/')));

// 为 web socket 提供具体服务
io.on('connection', function(socket) {

    // 获取当前文件树的信息（递归遍历）
    socket.on('explore', function(dir) {
        var path = dir ? dir : getFullPath('/');

        // 返回值回馈客户端
        socket.emit('explore', explorePath(path));
    });

    // 获取当前文件树的信息（只返回一层）
    socket.on('list', function(dir) {
        var path = dir ? dir : getFullPath('/');
        var list = [];

        fs.readdirSync(path).forEach(function(fileName) {
            if (fileName.indexOf('.svn') >= 0 ||
                fileName.indexOf('.') == 0)
                return;
            list.push(fileName);
        });

        // 返回值回馈客户端
        socket.emit('list', list);
    });

    // 获取某个文件的具体内容
    socket.on('source', function(fileName) {
        fs.readFile(fileName, function(err, data) {
            if (err) {
                console.dir(err);
                return;
            }

            // 数据二进制化，如果是图片信息，用 base64 加工发送
            var source;
            if (/.(png|jpg|gif)$/.test(fileName))
                source = new Buffer(data).toString('base64');
            else
                source = new Buffer(data).toString();

            // 返回请求的内容
            socket.emit('source', {
                'fileName' : fileName,
                'source'   : source
            });
        });
    });
})

// node 监控文件发生任何变更，通知给所有连接中的对象
fs.watch(getFullPath('/'),  { persistent: true, recursive: true }, function(event, fileName) {
    // 我们将这一事件广播给所有的客户端
    if (fileName &&
        ! /__$/g.test(fileName) &&
        ! /^\./g.test(fileName))
        io.emit('fileChanged', {
            'event' : event,
            'fileName' : fileName
        });
});

// 递归遍历一个目录，将文件用 object 方式全部呈现
function explorePath(path) {
    var dict = {};
    var list = fs.readdirSync(path);

    list.forEach(function(subPath) {
        if (subPath.indexOf('.svn') >= 0 ||
            subPath.indexOf('.') == 0)
            // svn 文件以及隐藏文件不收集
            return;

        var fullPath = path + "/" + subPath;
        var stat = fs.statSync(fullPath);

        if (stat.isDirectory())
            // 是一个目录，继续递归下去
            dict[subPath] = explorePath(fullPath);
        else
            dict[subPath] = stat.size;
    });
    return dict;
}

// 获取完整路径
function getFullPath(u) {
    return path.normalize(__dirname + rootPath + url.parse(u).pathname);
}

// 监听端口，启动服务
http.listen(serverPort, function() {
    console.log('listening on *:', serverPort);
});