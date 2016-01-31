/**
 * @author chenx
 * @date 2015.10.16
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * redis 数据库操作模块
 */

var redis = require('redis');

// 记录 redis 连接对象映射关系
var _redisDbMap = {};

/* 内部函数 */

function connectRedis(dbName, dbConfig)
{
    log('连接 redis 数据库(%s/%s:%d)中...', dbName, dbConfig.dbIp, dbConfig.dbPort);

    var passwd = dbConfig.dbPassword || '';
    passwd = passwd.length == 0 ? undefined : passwd;
    var db = redis.createClient(dbConfig.dbPort, dbConfig.dbIp, { auth_pass : passwd });

    db.on('error', function(err) {
        // 标记需要立刻重新连接了
        error('连接 reids 数据库(%s/%s:%d)错误(%s)，尝试重连', dbName, dbConfig.dbIp, dbConfig.dbPort, err);

    });
    db.on("connect", function() {
        log('连接 redis 数据库(%s/%s:%d)成功', dbName, dbConfig.dbIp, dbConfig.dbPort);

        if (dbConfig.dbIndex)
        {
            // 切换数据库
            db.select(dbConfig.dbIndex);
        }

        // 启服过程中连接成功
        if (!G.isBooted())
            G.unregisterWaitPostInit(dbName);

        // 缓存连接对象
        _redisDbMap[dbName] = db;
    });
}

// post init 回调函数
function whenPostInit()
{
    var config = G.getConfig();

    // 连接所有配置的 redis 服务器
    for (var key in config)
    {
        if (key.indexOf('redisDb') != -1)
        {
            // 注册等待redis连接完成
            G.registerWaitPostInit(key);
            connectRedis(key, config[key]);
        }
    }
}

/* 公共函数 */

// 取得 redis 连接对象，不存在则创建
function getRedisDb(dbName)
{
    var db = _redisDbMap[dbName];
    if (db)
        return db;

    // 不存在则新建
    var config = G.getConfig();
    var dbConfig = config[dbName];
    if (!dbConfig)
    {
        assert(false, util.format('不存在dbName(%s)的 redis 配置', dbName));
        return;
    }

    // 连接 redis
    connectRedis(dbName, dbConfig);
}

/**
 * 执行 redis 命令
 * @method DB_D.redisOper
 * @param {string} dbName - Config 配置文件中配置的 redisDb
 * @param {string} cmd - redis cmd
 * @param {array} cmdArg - redis 命令参数
 *    比如 hset id key value 这条 redis 语句，cmd 为 hset，cmdArg 为 [id, key, value]
 */
function redisOper(dbName, cmd, cmdArg)
{
    return new Promise(function (resolve, reject) {
            console.log('redisOper');
        var db = getRedisDb(dbName);
        if (!db)
        {
            reject(-1);
            return;
        }

        // 执行 redis 命令
        db.send_command(cmd, cmdArg, function(err, res){
            if (err)
            {
                error('redis执行失败:%s', err);
                reject(err);
            }
            else
                resolve(res);
        });
    });
}

/**
 * 执行 redis multi 多事务命令
 * @method DB_D.redisOper
 * @param {string} dbName - Config 配置文件中配置的 redisDb
 * @param {array} cmdList - 多条 redis 命令
 *    比如 hset id key value; hset id2 key value 这2条 redis 语句，
 *    cmdList 为 [ ['hset', 'id', key, value], ['hset', 'id', key, value] ]
 */
function redisMulti(dbName, cmdList)
{
    return new Promise(function (resolve, reject) {
        var db = getRedisDb(dbName);
        if (!db)
        {
            reject(-1);
            return;
        }

        // 执行 redis multi 命令
        var multi = db.multi(cmdList);
        multi.exec(function(err, res){
            if (err)
            {
                error('redis执行失败:%s', err);
                reject(err);
            }
            else
                resolve(res);
        });
    });
}


// 导出模块
global.REDIS_D = module.exports = {
    redisOper : redisOper,
    redisMulti : redisMulti,
    getRedisDb : getRedisDb,
    create : create,
}

// 模块构造函数
function create()
{
    G.registerPostInit(whenPostInit);
}

// 执行模块构造函数
create();
