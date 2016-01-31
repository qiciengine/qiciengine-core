/**
 * @author chenx
 * @date 2015.10.14
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 负责提供 http 服务，处理来自客户端的 cmd 请求
 */

var enableTrace = true;

// 记录消息及处理函数的映射关系
var _cmdMap = {};

// 记录 websocket 消息及处理函数的映射关系
var _socketCmdMap = {};

// socket.io 对象
var _io = null;

/* 内部函数 */

// post init 回调函数
function whenPostInit()
{
    var port = G.getConfig()["port"] || 5001;

    // 开始监听端口
    _io = listen(port);
    _io.on('connection', function(socket) {
        trace('New connection.');

        socket.on('disconnect', function() {
            trace('Disconnect.');
            G.emitter.emit('disconnect', socket);
        });

        socket.on('error', function(e){
            log('socket error : %j', e.stack);
        });

        // 注册所有的命令
        for (var cmd in _socketCmdMap) {
            registerSocketCmdIO(cmd, socket);
        }

        // 通知有连接接入
        G.emitter.emit('newConnection', socket);
    });
}

// 对指定连接进行消息关注
function registerSocketCmdIO(cmd, socket)
{
    socket.on(cmd, function() {
        dispatchSocketCommand(socket, cmd, arguments);
    });
}

// 派发socket消息到各自的处理函数
function dispatchSocketCommand(socket, cmd, args)
{
    if (enableTrace)
    {
        var time = new Date();
        log('-----------%s cmd : %s ----------\n%j\n',
            time.toLocaleString(), cmd, args);
    }

    var func = _socketCmdMap[cmd];
    if (!func)
    {
        error('找不到 socket cmd(%s)的处理函数', cmd);
        return;
    }

    // 调用消息处理函数
    var argList = [socket];
    for (var i = 0; i < args.length; i++)
        argList.push(args[i]);
    func.apply(null, argList);
}

// 派发消息到各自的处理函数
function dispatchCommand(res, data)
{
    var cmd = data.cmd;
    if (enableTrace)
    {
        var time = new Date();
        log('-----------%s cmd : %s ----------\n%j\n',
            time.toLocaleString(), cmd, data);
    }

    var func = _cmdMap[cmd];
    if (!func)
    {
        error('找不到cmd(%s)的处理函数', cmd);
        sendMessage(res, { ret : false, reason : 'no cmd' });
        return;
    }

    // 调用消息处理函数
    func(res, data);
}

// 请求执行超时处理
function timeoutHandler(res)
{
    sendMessage(res, { ret : false, reason : 'timeout' });
}

// cmd router 处理
// 接收来自客户端的请求，并派发消息到各自的处理函数
function addCmdRouter(app)
{
    // cmd router 中间件
    var express = require('express');
    var router = express.Router();
    app.use('/cmd', router);

    // 客户端请求 get http://localhost:5001/cmd?cmd=TEST&value=1
    router.get('/', function(req, res) {
        var query = req.query;
        //log('get query %j', query);
        if (typeof(query) === 'string')
        {
            try {
                query = JSON.parse(query);
            }
            catch(e) {
                error(e.stack);
                res.end();
                return;
            }
        }
        var cmd = query.cmd;

        if (query.echostr)
        {
            // 微信公众服务器配置的验证请求
            res.send(query.echostr);
            return;
        }

        if (!cmd)
            sendMessage(res, { ret : false, reason : 'no cmd' });
        else
            dispatchCommand(res, query);

        // 设置该连接的最大持续时间
        res.timerID = setTimeout(timeoutHandler, 15000, res);

        // 关注连接断开事件，设置标识，以便发送respond时检查连接是否已断开
        res.on('close', function(){
            trace("connection closed.");
            res.isClosed = true;
        });
    })

    // 客户端请求 post http://localhost:5001/cmd
    // {a:1,b:2}
    router.post('/', function(req, res) {
        var body = req.body;
        if (typeof(body) === 'string')
        {
            try {
                body = JSON.parse(body);
            }
            catch(e) {
                error(e.stack);
                res.end();
                return;
            }
        }
        var cmd = body.cmd;
        if (!cmd)
            sendMessage(res, { ret : false, reason : 'no cmd' });
        else
            dispatchCommand(res, body);

        // 设置该连接的最大持续时间
        res.timerID = setTimeout(timeoutHandler, 15000, res);

        // 关注连接断开事件，设置标识，以便发送respond时检查连接是否已断开
        res.on('close', function(){
            trace("connection closed.");
            res.isClosed = true;
        });
    });

    // 接收远程日志
    router = express.Router();
    app.use('/remoteLog', router);

    // 客户端请求 post http://107.0.0.1:8900/remoteLog
    router.post('/', function(req, res) {
        var body = req.body;
        var ret = body.match(/:queryCmd:(.*)/)
        if (ret && ret.index === 0)
        {
            // 客户端请求获取脚本指令
            queryCmdFromClient(res, ret[1]);
        }
        else
        {
            log('%s\n' , body)
            res.send("200 OK");
            res.end();
        }
    });
}

