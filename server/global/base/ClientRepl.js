/**
 * @author chenx
 * @date 2016.1.1
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 远程客户端控制台交互模块
 */

var queueCmds = {};
var clientIds = {};
var cookie = 0;
var currClientId = 0;

// 取得一个可用的 clientId
function getAvaiableId()
{
    cookie++;
    return cookie;
}

// 切换当前客户端的 id
function switchCurrClient(id)
{
    currClientId = id;
}
global.switchCurrClient = switchCurrClient;

// 缓存客户端的脚本语句，以便客户端来获取
function queueClientCmd(str, clientId)
{
    clientId = clientId || currClientId;
    queueCmds[clientId] = queueCmds[clientId] || [];
    queueCmds[clientId].push(str);
}
global.queueClientCmd = queueClientCmd;

// 客户端请求获取脚本指令
function queryCmdFromClient(res, clientId)
{
    if (clientId == 0)
    {
        // 客户端 id 未分配，分配一个可用 id
        clientId = getAvaiableId();
        res.send('id:' + clientId);
        res.end();
        return;
    }

    var cmdList = queueCmds[clientId];
    if (!cmdList && currClientId === 0)
    {
        cmdList = queueCmds[0];
        clientId = 0;
    }

    if (cmdList)
    {
        res.send(JSON.stringify(cmdList))
        res.end();
        queueCmds[clientId] = null;
    }
    else
    {
        res.send('200 OK');
        res.end();
    }
}
global.queryCmdFromClient = queryCmdFromClient;
