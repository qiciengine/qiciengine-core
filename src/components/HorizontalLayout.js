/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 水平布局
 * 拓展TableLayout
 */
var HorizontalLayout = defineBehaviour('qc.HorizontalLayout', qc.TableLayout, function() {
    // 初始化参数
    this.style = qc.TableLayout.STYLE_RESIZE_ELEMENT;
    this.constraint = qc.TableLayout.CONSTRAINT_FIX_ROW_COUNT;
    this.contentSizeProvider = qc.TableLayout.USE_RECTTRANSFORM;
    this.stride = 1;
    this.startCorner = qc.TableLayout.CORNER_TOP_LEFT;
    this.startAxis = qc.TableLayout.AXIS_HORIZONTAL;
},{
    childForceExpandWidth : qc.Serializer.NUMBER,
    childForceExpandHeight : qc.Serializer.NUMBER
});

// 菜单上的显示
HorizontalLayout.__menu = 'UI/Layout/HorizontalLayout';

Object.defineProperties(HorizontalLayout.prototype, {
    /**
     * @property {number} spacing - 布局间距
     */
    spacing : {
        get : function() { return this.spacingX; },
        set : function(value) { this.spacingX = value; }
    },

    /**
     * @property {number} childForceExpandWidth - 是否强制拉伸宽度
     */
    childForceExpandWidth : {
        get : function() { return !!this._childForceExpandWidth; },
        set : function(value) {
            if (this._childForceExpandWidth === value) {
                return;
            }
            this._childForceExpandWidth = value;
            this.rebuildTable();
        }
    },

    /**
     * @property {number} childForceExpandWidth - 是否强制拉伸高度
     */
    childForceExpandHeight : {
        get : function() { return !!this._childForceExpandHeight; },
        set : function(value) {
            if (this._childForceExpandHeight === value) {
                return;
            }
            this._childForceExpandHeight = value;
            this.rebuildTable();
        }
    }
});

/**
 * 获取在某一轴线上的默认布局系数
 * @override
 * @private
 */
HorizontalLayout.prototype._getDefaultLayout = function(axis){
    if (axis === 'x') {
        return {min : 0,
            preferred : 0,
            flexible : this.childForceExpandWidth ? 1 : 0,
            extra : 0};
    }
    else {
        return {min : 0,
            preferred : this.childForceExpandHeight ? this.gameObject.rect.height : -1,
            flexible : 1,
            extra : 0};
    }

};

/**
 * 获取在某一节点的布局系数
 * @param node {qc.Node} - 节点
 * @returns {*|LayoutElement}
 * @override
 */
HorizontalLayout.prototype.getCellLayout = function(node) {
    var layout = qc.LayoutElement.getLayoutElement(node);
    this.childForceExpandWidth && (layout.flexibleWidth = 1);
    this.childForceExpandHeight && (layout.flexibleHeight = 1);
    return layout;
};