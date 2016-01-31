/**
 * @author chenx
 * @date 2015.10.14
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 日志系统支持
 */

// 设置 log4js 的日志类型
var log4js = require('log4js');
var config = G.getConfig();
log4js.configure({
    appenders : [
        {
            "type": 'console',
            "category": "console",
            "layout": {
                "type": "messagePassThrough"
            }
        },
        {
            "category": "-",
            "type": "dateFile",
            "filename": 'logs/' + config.name,
            "pattern": "-yyyy-MM-dd.log",
            "alwaysIncludePattern": true,
        }
    ]
});

var colors = {
  'white' : ['\u001b[37m', '\u001b[39m'],
  'grey' : ['\u001b[90m', '\u001b[39m'],
  'black' : ['\u001b[30m', '\u001b[39m'],
  'blue' : ['\u001b[34m', '\u001b[39m'],
  'cyan' : ['\u001b[36m', '\u001b[39m'],
  'green' : ['\u001b[32m', '\u001b[39m'],
  'magenta' : ['\u001b[35m', '\u001b[39m'],
  'red' : ['\u001b[31m', '\u001b[39m'],
  'yellow' : ['\u001b[33m', '\u001b[39m']
};

// telnet后台的连接对象映射关系
var telnetConnections = {};

// 是否允许普通日志的打印，在开发环境中需要打开
var _enableTrace = true;

/*
 * log4js 的日志优先级依次为：
 * trace,debug,info,warn,error,fatal
 * 当 logger.setLevel('warn') 时，只有 warn,error,fatal 的日志才会输出
 */

/**
 * 普通打印日志
 * @param arguments
 */
function trace()
{
    if (!_enableTrace) return;

    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.trace(content);
}

/**
 * 调试日志
 * @param arguments
 */
function debug()
{
    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.info(colors['cyan'][0] + content + colors['cyan'][1]);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}

/**
 * 信息日志
 * @param arguments
 */
function info()
{
    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.info(colors['green'][0] + content + colors['green'][1]);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}

/**
 * 重要的打印日志
 * @param arguments
 */
function log()
{
    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.info(colors['green'][0] + content + colors['green'][1]);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}

/**
 * 警告日志，写文件
 * @param arguments
 */
function warn()
{
    var content = util.format.apply(null, arguments);

    var logger = log4js.getLogger('console');
    logger.warn(colors['yellow'][0] + content + colors['yellow'][1]);

    // 写文件
    logger = log4js.getLogger('-');
    logger.warn(content);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}

/**
 * 错误日志，打印堆栈，写文件
 * @param arguments
 */
function error()
{
    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.error(colors['red'][0] + content + colors['red'][1]);

    // 写文件
    logger = log4js.getLogger('-');
    logger.error(content);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}

/**
 * 异常日志，打印堆栈，写文件
 * @param arguments
 */
function fatal()
{
    var content = util.format.apply(null, arguments);
    var logger = log4js.getLogger('console');
    logger.error(colors['magenta'][0] + content + colors['magenta'][1]);

    // 写文件
    logger = log4js.getLogger('-');
    logger.error(content);

    // 若有 telnet 连接，则发送给 telnet
    writeToTelnet(content);
}


// 缓存新的 telnet 连接
function addTelnetConnection(connection)
{
    var id = connection.remoteAddress + ':' + connection.remotePort;
    telnetConnections[id] = connection;
}

// 移除 telnet 连接
function removeTelnetConnection(connection)
{
    var id = connection.remoteAddress + ':' + connection.remotePort;
    delete telnetConnections[id];
}

// 发送给 telnet 客户端
function writeToTelnet(content)
{
    for (var id in telnetConnections)
    {
        var conn = telnetConnections[id];
        if (conn && conn.readyState == 'open')
        {
            conn.write(content);
            conn.pipe(conn);
        }
        else
        {
            delete telnetConnections[id];
        }
    }
}

// 导出模块接口
global.LOG_D = module.exports = {

    enableTrace : _enableTrace,
    trace : trace,
    debug : debug,
    info : info,
    log : log,
    warn : warn,
    error : error,
    fatal : fatal,
    addTelnetConnection : addTelnetConnection,
    removeTelnetConnection : removeTelnetConnection,
    telnetConnections : telnetConnections,
}

// 暴露给全局函数，为了调用简便
// nodejs 另提供 assert(value, message) 断言函数，该函数如果 value 值不为 true，抛出异常，打印堆栈
global.trace = LOG_D.trace;
global.debug = LOG_D.debug;
global.info = LOG_D.info;
global.log = LOG_D.log;
global.warn = LOG_D.warn;
global.error = LOG_D.error;
global.fatal = LOG_D.fatal;
global.log4js = log4js;
global.assert = require('assert');
