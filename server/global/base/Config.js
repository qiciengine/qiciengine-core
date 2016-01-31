/**
 * @author chenx
 * @date : 2015.10.14
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 读取服务器启动配置文件信息
 */

var path = require('path');
var config = {};

function getConfig()
{
    return config;
}

function create()
{
    var configFile = process.argv[2] || '';
    if (configFile.indexOf('Config') == -1)
        configFile = 'config/Config';

    config = require(path.join(G.serverRoot, configFile));
}

create();

// 设置全局接口
G.getConfig = getConfig;
