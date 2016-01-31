/**
 * @author chenx
 * @date 2015.12.05
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 微信
 */

var TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
var OAUTH_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token';
var TICKET_URL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
var AUTH_URL = "https://open.weixin.qq.com/connect/oauth2/authorize";
var REFRESH_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
var USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo';

var appInfo = {
    'wxd0032edbef6a88d7' : 'd4624c36b6795d1d99dcf0547af5443d',
};

var https = require('https');

/* 内部函数 */

/* 公共函数 */

// 取得微信 token
function getToken(appid)
{
    return new Promise(function(resolve, reject){

        // 从 redis 中取得缓存的 token
        REDIS_D.redisOper('redisDb', 'get', ['wechat_token'])
            .then(function(res){
                // 判断缓存的 token 是否过期
                if (res)
                {
                    var json = JSON.parse(res);
                    var time = json.time;
                    var expire = json.expires_in || 1800;
                    if (time + (expire - 100) * 1000 > Date.now())
                        // 未到期，直接使用该 token
                        return json.access_token;
                }

                // 需要取新的 token
                return null;
            })
            .then(function(token){
                if (token == null)
                {
                    // 获取新的 token
                    var url = util.format('%s?grant_type=client_credential&appid=%s&secret=%s',
                                          TOKEN_URL, appid, appInfo[appid]);
                    trace('getToken : %s', url);

                    https.get(url, function(res) {
                        res.on('data', function(d) {
                            var ret = JSON.parse(d);
                            log('ret: %j', ret)

                            var access_token = ret.access_token;
                            if (access_token)
                            {
                                // 缓存到 redis 中
                                ret.time = Date.now();
                                REDIS_D.redisOper('redisDb', 'set', ['wechat_token', JSON.stringify(ret)]);

                                // 返回 token 信息
                                resolve(access_token);
                            }
                            else
                                reject(-1);
                        });

                    }).on('error', function(e) {
                        error(e.stack);
                        reject(e);
                    });
                }
                else
                    // 返回已有的 token
                    resolve(token);
            })
            .catch(function(err){
                error(err.stack);
                reject(err);
            })
    });
}

// 取得微信 ticket
function getTicket(token)
{
    return new Promise(function(resolve, reject){
         // 从 redis 中取得缓存的 ticket
        REDIS_D.redisOper('redisDb', 'get', ['wechat_ticket'])
            .then(function(res){
                // 判断缓存的 ticket 是否过期
                if (res)
                {
                    var json = JSON.parse(res);
                    var time = json.time;
                    var expire = json.expires_in || 1800;
                    if (time + (expire - 100) * 1000 > Date.now())
                        // 未到期，直接使用该 ticket
                        return json.ticket;
                }

                // 需要取新的 ticket
                return null;
            })
            .then(function(ticket){
                if (ticket == null)
                {
                    // 取新的 ticket
                    var url = util.format('%s?type=jsapi&access_token=%s', TICKET_URL, token);
                    trace('getTicket : %s', url);

                    https.get(url, function(res) {
                        res.on('data', function(d) {
                            var ret = JSON.parse(d);
                            log('ret: %j', ret)

                            var ticket = ret.ticket;
                            if (ticket)
                            {
                                // 缓存到 redis 中
                                ret.time = Date.now();
                                REDIS_D.redisOper('redisDb', 'set', ['wechat_ticket', JSON.stringify(ret)]);

                                // 返回 ticket 信息
                                resolve(ticket);
                            }
                            else
                                reject(-1);
                        });
                    }).on('error', function(e) {
                        error(e.stack);
                        reject(e);
                    });
                }
                else
                    // 返回已有的 ticket
                    resolve(ticket);
            })
            .catch(function(err){
                error(err.stack);
                reject(err);
            })
    });
}

// 获取签名信息，在微信分享时需要
function getSign(appid, url)
{
    return new Promise(function(resolve, reject){

        // 先取得 token
        getToken(appid)
        // 根据 token 取 ticket
        .then(getTicket)
        // 根据 ticket 计算 signature
        .then(function(ticket){
            console.log('after ticket', ticket)
            var nonce = getRandomStr(16);
            var timestamp = Date.now();

            var str = util.format("jsapi_ticket=%s&noncestr=%s&timestamp=%s&url=%s", ticket, nonce, timestamp, url);

            // 加密
            var sign = sha1(str);

            var ret = {
                'appId' : appid,
                'nonceStr' : nonce,
                'timestamp' : timestamp,
                'url' :  url,
                'signature' : sign,
                'rawString' : str,
            };

            resolve(ret);
        })
        .catch(function(err){
            reject(err);
        })
    })
}

