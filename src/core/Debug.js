/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 调试接口的支持
 *
 * @class qc.Debug
 * @constructor
 * @internal
 */
var Debug = qc.Debug = function(game) {
    var self = this;
    self._game = game;

    /**
     * @property {boolean} on - 当前是否开启debug模式
     * @default false
     */
    self.on = false;

    /**
     * @property {number} animation - 动作驱动的耗时
     */
    self.animation = 0;

    /**
     * 帧调度的耗时分布
     * @type {number}
     */
    self.total = 0;
    self.logic = 0;
    self.render = 0;
    self.preUpdate = 0;
    self.update = 0;
    self.postUpdate = 0;

    // 远程调试分配的 clientId
    self.clientId = 0;
};

Debug.prototype = {};
Debug.prototype.constructor = Debug;

Object.defineProperties(Debug.prototype, {
    /**
     * @property {qc.Game} game - 游戏实例的引用
     * @readonly
     */
    game : {
        get : function() { return this._game; }
    },

    /**
     * @property {boolean} on - 调试模式是否开启
     */
    on : {
        get: function()  { return this._on || false; },
        set: function(v) {
            this._on = v;
            if (v) {
                // debug模式下开启trace功能
                this.game.log.enableTrace = true;
            }
        }
    },

    /**
     * @property {string} remoteLogUrl - 是否开启 poll 交互指令
     */
    remoteLogUrl : {
        set : function(v) {
            if (this.pollTimer)
            {
                this.game.timer.remove(this.pollTimer);
                this.pollTimer = null;
            }

            if (typeof(v) !== 'string')
                return;

            var self = this;
            this.pollTimer = this.game.timer.loop(1000, function(game){
                if (self.isPolling)
                    return;

                var str = ':queryCmd:' + self.clientId;
                try {
                    self.isPolling = true;
                    qc.AssetUtil.post(game.remoteLogUrl + '/remoteLog', str, function(res){
                        self.isPolling = false;

                        if (res === '200 OK')
                            return;

                        var match = res.match(/^id:(.*)/);
                        if (match)
                        {
                            self.clientId = match[1];
                            document.title = '(' + match[1] + ')' + document.title;
                            return;
                        }

                        var cmdList;
                        try {
                            cmdList = JSON.parse(res);
                        }
                        catch (e)
                        {
                            cmdList = [];
                        }
                        for (var i = 0; i < cmdList.length; i++)
                        {
                            try {
                                var ret;
                                if (!window.__wx)
                                    ret = eval(cmdList[i]);
                                else {
                                    ret = qc.Util.formatString.apply(null, ["{0}", cmdList[i]]);
                                }
                                game.log.remoteReply(ret);
                            }
                            catch(e)
                            {
                                game.log.remoteReply(e.stack);
                            }
                        }
                    }, function(xhr) {
                        console.log('queryCmd post error.');
                        self.isPolling = false;
                    });
                }
                catch(e)
                {
                    self.isPolling = false;
                }
            }, null, this.game);
        }
    }
});
