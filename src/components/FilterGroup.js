/**
 * Created by qcplay on 7/8/15.
 */

/**
 * 着色器支持管理类
 * 用来控制值节点的着色器操作
 */

var FilterGroup = defineBehaviour('qc.FilterGroup', qc.Behaviour, function() {
    /**
     * @property {[qc.Filter]} _filters - 当前使用的着色器
     * @private
     */
    this._filters = [];
}, {
    filters : Serializer.FILTERS,
    inherited : Serializer.BOOLEAN
});

// 菜单上的显示
FilterGroup.__menu = 'UI/FilterGroup';

Object.defineProperties(FilterGroup.prototype,{
    /**
     * @property {qc.Filter} filters - 当前使用的所有着色器
     */
    filters : {
        get : function() { return this._filters; },
        set : function(v) {
            this._filters = v;
            this.refresh();
        }
    },

    /**
     * @property {boolean}  inherited - 是否被子节点继承
     */
    inherited : {
        get : function() {
            return !(this.gameObject && this.gameObject.filterSelf);
        },
        set : function(v) {
            this.gameObject && (this.gameObject.filterSelf = !v);
        }
    }
});

/**
 * 禁用
 */
FilterGroup.prototype.onDisable = function() {
    if (!this.gameObject || this.gameObject._destroy)
        return;
    this.refresh();
};

/**
 * 启用
 */
FilterGroup.prototype.onEnable = function() {
    if (!this.gameObject || this.gameObject._destroy)
        return;
    this.refresh();
};

/**
 * 销毁
 */
FilterGroup.prototype.onDestroy = function() {
    if (!this.gameObject || this.gameObject._destroy)
        return;
    this.gameObject.phaser && (this.gameObject.phaser.filters = null);
};

/**
 * 刷新当前着色器状态
 */
FilterGroup.prototype.refresh = function() {
    if (!this.gameObject || this.gameObject._destroy) {
        return;
    }
    if (!this.enable) {
        this.gameObject.phaser.filters = null;
    }
    else if (this.enable) {
        this.gameObject.phaser.filters = this.filters && this.filters.length > 0 ? this.filters : null;
    }
};

/**
 * 根据类型查找着色器
 * @param cls {string|qc.Filter} - 需要查找的着色器类名
 * @return {[qc.Filter]}
 */
FilterGroup.prototype.findFilter = function(cls) {
    if (typeof cls === 'string')
        cls = qc.Util.findClass(cls);
    var filters = [];
    for (var c in this.filters) {
        if (this.filters[c] instanceof cls) {
            filters.push(this.filters[c]);
        }
    }
    return filters;
};

/**
 * 移除一个指定位置的着色器
 * @param filter {number}
 */
FilterGroup.prototype.removeFilterAt = function(idx) {
    if (idx < 0 || idx >= this.filters.length) {
        return;
    }
    var filter = this.filters.splice(idx, 1);
    this.refresh();
    return filter;
};

/**
 * 根据类型或者对象删除着色器
 * @param obj {string|qc.Filter|object} - 需要删除的着色器
 */
FilterGroup.prototype.removeFilter = function(obj) {
    if (typeof obj === 'string') {
        obj = qc.Util.findClass(obj);
    }
    var remove = [];
    var idx = this.filters.length;
    if (typeof obj === 'function') {
        while (idx-- > 0) {
            if (this.filters[idx] instanceof obj) {
                remove.push(this.filters.splice(idx, 1));
            }
        }
    }
    else {
        while (idx-- > 0) {
            if (this.filters[idx] === obj) {
                remove.push(this.filters.splice(idx, 1));
            }
        }
    }
    this.refresh();
    return remove;
};

/**
 * 添加一个着色器
 * @param obj {string|qc.Filter|object} - 需要添加着色器类或者对象
 * @param idx {null|number} - 需要添加到的位置
 */
FilterGroup.prototype.addFilter = function(obj, idx) {
    if (typeof obj === 'string') {
        obj = qc.Util.findClass(obj);
        if (typeof obj !== 'function') {
            return null;
        }
    }

    if (typeof obj === 'function') {
        obj = new obj();
    }
    else {
        var idx = this.filters.length;
        while (idx-- > 0) {
            if (this.filters[idx] === obj) {
                // 已存在该对象
                return;
            }
        }
    }

    if (isNaN(idx) || idx < 0 || idx > this.filters.length) {
        this.filters.push(obj);
    }
    else {
        this.filters.splice(idx, 0, obj);
    }

    this.refresh();
    return obj;
};