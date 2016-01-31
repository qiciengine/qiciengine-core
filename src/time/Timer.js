/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 链表的实现（暂时只为Timer服务）
 */
var LinkList = qc.LinkList = function(capacity) {
    /**
     * 链表的长度
     */
    this.length = capacity;

    /**
     * 头
     */
    this.head = null;

    /**
     * 尾部
     */
    this.tail = null;

    while (capacity--) {
        this.push({});
    }
};
LinkList.prototype = {};
LinkList.prototype.constructor = LinkList;

/**
 * 添加一个节点到队列尾部
 */
LinkList.prototype.push = function(node) {
    node.pre = null;
    node.next = null;
    if (!this.head) {
        this.head = node;
        this.tail = this.head;
    }
    else {
        this.tail.next = node;
        node.pre = this.tail;
        this.tail = this.tail.next;
    }
    this.length++;
};

/**
 * 插入到一个节点之前
 */
LinkList.prototype.insertBefore = function(node, newNode) {
    if (!node) {
        this.push(newNode);
        return;
    }

    var old = node.pre;
    node.pre = newNode;
    newNode.next = node;
    newNode.pre = old;
    if (old)
        old.next = newNode;
    if (!newNode.pre) this.head = newNode;
};

LinkList.prototype.remove = function(node) {
    var pre = node.pre,
        next = node.next;
    if (pre) pre.next = next;
    if (next) next.pre = pre;

    if (node === this.head) this.head = next;
    if (node === this.tail) this.tail = pre;
    node.pre = null;
    node.next = null;
    this.length--;
};

/**
 * 定时器
 *
 * @class qc.Timer
 * @param {qc.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var Timer = qc.Timer = function(game) {
    var self = this;
    self.game = game;

    /**
     * @property {boolean} paused - The paused state of the Timer. You can pause the timer by calling Timer.pause() and Timer.resume() or by the game pausing.
     * @readonly
     * @default
     */
    self.paused = false;

    /**
     * @property {Phaser.TimerEvent[]} events - An array holding all of this timers Phaser.TimerEvent objects. Use the methods add to populate it.
     */
    self.events = new qc.LinkList(0);

    /**
     * @property {Phaser.TimerEvent[]} events - An array holding all of this timers Phaser.TimerEvent objects. Use the methods loop to populate it.
     */
    self.loopEvents = new qc.LinkList(0);

    // 下个 timer 的起始时间
    this._nextTimerBegin = 0;
    this._nextLoopTimerBegin = 0;
};
Timer.prototype.constructor = Timer;

/**
 * Creates a new TimerEvent on this Timer
 */
Timer.prototype.create = function (delay, loop, callback, callbackContext, args) {
    delay = Math.round(delay);
    var event = new Phaser.TimerEvent(this, delay, delay, 0, loop, callback, callbackContext, args);

    // 如果是循环的定时器，扔到循环队列中
    this._pushEvent(loop ? this.loopEvents : this.events, event);
    return event;
};

/**
 * 添加一个定时器，执行一次后即刻销毁
 *
 * @method qc.Timer#add
 * @param {number} delay - 延迟执行的时间，单位：毫秒
 * @param {function} callback - 定时器到了后的处理
 * @param {object} callbackContext - 回调上下文
 * @param {...*} arguments - 定时器的参数列表，回调时会原样带回
 * @return {qc.TimerEvent} 定时器对象
 */
Timer.prototype.add = function(delay, callback, callbackContext) {
    // 最小时间保护
    var delay = delay > 0 ? delay : 1;

    // _nextTimerBegin 是用作保护在当前帧的定时器中设定的新的 timer 必须要在下次调度中执行，而不能在当帧
    delay += this._nextTimerBegin;

    return this.create(delay, false, callback, callbackContext, Array.prototype.splice.call(arguments, 3));
}

/**
 * 添加一个定时器，循环不休止的调用
 *
 * @method qc.Timer#add
 * @param {number} delay - 延迟执行的时间，单位：毫秒
 * @param {function} callback - 定时器到了后的处理
 * @param {object} callbackContext - 回调上下文
 * @param {...*} arguments - 定时器的参数列表，回调时会原样带回
 * @return {qc.TimerEvent} 定时器对象
 */
Timer.prototype.loop = function(delay, callback, callbackContext) {
    // 最小时间保护
    var delay = delay > 0 ? delay : 1;

    // _nextLoopTimerBegin 是用作保护在当前帧的定时器中设定的新的 timer 必须要在下次调度中执行，而不能在当帧
    delay += this._nextLoopTimerBegin;

    return this.create(delay, true, callback, callbackContext, Array.prototype.splice.call(arguments, 3));
};

/**
 * 删除一个定时器
 *
 * @param {qc.TimerEvent} id - 定时器对象
 * @method qc.Timer#remove
 */
Timer.prototype.remove = function(id) {
    // 标记下需要删除了
    id.__delete = true;
};

/**
 * 定时器帧调度
 */
Timer.prototype.update = function(time) {
    if (this.paused) return;

    // 初始化 _now 值，不难会造成 elapsed 为 NaN，导致 while 循环可能出现死循环的问题
    // 具体见任务`timer死循环的问题处理`
    this._now = this._now ? this._now : time;
    var elapsedRaw = (time - this._now) / this.game.time.timeScale;
    this._now = time;

    // 处理一次性的定时器
    var curr = this.events.head;
    var elapsed = elapsedRaw;
    var loopCount = 0;
    while (curr) {
        curr.delta -= elapsed;
        if (curr.delta > 0) break;

        // 避免死循环，原因也可见任务`timer死循环的问题处理`
        loopCount++;
        if (loopCount > 2000)
        {
            throw new Error('timer loop forever!');
            break;
        }

        // 这个定时器事件到了，需要处理之
        this._nextTimerBegin = elapsed = -curr.delta;
        this.events.remove(curr);
        if (!curr.__delete)
            curr.callback.apply(curr.callbackContext, curr.args);
        curr = this.events.head;
    }
    this._nextTimerBegin = 0;

    // 处理循环的定时器
    var list = [];
    curr = this.loopEvents.head;
    elapsed = elapsedRaw;
    while (curr) {
        curr.delta -= elapsed;
        if (curr.delta > 0) break;

        // 这个定时器事件到了，需要处理之
        this._nextLoopTimerBegin = elapsed = -curr.delta;
        this.loopEvents.remove(curr);
        if (!curr.__delete) {
            list.push(curr);
            curr.callback.apply(curr.callbackContext, curr.args);
        }
        curr = this.loopEvents.head;
    }
    this._nextLoopTimerBegin = 0;

    // 重新将这些定时器加进来
    for (var i = 0; i < list.length; i++) {
        this._pushEvent(this.loopEvents, list[i]);
    }
};

/**
 * 将定时器扔进队列中
 * @private
 */
Timer.prototype._pushEvent = function(list, event) {
    var curr = list.head;

    if (!curr) {
        // 第一个
        event.delta = event.delay;
        list.push(event);
        return;
    }

    // 找到合适的位置插入
    var tick = event.delay;
    while (curr) {
        if (tick >= curr.delta) {
            tick -= curr.delta;
            curr = curr.next;
            continue;
        }

        // 找到了，插入
        curr.delta -= tick;
        event.delta = tick;

        list.insertBefore(curr, event);
        return event;
    }

    // 到达末尾了，插入到最后面
    event.delta = tick;
    list.push(event);
    return event;
};
