/**
 * @author chenx
 * @date 2015.11.9
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * @hackpp 替换掉场景加载完毕的判定，需要等待资源解析完毕以后才能认为加载成功了
 */
Phaser.StateManager.prototype.loadComplete = function () {
    var self = this;
    if (self._created === true) return;
    var game = self.game._qc;

    if (game.assets.parsing || game.state.pendLoadComplete) {
        game.timer.add(15, function() {
            self.loadComplete();
        });
        return;
    }

    if (self._created === false && self.onCreateCallback)
    {
        self._created = true;
        self.onCreateCallback.call(self.callbackContext, self.game);                    
    }
    else
    {
        self._created = true;
    }
};

var oldClearCurrentState = Phaser.StateManager.prototype.clearCurrentState;
Phaser.StateManager.prototype.clearCurrentState = function() {
    oldClearCurrentState.call(this);
    this.game.world.displayChanged(qc.DisplayChangeStatus.SIZE);
};
