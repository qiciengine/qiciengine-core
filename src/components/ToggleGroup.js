/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 单选按钮组，挂载到Node节点后生效
 *
 * @class qc.ToggleGroup
 */
var ToggleGroup = qc.defineBehaviour('qc.ToggleGroup', qc.Behaviour, function() {
    this._toggles = [];
    this.runInEditor = true;

    /**
     * @property {qc.Signal} onValueChange - 开关组选中状态变化产生的事件
     */
    this.onValueChange = new qc.Signal();
}, {
    toggles : qc.Serializer.NODES,
    allowSwitchOff : qc.Serializer.BOOLEAN
});

// 菜单上的显示
ToggleGroup.__menu = 'UI/ToggleGroup';

Object.defineProperties(ToggleGroup.prototype, {
    /**
     * @property {qc.Toggle|Array} toggle - 当前处于开启的开关
     */
    toggle : {
        get : function() {
            for (var i = 0; i<this._toggles.length; i++) {
                var t = this._toggles[i];
                if (t && t.on) {
                    return t;
                }
            }
            return null;
        },
        set : function(v) {
            var index = this._toggles.indexOf(v);
            if (index === -1) {
                this.game.log.error("target is not in this group");
                return;
            }
            for (var i = 0; i<this._toggles.length; i++) {
                var t = this._toggles[i];
                if (t) {
                    t.on = (t === v);
                }
            }
            this.onValueChange.dispatch(this, v, true);
        }
    },

    /**
     * @property {array} toggles - 所有的开关列表
     * @readonly
     */
    toggles : {
        get : function() {
            return this._toggles;
        },
        set : function(v) {
            var self = this;
            // 删除老对象的监听
            self._toggles.forEach(function(t) {
                if (t) {
                    t.onValueChange.remove(self._onValueChange, self);
                    t.canValueChange.remove(self._canValueChange, self);
                }
            });
            self._toggles = v || [];
            // 添加新对象的监听
            self._toggles.forEach(function(t) {
                if (t) {
                    t.onValueChange.add(self._onValueChange, self);
                    t.canValueChange.add(self._canValueChange, self);
                }
            });
        }
    },

    /**
     * @property {boolean} allowSwitchOff - 是否允许空的选择
     */
    allowSwitchOff : {
        get : function() {
            var v = this._allowSwitchOff;
            // 默认行为是 true
            if (v === undefined)
                return true;
            else
                return v;
        },
        set : function(v) {
            // 强转 boolean
            v = !!v;

            var lastOption = this.allowSwitchOff;
            if (lastOption === v) return;

            this._allowSwitchOff = v;

            if (!v) this._assureSelection();
        }
    }
});

// 确保选中状态
ToggleGroup.prototype._assureSelection = function() {
    if (this.toggle != null) return;

    // 确保有个选中
    var toggles = this.toggles;
    if (toggles && toggles.length) {
        var toggle = toggles[0];
        if (toggle) toggle.on = true;
    }
};

/**
 * 添加一个开关到开关组中
 *
 * @method qc.ToggleGroup#add
 * @param toggle
 */
ToggleGroup.prototype.add = function(toggle) {
    if (this._toggles.indexOf(toggle) !== -1)
        // 已经在组内控制中了
        return;

    // 关注其值的改变，确保开启时其他按钮设置为关闭
    this._toggles.push(toggle);

    // 添加进来时，默认都是关闭的状态
    toggle.on = false;

    toggle.onValueChange.add(this._onValueChange, this);
    toggle.canValueChange.add(this._canValueChange, this);

    // 是否尝试选中之
    if (!this.allowSwitchOff)
        this._assureSelection();
};

/**
 * 将开关从开关组中移除
 *
 * @method qc.ToggleGroup#remove
 * @param toggle
 */
ToggleGroup.prototype.remove = function(toggle) {
    var index = this._toggles.indexOf(toggle);
    if (index === -1)
        // 开关不在组中，不需要移除
        return;

    this._toggles.splice(index, 1);
    toggle.onValueChange.remove(this._onValueChange, this);
    toggle.canValueChange.remove(this._canValueChange, this);

    // 如果当前被删除的是选中态的，需要尝试选别人
    if (!this.allowSwitchOff)
        this._assureSelection();
};

/**
 * 当前开关是否允许切换
 */
ToggleGroup.prototype._canValueChange = function(toggle, v, old, ret) {
    // 允许空选择
    if (this.allowSwitchOff) return;

    // 只关心从勾选到空的情况
    if (!old || v) return;

    // 不允许为空，列表又没有其他的选择项，不允许取消，修改对象返回值
    var isMember = false;
    for (var i = 0, len = this.toggles.length; i < len; i++) {
        var t = this.toggles[i];
        if (t === toggle) {
            isMember = true;
            continue;
        }

        // 有其他 toggle 选中中
        if (t && t.on)
            return;
    }

    if (isMember) ret.ignore = true;
};

/**
 * 关注开关变化的回调
 *
 * @param toggle
 * @private
 */
ToggleGroup.prototype._onValueChange = function(toggle) {
    if (toggle.on) {
        this.toggle = toggle;
    }
    else {
        if (!this.toggle)
            // 取消这个 group 的所有选择，需给事件
            this.onValueChange.dispatch(this, toggle, false);
    }
};
