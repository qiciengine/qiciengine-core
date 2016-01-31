/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 调试信息查看器
 * @class qc.DebugViewer
 */
var DebugViewer = defineBehaviour('qc.DebugViewer', qc.Behaviour, function() {
        var self = this;

        // 调度次数，开始计算的时间点等
        self.count = 1;
        self.now = self.game.time.now;
        self.runInEditor = true;

        // 多久统计1次，单位为秒
        self.duration = 1;

        // 默认不显示详细信息
        self.detail = false;
    },
    {
        debugOn: qc.Serializer.BOOLEAN,
        duration: qc.Serializer.NUMBER,
        detail: qc.Serializer.BOOLEAN
    }
);

// 菜单上的显示
DebugViewer.__menu = 'Debug/DebugViewer';

Object.defineProperties(DebugViewer.prototype, {
    /**
     * @property {boolean} debugOn - 调试开关是否开启
     */
    debugOn: {
        get: function()  { return this.game.debug.on; },
        set: function(v) { this.game.debug.on = v;    }
    }
});

DebugViewer.prototype.postUpdate = function() {
    var debug = this.game.debug;
    var now = this.game.time.now;
    if (now - this.now >= this.duration * 1000) {
        // 超过1s，进行计算
        var frame = this.count * 1000 / (now - this.now);
        var preUpdate = (debug.preUpdate / this.count).toFixed(1);
        var update = (debug.update / this.count).toFixed(1);
        var postUpdate = (debug.postUpdate / this.count).toFixed(1);
        var logic = (debug.logic / this.count).toFixed(1);
        var render = (debug.render / this.count).toFixed(1);
        var total = (debug.total / this.count).toFixed(1);

        var drawCalls = this.game.phaser.renderer.renderSession.drawCount;
        if (drawCalls == null) {
            drawCalls = '(N/A)';
        }

        var wtCalcCount = this.game.phaser._calcTransformCount;

        var text =
            'FPS: ' + frame.toFixed(1) + '\n' +
            'Draw Calls: ' + drawCalls + '\n' +
            'Total: ' + total + ' ms\n' +
            'Logic: ' + logic + ' ms\n' +
            'Render: ' + render + ' ms\n' +
            'PreUpdate: ' + preUpdate + ' ms\n' +
            'Update: ' + update + ' ms\n' +
            'PostUpdate: ' + postUpdate + ' ms\n' +
            'TransformCalc: ' + wtCalcCount + '';

        if (this.detail) {
            var renderType = 'Canvas';
            if (this.game.phaser.renderType === Phaser.WEBGL)
            {
                renderType = 'WebGL';
            }
            else if (this.game.phaser.renderType == Phaser.HEADLESS)
            {
                renderType = 'Headless';
            }
            text += '\n------------\n' +
                'resolution=' + this.game.phaser.resolution + '\n' +
                'devicePixelRatio=' + window.devicePixelRatio + '\n' +
                'size=' + this.game.width + '*' + this.game.height + '\n' +
                'renderType=' + renderType + '\n' +
                'antialias=' + this.game.antialias;
        }    

        if (this.gameObject instanceof qc.UIText)
            this.gameObject.text = text;
        else if (this.gameObject instanceof qc.Dom) {
            text = text.replace(/\n/g, '<br/>');
            this.gameObject.innerHTML = text;
        }

        // 重置下
        this.count = 1;
        this.now = now;
        debug.total = 0;
        debug.logic = 0;
        debug.preUpdate = 0;
        debug.update = 0;
        debug.postUpdate = 0;
        debug.render = 0;
    }
    else {
        this.count++;
    }
};
