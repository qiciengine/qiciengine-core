/**
 * @author chenx
 * @date 2015.10.16
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 用户登录登出处理模块
 */

/* 内部函数 */

// 创建新用户
function createUser(res, data)
{
    var username = data.username;
    var password = data.password;

    REDIS_D.redisOper('redisDb', 'hmset', [username, 'username', username, 'password', password, 'userData', '{}'])
        .then(function(result){
            if (result == 'OK')
            {
                // 数据库创建新用户成功
                var data = { username : username, userData : {} };
                COMMUNICATE_D.sendMessage(res, { ret : true, data : data });
                return;
            }

            // 创建用户失败
            COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'db error' });
        })
        .catch(function(err) {
            COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'db error' });
        })
}

// 保存数据
function saveUserData(res, username, saveData)
{
    console.log('saveUserData')
    REDIS_D.redisOper('redisDb', 'hset', [username, 'userData', saveData])
        .then(function(result){
            // 数据库保存数据成功
            COMMUNICATE_D.sendMessage(res, { ret : true, result : 'OK' });
        })
        .catch(function(err){
                console.log('saveUserData error')
            COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'db error' });
        })
}

// 本地帐号验证，只是读 redis 数据库，和数据库中的 password 进行比对
function localAuthAccount(res, username, password)
{
    // 从 redis 数据库中查询该玩家数据
    return new Promise(function(resolve, reject){
        REDIS_D.redisOper('redisDb', 'hgetall', [username])
            .then(function(result){
                // 取得玩家数据
                if (result == null)
                    resolve(-1);
                else
                {
                    if (result.password != password)
                        resolve(0);
                    else
                        resolve(result);
                }
            })
            .catch(function(err){
                reject(err);
            });
    });
}

/* 公共函数 */

// 用户登录，若用户不存在，会自动以 username 和 password 创建新用户，并返回新用户数据
// data 中必须有 username 和 password
function login(res, data)
{
    var username = data.username;
    var password = data.password;

    // 待处理：第三方帐号验证机制

    // 使用本地的帐号验证机制
    localAuthAccount(res, username, password)
        .then(function(result){
            if (result == 0)
                // 密码不对
                COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'password error' });
            else if (result == -1)
            {
                // 用户不存在，创建新用户
                createUser(res, data);
            }
            else
            {
                // 密码验证通过
                delete result.password;
                COMMUNICATE_D.sendMessage(res, { ret : true, data : result });
            }

        })
        .catch(function(err){
            COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'db error' });
        })
}

// 用户登出
// data 中必须有 username、password、saveData
function logout(res, data)
{
    var username = data.username;
    var password = data.password;
    var saveData = data.saveData;

    // 待处理：第三方帐号验证机制

    // 使用本地的帐号验证机制
    localAuthAccount(res, username, password)
        .then(function(result){
            if (result == 0)
                // 密码不对
                COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'password error' });
            else if (result == -1)
                // 不存在该用户
                COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'no user' });
            else
            {
                // 密码验证通过，保存数据
                saveUserData(res, username, saveData);
            }
        })
        .catch(function(err){
                console.log('logout error')
            COMMUNICATE_D.sendMessage(res, { ret : false, reason : 'db error' });
        })
}

// 模块构造函数
function create()
{
}

// 执行模块构造函数
create();

// 导出模块
global.LOGIN_D = module.exports = {
    login : login,
    logout : logout,
    create : create,
}
