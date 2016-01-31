/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 布局器使用的节点
 * 用来控制节点在布局管理器中的表现
 * 尺寸分为：最小值，首选值，可变值，最大值。
 * 不设置时表示没有限制
 * 满足规则如下：
 * - 如果不能满足最小值的设定，则以最小值设置
 * - 如果不能或者刚好满足首选值的设定，则以首选值为权重进行分配空间
 * - 如果空间不大于最大值的设定，则将满足首选值外的剩余空间以可变值为权重进行分配
 * - 如果大于最大值的设定，则按最大值设置
 * @class qc.LayoutElement
 */
var LayoutElement = defineBehaviour('qc.LayoutElement', qc.Bounds, function() {
    /**
     * @property {boolean} ignoreLayout - 是否允许忽略布局参数
     */
    this.ignoreLayout = false;
    /**
     * @property {Number} minWidth - 节点允许的最小宽度
     */
    this.minWidth = -1;
    /**
     * @property {Number} minHeight - 节点允许的最小高度
     */
    this.minHeight = -1;
    /**
     * @property {Number} preferredWidth - 首选宽度
     */
    this.preferredWidth = -1;
    /**
     * @property {Number} preferredWidth - 首选高度
     */
    this.preferredHeight = -1;
    /**
     * @property {Number} flexibleWidth - 可变宽度
     */
    this.flexibleWidth = -1;
    /**
     * @property {Number} flexibleWidth - 可变高度
     */
    this.flexibleHeight = -1;

    /**
     * @property {number} _deep - 边界遍历深度
     */
    this._deep = 0;
},{
    ignoreLayout : qc.Serializer.BOOLEAN,
    minWidth : qc.Serializer.NUMBER,
    minHeight : qc.Serializer.NUMBER,
    preferredWidth : qc.Serializer.NUMBER,
    preferredHeight : qc.Serializer.NUMBER,
    flexibleWidth : qc.Serializer.NUMBER,
    flexibleHeight : qc.Serializer.NUMBER
});

// 菜单上的显示
LayoutElement.__menu = 'UI/Layout/LayoutElement';

Object.defineProperties(LayoutElement.prototype, {
    /**
     * @property {boolean} ignoreLayout - 是否允许忽略布局参数
     */
    ignoreLayout : {
        get : function() { return this._ignoreLayout; },
        set : function(v) {
            if (v === this._ignoreLayout) return;
            this._ignoreLayout = v;
        }
    },
    /**
     * @property {Number} minWidth - 节点允许的最小宽度
     */
    minWidth : {
        get : function() { return this._minWidth; },
        set : function(v) {
            if (v === this._minWidth) return;
            this._minWidth = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },
    /**
     * @property {Number} minHeight - 节点允许的最小高度
     */
    minHeight : {
        get : function() { return this._minHeight; },
        set : function(v) {
            if (v === this._minHeight) return;
            this._minHeight = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },
    /**
     * @property {Number} preferredWidth - 首选宽度
     */
    preferredWidth : {
        get : function() { return this._preferredWidth; },
        set : function(v) {
            if (v === this._preferredWidth) return;
            this._preferredWidth = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },
    /**
     * @property {Number} preferredWidth - 首选高度
     */
    preferredHeight : {
        get : function() { return this._preferredHeight; },
        set : function(v) {
            if (v === this._preferredHeight) return;
            this._preferredHeight = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },
    /**
     * @property {Number} flexibleWidth - 可变宽度
     */
    flexibleWidth : {
        get : function() { return this._flexibleWidth; },
        set : function(v) {
            if (v === this._flexibleWidth) return;
            this._flexibleWidth = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },
    /**
     * @property {Number} flexibleWidth - 可变高度
     */
    flexibleHeight : {
        get : function() { return this._flexibleHeight; },
        set : function(v) {
            if (v === this._flexibleHeight) return;
            this._flexibleHeight = v;
            this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
        }
    },

    /**
     * @property {boolean} hasMinWidth - 是否设置了最小宽度
     */
    hasMinWidth : {
        get : function() { return this.minWidth >= 0; },
        set : function(v) {
            if (this.hasMinWidth === v) {
                return;
            }
            this.minWidth = v ? 0 : -1;
        }
    },
    /**
     * @property {boolean} hasMinHeight - 是否设置了最小高度
     */
    hasMinHeight : {
        get : function() { return this.minHeight >= 0; },
        set : function(v) {
            if (this.hasMinHeight === v) {
                return;
            }
            this.minHeight = v ? 0 : -1;
        }
    },
    /**
     * @property {boolean} hasPreferredWidth - 是否设置了首选宽度
     */
    hasPreferredWidth : {
        get : function() { return this.preferredWidth >= 0; },
        set : function(v) {
            if (this.hasPreferredWidth === v) {
                return;
            }
            this.preferredWidth = !v ? -1 : (this.gameObject ? this.gameObject.width : 0);
        }
    },
    /**
     * @property {boolean} hasMinHeight - 是否设置了首选高度
     */
    hasPreferredHeight : {
        get : function() { return this.preferredHeight >= 0; },
        set : function(v) {
            if (this.hasPreferredHeight === v) {
                return;
            }
            this.preferredHeight = !v ? -1 : (this.gameObject ? this.gameObject.height : 0);
        }
    },
    /**
     * @property {boolean} hasFlexibleWidth - 是否设置了拓展宽度
     */
    hasFlexibleWidth : {
        get : function() { return this.flexibleWidth >= 0; },
        set : function(v) {
            if (this.hasFlexibleWidth === v) {
                return;
            }
            this.flexibleWidth = v ? 1 : -1;
        }
    },
    /**
     * @property {boolean} hasMinHeight - 是否设置了首选高度
     */
    hasFlexibleHeight : {
        get : function() { return this.flexibleHeight >= 0; },
        set : function(v) {
            if (this.hasFlexibleHeight === v) {
                return;
            }
            this.flexibleHeight = v ? 1 : -1;
        }
    }
});

/**
 * 获取一个节点上的布局元素
 * @param node
 * @returns {*|LayoutElement}
 */
LayoutElement.getLayoutElement = function(node) {
    var ret = new LayoutElement();
    var element = node.getScript('qc.LayoutElement');
    if (element && !element.ignoreLayout) {
        ret.ignoreLayout = element.ignoreLayout;
        ret.minWidth = element.minWidth;
        ret.minHeight = element.minHeight;
        ret.preferredWidth = element.preferredWidth;
        ret.preferredHeight = element.preferredHeight;
        ret.flexibleWidth = element.flexibleWidth;
        ret.flexibleHeight = element.flexibleHeight;
    }
    return ret;
};

/**
 * 使用 RectTransform 作为布局尺寸提供者
 * RectTransform不受 Scale，Rotation 参数影响
 * @constant
 * @type {number}
 */
LayoutElement.USE_RECTTRANSFORM = qc.Bounds.USE_RECTTRANSFORM;

/**
 * 使用Bounds作为布局尺寸提供者
 * Bounds为实现显示节点需要的尺寸
 * @constant
 * @type {number}
 */
LayoutElement.USE_BOUNDS = qc.Bounds.USE_BOUNDS;