// 增加中间件
function addMiddleware(app)
{
    // 跨域请求中间件
    var cors = require('cors');
    app.use(cors());

    // body parse 中间件
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(bodyParser.text({ type : function(){ return true; }}));

    // cmd router 处理
    addCmdRouter(app);
}

/* 公共函数 */

/**
 * 打开或关闭通信消息 trace
 * @param {bool} flag - true or false
 */
function debugOn(flag)
{
    enableTrace = flag;
}

/**
 * 开始监听端口
 * @method COMMUNICATE_D.listen
 * @param {number} port - 监听的端口号
 */
function listen(port)
{
    log('开始监听端口：%d', port);

    var express = require('express');
    var app     = express();
    var http    = require('http').Server(app);
    var io      = require('socket.io')(http, {
        pingTimeout : 15000,
        pingInterval : 8000
    });

    // 监听端口重复事件以进行重试
    http.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            error('端口%d被占用，请检查重启重复端口', port);
            setTimeout(function () {
                http.close();
                http.listen(port);
            }, 2000);
        }
        else
        {
            error('端口监听失败:%s', e.code);
        }
    });

    http.listen(port, function() {
        log('成功监听端口：%d', port);

        // 派发成功监听的回调
        G.emitter.emit('serviceOn', {
            port : port
        })
    });

    // 为 http 增加中间件
    addMiddleware(app);

    return io;
}

/**
 * 发送消息给客户端
 * @method COMMUNICATE_D.sendMessage
 * @param {respond} res - http 的 respond 对象
 * @param {json} jsonData - json 数据
 */
function sendMessage(res, jsonData)
{
    // 删除连接超时的定时，避免超时时重复发送消息
    if (res.timerID)
    {
        clearTimeout(res.timerID);
        res.timerID = false;
    }

    if (res.isClosed)
        return;
    res.isClosed = true;

    res.json(jsonData);
    res.end();

    if (enableTrace)
    {
        var time = new Date();
        log('###########%s msg ############\n%j\n',
            time.toLocaleString(), jsonData);
    }

    // 发送完数据后断开连接
    res.setTimeout(1000);
}

/**
 * 注册消息处理函数
 * @method COMMUNICATE_D.registerCmd
 * @param {string} cmd - 消息串
 * @param {function} func - 消息处理函数
 */
function registerCmd(cmd, func)
{
    if (_cmdMap[cmd])
        assert(false, util.format('消息(%s)重复注册', cmd));

    _cmdMap[cmd] = func;
}

/**
 * 注册websocket消息处理函数
 * @method COMMUNICATE_D.registerSocketCmd
 * @param {string} cmd - 消息串
 * @param {function} func - 消息处理函数
 */
function registerSocketCmd(cmd, func)
{
    if (_socketCmdMap[cmd])
        assert(false, util.format('socket消息(%s)重复注册', cmd));

    _socketCmdMap[cmd] = func;
}

/**
 * 发送 socket 消息给客户端
 * @method COMMUNICATE_D.sendSocketMessage
 * @param {io} socket - socket io 对象
 * @param {string} cmd - 消息名
 * @param 可选参数
 */
function sendSocketMessage(socket, cmd)
{
    var args = [];
    for (var i = 1; i < arguments.length; i++)
        args.push(arguments[i]);

    // 发送消息
    socket.emit.apply(socket, args);
}

function destruct()
{
    if (_io)
    {
        _io.close();
        _io = null;
    }
}

// 模块构造函数
function create()
{
    G.registerPostInit(whenPostInit);
}

// 执行模块构造函数
create();

// 导出模块
global.COMMUNICATE_D = module.exports = {
    listen : listen,
    registerCmd : registerCmd,
    registerSocketCmd : registerSocketCmd,
    sendMessage : sendMessage,
    create : create,
}
global.debugOn = debugOn;