// 根据微信登录取得的 code 取得对应的 token
function getTokenByCode(appid, code)
{
    return new Promise(function(resolve, reject){
        if (!appInfo[appid])
        {
            reject(-1);
            return;
        }

        var url = util.format('%s?appid=%s&secret=%s&code=%s&grant_type=authorization_code',
                            OAUTH_TOKEN_URL, appid, appInfo[appid], code);

        trace('getTokenByCode : %s', url);

        https.get(url, function(res) {
            res.on('data', function(d) {
                var ret = JSON.parse(d);
                log('ret: %j', ret)

                var access_token = ret.access_token;
                var refresh_token = ret.refresh_token;
                if (access_token && refresh_token)
                {
                    // 缓存到 redis 中
                    var sessionId = getRandomStr(16);
                    ret.sessionId = sessionId;
                    REDIS_D.redisMulti('redisDb', [['set', sessionId, JSON.stringify(ret)],
                                                   ['expire', sessionId, 30*3600*24]]);

                    // 返回 token 信息
                    resolve(ret);
                }
                else
                    reject(-1);
            });
        }).on('error', function(e) {
            error(e.stack);
            reject(e);
        });
    });
}

// 刷新 token
function refreshToken(appid, sessionId)
{
    return new Promise(function(resolve, reject){
        if (!appInfo[appid])
        {
            reject(-1);
            return;
        }

        // 从 redis 中取得缓存的 ticket
        REDIS_D.redisOper('redisDb', 'get', [sessionId])
            .then(function(res){
                // 判断是否存在 sessionId
                if (res)
                {
                    var json = JSON.parse(res);
                    var refresh_token = json.refresh_token;
                    if (refresh_token)
                        return refresh_token;
                }

                return null;
            })
            .then(function(refresh_token){
                if (refresh_token)
                {
                    // 刷新 token
                    var url = util.format('%s?appid=%s&grant_type=refresh_token&refresh_token=%s',
                                        REFRESH_TOKEN_URL, appid, refresh_token);

                    trace('refreshToken : %s', url);

                    https.get(url, function(res) {
                        res.on('data', function(d) {
                            var ret = JSON.parse(d);
                            log('ret: %j', ret)

                            var access_token = ret.access_token;
                            if (access_token)
                            {
                                // 返回 token 信息
                                resolve(ret);
                            }
                            else
                                reject(-1);
                        });
                    }).on('error', function(e) {
                        error(e.stack);
                        reject(e);
                    });
                }
                else
                    reject(-1);
            })
            .catch(function(err){
                error(err.stack);
                reject(err);
            })

    });
}

// 微信登录，返回用户信息
function wechatLogin(res, appid, codeOrSessionId, isCode)
{
    var tokenPromise;

    if (isCode)
        tokenPromise = getTokenByCode(appid, codeOrSessionId);
    else
        tokenPromise = refreshToken(appid, codeOrSessionId);

    tokenPromise.then(function(result){
        var access_token = result.access_token;
        var openid = result.openid;
        if (access_token && openid)
        {
            var url = util.format('%s?access_token=%s&openid=%s&lang=zh_CN',
                                   USERINFO_URL, access_token, openid);

            trace('getUserInfo : %s', url);

            https.get(url, function(res) {
                res.on('data', function(d) {
                    var ret = JSON.parse(d);
                    log('ret: %j', ret)

                    var openid = ret.openid;
                    var unionid = ret.unionid;
                    if (openid && unionid)
                    {
                        // 返回用户信息
                        COMMUNICATE_D.sendMessage(res, {
                            ret : true,
                            openid : openid,
                            unionid : unionid,
                            userinfo : ret });
                    }
                    else
                        COMMUNICATE_D.sendMessage(res, { ret : false });
                });
            }).on('error', function(e) {
                error(e.stack);
                COMMUNICATE_D.sendMessage(res, { ret : false });
            });
        }
    })
    .catch(function(err){
        // 登录失败
        COMMUNICATE_D.sendMessage(res, { ret : false });
    })
}

// 模块构造函数
function create()
{
}

// 执行模块构造函数
create();

// 导出模块
global.WECHAT_D = module.exports = {
    getTicket : getTicket,
    getToken : getToken,
    getSign : getSign,
    create : create,
}
