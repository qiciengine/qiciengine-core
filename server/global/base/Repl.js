/**
 * @author chenx
 * @date 2015.10.18
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * repl 控制台，用于与脚本环境进行交互
 */

// 没有指定 --repl，不创建 repl 控制台
if (process.argv.indexOf('--repl') <= 0)
    return;

var repl = require("repl");
var chalk = require('chalk');
var config = G.getConfig();

// win32直接用 console 控制台
if (os.platform() == 'win32') {
    repl.start({
        prompt: chalk.green(config.name + '> '),
        input: process.stdin,
        output: process.stdout,
        useGlobal : true,
        eval : function(cmd, context, fileName, callback) {
            var match = cmd.match(/^use (.*)/);
            if (match)
            {
                // 切换 client
                switchCurrClient(match[1].trim());
                callback(null, 'OK');
            }
            else
            {
                match = cmd.match(/^p(\d*) (.+)/);
                if (match)
                {
                    if (match[1] === '')
                        queueClientCmd(match[2]);
                    else
                        queueClientCmd(match[2], match[1].trim());
                }
                else
                    callback(null, eval(cmd));
            }
        },

    });
}

if (!config.telnetPort)
    return;

// 其它平台监听 telnet 端口，通过 telnet 方式登录脚本后台
var net = require('net');
var server = net.createServer(function(c) {

    // 收到新连接

    repl.start({
        prompt: chalk.green(config.name + '> '),
        stream: c,
        useGlobal : true,
        eval : function(cmd, context, fileName, callback) {
            var match = cmd.match(/^use (.*)/);
            if (match)
            {
                // 切换 client
                switchCurrClient(match[1].trim());
                callback(null, 'OK');
            }
            else
            {
                match = cmd.match(/^p(.*) (.*)/);
                if (match)
                {
                    if (match[1] === '')
                        queueClientCmd(match[2]);
                    else
                        queueClientCmd(match[2], match[1].trim());
                }
                else
                    callback(null, eval(cmd));
            }
        },
    });

    c.on('close', function (e) {
        LOG_D.removeTelnetConnection(c);
    });

    c.on('error', function (e) {
        LOG_D.removeTelnetConnection(c);
    });

    LOG_D.addTelnetConnection(c);
});

// 开始监听 telnet 端口
server.listen(config.telnetPort, function() {
    log('监听 telnet 端口 %d 成功。', config.telnetPort);
});

log('监听 telnet 端口 %d 。。。', config.telnetPort);

server.on('error', function(err){
    error('监听 telnet 端口 %d 失败：%s', config.telnetPort, err.stack);
});
