/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 全局统一的 canvas 缓存处理
 */

qc.CanvasPool = {
    // canvas 池描述
    pool : {},
    unused : [],
    cookie : 19870101,

    // 入口，获取一个闲置的可用的 canvas
    get : function(key) {
        var pool = qc.CanvasPool.pool;
        var canvas = pool[key];
        var isDirty = false;

        if (!canvas) {
            // 无效的 canvas 对象
            isDirty = true;

            // 当前 unused 中是否有元素可用，可用就拿来用，否则抛弃
            var unused = qc.CanvasPool.unused;
            if (unused.length)
                pool[key] = canvas = unused.pop();
            else
                pool[key] = canvas = Phaser.Canvas.create(1, 1);
        }

        // 记录本帧该 canvas 有被调度过
        canvas._cookie = qc.CanvasPool.cookie;
        return { canvas : canvas, dirty : isDirty };
    },

    // 统计池子使用情况，目前主要用于 debug
    stat : function() {
        var count = 0;
        var totalSize = 0;
        var pool = qc.CanvasPool.pool;

        for (var key in pool) {
            var canvas = pool[key];
            if (!canvas) continue;

            count++;
            totalSize += canvas.width * canvas.height;
        }

        console.info('当前Canvas使用中：' + count + '，总像素为：' + totalSize +
            '，未使用的Canvas数量：' + qc.CanvasPool.unused.length);
    },

    // 心跳，驱动回收
    postRender : function() {
        var self = qc.CanvasPool;
        var cookie = self.cookie;
        self.cookie = cookie + 1;

        var pool = self.pool;
        var unused = self.unused;

        // 当帧没有被调度到的 canvas 就直接回收
        // 判定当前是否有被调度的标准是 canvas._cookie 是上次的 render cookie
        var keys = Object.keys(pool);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var canvas = pool[key];
            if (canvas._cookie !== cookie) {
                // 没有用到，释放空间，再回收掉
                delete pool[key];
                canvas.width = 1;
                canvas.height = 1;
                unused.push(canvas);
            }
        }
    }
};