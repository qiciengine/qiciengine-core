/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 日志系统
 * @class qc.Log
 */
var Log = qc.Log = function(game) {
    var self = this;
    self.game = game;

    /**
     * @property {boolean} 是否开启trace打印
     */
    self.enableTrace = false;
};

/*
 * 普通打印日志
 * @param arguments
 */
Log.prototype.trace = function() {
    // 有配置远程日志服务器地址，则发送日志到远程服务器
    if (this.game.remoteLogUrl)
    {
        var content = qc.Util.formatString.apply(null, arguments);
        console.log(content);
        var time = new Date();
        var timeStr = time.getHours()+':'+time.getMinutes()+':'+time.getSeconds()+':'+time.getMilliseconds();
        qc.AssetUtil.post(this.game.remoteLogUrl + '/remoteLog', timeStr + ' ' + content, function(r){});
    }
    else if (this.enableTrace)
    {
        var content = qc.Util.formatString.apply(null, arguments);
        console.log(content);
    }
};

/**
 * 重要的打印日志
 * @param arguments
 */
Log.prototype.important = function() {
    var content = qc.Util.formatString.apply(null, arguments);
    console.log('%c' + content, 'color:green');

    // 有配置远程日志服务器地址，则发送日志到远程服务器
    if (this.game.remoteLogUrl)
    {
        var time = new Date();
        var timeStr = time.getHours()+':'+time.getMinutes()+':'+time.getSeconds()+':'+time.getMilliseconds();
        qc.AssetUtil.post(this.game.remoteLogUrl + '/remoteLog', timeStr + ' ' + content, function(r){});
    }
};

/**
 * 错误日志
 * @param arguments
 */
Log.prototype.error = function() {
    var content = qc.Util.formatString.apply(null, arguments);
    console.log('%c' + content, 'color:red');

    // 打印错误堆栈
    var errorStack;
    for (var i = 1; i < arguments.length; i++) {
        if (arguments[i] && arguments[i].stack) {
            errorStack = arguments[i].stack;
            console.error(errorStack);
            
            break;
        }
    }

    // 有配置远程日志服务器地址，则发送日志到远程服务器
    if (this.game.remoteLogUrl)
        qc.AssetUtil.post(this.game.remoteLogUrl + '/remoteLog', Date.now() + ' ' + errorStack ? errorStack : content, function(r){});

    if (!errorStack)
        console.trace();
};

/**
 * 远程回复
 * @param arguments
 */
Log.prototype.remoteReply = function() {
    var content = qc.Util.formatString.apply(null, arguments);
    console.log('%c' + content, 'color:green');
    qc.AssetUtil.post(this.game.remoteLogUrl + '/remoteLog', content, function(r){});
};
