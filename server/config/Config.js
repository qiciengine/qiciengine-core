/**
 * 服务器的配置信息
 */
module.exports = {
    // 服务器名字与ID
    id : 1,
    name : 'GS1',

    // 监听的端口号
    port : 8900,

    // telnet 的端口号
    telnetPort : 5001,

    // cluster 进程数量
    clusterNum : 4,

    // 数据库类型和地址(前缀必须为 redisDb)
    redisDb : {
        dbIp : '192.168.0.103',
        dbPort : 6379,
        dbIndex : 0,
        dbPassword : ''
    },
    redisDb2 : {
        dbIp : '192.168.0.103',
        dbPort : 6379,
        dbIndex : 1,
        dbPassword : ''
    },

    // mysql 配置(前缀必须为 mysqlDb)
    mysqlDb1 : {
        host : '192.168.0.103',
        port: 3306,
        database : 'test',
        user : 'root',
        password : '1234',
    },
}
