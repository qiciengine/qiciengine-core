/**
 * @author chenx
 * @date : 2015.10.14
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 全局启动相关工具函数
 */

var postInitList = [];
var waitPostInitList = {};
var _boot = false;

/**
 * 注册启动 post init 回调
 * @param {function} f - 回调函数
 */
function registerPostInit(f)
{
    postInitList.push(f);
}

/**
 * 依次调用 post init 回调
 */
function postInit()
{
    var tempPostInit = postInitList.slice(0);

    // 先清空，避免递归调用
    postInitList = [];
    for (var i = 0; i < tempPostInit.length; i++)
    {
        try
        {
            tempPostInit[i]();
        }
        catch (e)
        {
            error(e.stack);
        }
    }
}

function _waitPostInit()
{
    for (var id in waitPostInitList)
    {
        setTimeout(_waitPostInit, 500);
        return;
    }

    _boot = true;
    log("Startup OK.");
}

// 等待所有模块 postInit 完成
function waitPostInit()
{
    setTimeout(_waitPostInit, 500);
}

function registerWaitPostInit(id)
{
    waitPostInitList[id] = 1;
}

function unregisterWaitPostInit(id)
{
    delete waitPostInitList[id];
}

function isBooted()
{
    return _boot;
}

// 设置全局接口
G.registerPostInit = registerPostInit;
G.postInit = postInit;
G.registerWaitPostInit = registerWaitPostInit;
G.unregisterWaitPostInit = unregisterWaitPostInit;
G.waitPostInit = waitPostInit;
G.isBooted = isBooted;
