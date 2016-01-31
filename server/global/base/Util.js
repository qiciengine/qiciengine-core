/**
 * @author chenx
 * @date 2015.10.17
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 提供常用接口的封装
 */

// 捕获脚本异常处理
process.on('uncaughtException', function(er){

    // 连接断开的异常不处理
    if (er.code == 'ECONNRESET' || er.code == 'EPIPE')
        return;

    error(er.stack)
});

// 取得新的 cookie
var sCookie = 0;
function newCookie()
{
    sCookie = sCookie + 1;
    sCookie = sCookie & 0xffffffff;
    sCookie = sCookie == 0 ? 1 : sCookie;

    return sCookie;
}
global.newCookie = newCookie;

// sha1 加密
function sha1(str)
{
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha1');
    shasum.update(str);
    var sign = shasum.digest('hex');
    return sign;
}
global.sha1 = sha1;

// md5 加密
function md5(str)
{
    var crypto = require('crypto');
    var shasum = crypto.createHash('md5');
    shasum.update(str);
    var sign = shasum.digest('hex');
    return sign;
}
global.md5 = md5;

// 取得随机字符串
function getRandomStr(length)
{
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var strList = [];
    length = length || 16;
    for (var i = 0; i < length; i++)
    {
        var index = Math.floor(Math.random(1) * chars.length);
        strList.push(chars.slice(index, index + 1));
    }

    return strList.join('');
}
global.getRandomStr = getRandomStr;
