/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 为节点提供边界信息编辑功能
 * @class qc.Bounds
 */
var Bounds = defineBehaviour('qc.Bounds', qc.Behaviour, function() {
    // 设置默认尺寸提供者
    this._sizeProvider = Bounds.USE_BOUNDS;

    // 是否自动每帧计算边界
    this._autoCalcBounds = true;

    // 设置默认边距
    this._marginTop = this._marginBottom = this._marginLeft = this._marginRight = 0;
    this._paddingTop = this._paddingBottom = this._paddingLeft = this._paddingRight = 0;

    // 边界遍历深度
    this._deep = 1;
},{
    _sizeProvider : qc.Serializer.NUMBER,
    _marginTop : qc.Serializer.NUMBER,
    _marginBottom : qc.Serializer.NUMBER,
    _marginLeft : qc.Serializer.NUMBER,
    _marginRight : qc.Serializer.NUMBER,
    _paddingTop : qc.Serializer.NUMBER,
    _paddingBottom : qc.Serializer.NUMBER,
    _paddingLeft : qc.Serializer.NUMBER,
    _paddingRight : qc.Serializer.NUMBER,
    _autoCalcBounds : qc.Serializer.BOOLEAN
});

// 菜单上的隐藏
Bounds.__hiddenInMenu = true;

Object.defineProperties(Bounds.prototype,{
    /**
     * @property {Number} sizeProvider - 尺寸提供方式
     */
    sizeProvider : {
        get : function() { return this._sizeProvider; },
        set : function(value) {
            if (this._sizeProvider === value) {
                return;
            }
            this._sizeProvider = value;
            this.getBounds(true);
        }
    },

    /**
     * @property {Number} marginTop - 相对父控件上边的边距
     */
    marginTop : {
        get : function() { return this._marginTop; },
        set : function(value) {
            this.setMargin(value);
        }
    },

    /**
     * @property {Number} marginBottom - 相对父控件下边的边距
     */
    marginBottom : {
        get : function() { return this._marginBottom; },
        set : function(value) {
            this.setMargin(null, null, value);
        }
    },

    /**
     * @property {Number} marginLeft - 相对父控件左边的边距
     */
    marginLeft : {
        get : function() { return this._marginLeft; },
        set : function(value) {
            this.setMargin(null, null, null, value);
        }
    },

    /**
     * @property {Number} marginRight - 相对父控件右边的边距
     */
    marginRight : {
        get : function() { return this._marginRight; },
        set : function(value) {
            this.setMargin(null, value);
        }
    },

    /**
     * @property {Number} paddingTop - 相对子控件上边的边距
     */
    paddingTop : {
        get : function() { return this._paddingTop; },
        set : function(value) {
            this.setPadding(value);
        }
    },

    /**
     * @property {Number} paddingBottom - 相对子控件下边的边距
     */
    paddingBottom : {
        get : function() { return this._paddingBottom; },
        set : function(value) {
            this.setPadding(null, null, value);
        }
    },

    /**
     * @property {Number} paddingLeft - 相对子控件左边的边距
     */
    paddingLeft : {
        get : function() { return this._paddingLeft; },
        set : function(value) {
            this.setPadding(null, null, null, value);
        }
    },

    /**
     * @property {Number} paddingRight - 相对子控件右边的边距
     */
    paddingRight : {
        get : function() { return this._paddingRight; },
        set : function(value) {
            this.setPadding(null, value);
        }
    },

    autoCalcBounds : {
        get : function() { return this._autoCalcBounds; },
        set : function(value) {
            this._autoCalcBounds = value;
        }
    }
});

/**
 * 设置内边距
 * @param top
 * @param right
 * @param bottom
 * @param left
 */
Bounds.prototype.setPadding = function(top, right, bottom, left) {
    typeof top !== 'undefined' && top !== null && (this._paddingTop = top);
    typeof right !== 'undefined' && right !== null && (this._paddingRight = right);
    typeof bottom !== 'undefined' && bottom !== null && (this._paddingBottom = bottom);
    typeof left !== 'undefined' && left !== null && (this._paddingLeft = left);
    this._lastWrapTime = null;
    if (this.relayout) {
        this.relayout();
    }
    this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
};

/**
 * 设置外边距
 * @param top
 * @param right
 * @param bottom
 * @param left
 */
Bounds.prototype.setMargin = function(top, right, bottom, left) {
    typeof top !== 'undefined' && top !== null && (this._marginTop = top);
    typeof right !== 'undefined' && right !== null && (this._marginRight = right);
    typeof bottom !== 'undefined' && bottom !== null && (this._marginBottom = bottom);
    typeof left !== 'undefined' && left !== null && (this._marginLeft = left);
    this._lastWrapTime = null;
    if (this.relayout) {
        this.relayout();
    }
    this.gameObject && this.gameObject._dispatchLayoutArgumentChanged('layout');
};

/**
 * 重新计算边界
 */
Bounds.prototype.calcBounds = function() {
    this.getBounds(true);
};

/**
 * 得到边界
 * @param force {boolean} - 是否强制重算
 */
Bounds.prototype.getBounds = function(force) {
    var rect = this._recordBounds || new qc.Rectangle(0, 0, 0, 0);
    if (!this.enable || !this.gameObject || !this.gameObject.isWorldVisible()) {
        return rect;
    }
    if (this._recordBounds && !force &&
        (!this.autoCalcBounds || this._lastWrapTime === this.gameObject.game.time.fixedTime)) {
        return this._recordBounds;
    }
    this._lastWrapTime = this.gameObject.game.time.fixedTime;
    var minPos = new qc.Point(0, 0);
    var maxPos = new qc.Point(0, 0);
    Bounds._calcBounds(minPos, maxPos, this.sizeProvider, this.gameObject, this._deep);
    rect.x = minPos.x;
    rect.y = minPos.y;
    rect.width = maxPos.x - minPos.x;
    rect.height = maxPos.y - minPos.y;
    this._recordBounds = rect;
    return rect;
};

/**
 * 得到边界在世界坐标系中的四个顶点
 * @param force {boolean} - 是否强制重算
 */
Bounds.prototype.getWorldCorners = function(force) {
    var rect = this.getBounds(force);
    var leftTop = new qc.Point(rect.x, rect.y);
    var rightTop = new qc.Point(rect.x + rect.width, rect.y);
    var rightBottom = new qc.Point(rect.x + rect.width, rect.y + rect.height);
    var leftBottom = new qc.Point(rect.x, rect.y + rect.height);

    var worldTransform = this.gameObject.worldTransform;

    return [worldTransform.apply(leftTop),
        worldTransform.apply(rightTop),
        worldTransform.apply(rightBottom),
        worldTransform.apply(leftBottom)];
};

/**
 * 计算节点的区间
 * @param outMin {qc.Point} - 输入已有的最小值，并返回
 * @param outMax {qc.Point} - 输入已有的最大值，并返回
 * @param sizeProvider {number} - 尺寸提供类型
 * @param node {qc.Node} - 节点
 * @param deep {Number} - 当前还需计算的深度，为0时，不计算node节点的子节点
 * @private
 */
Bounds._calcBounds = function(outMin, outMax, sizeProvider, node, deep) {
    var nodeBoundsScript = node.getScript('qc.Bounds');
    sizeProvider = nodeBoundsScript && nodeBoundsScript.enable ? nodeBoundsScript.sizeProvider : sizeProvider;
    if (sizeProvider === Bounds.USE_BOUNDS) {
        this._calcRealBounds(outMin, outMax, node, deep);
    }
    else {
        this._calcRectBounds(outMin, outMax, node, deep);
    }
};

/**
 * 计算节点的RectTransform区间
 * @param outMin {qc.Point} - 输入已有的最小值，并返回
 * @param outMax {qc.Point} - 输入已有的最大值，并返回
 * @param node {qc.Node} - 节点
 * @param deep {Number} - 当前还需计算的深度，为0时，不计算node节点的子节点
 * @private
 */
Bounds._calcRectBounds = function(outMin, outMax, node, deep) {
    var nodeBoundsScript = node.getScript('qc.Bounds');
    // 计算自己的边界
    var rect = node.rect;
    var minX = rect.x, minY = rect.y, maxX = rect.x + rect.width, maxY = rect.y + rect.height;


    // 计算子节点的边界
    if (deep !== 0) {
        var children = node.children;
        var len = children.length;
        while (len--) {
            var child = children[len];
            if (!child.isWorldVisible()) {
                continue;
            }
            // 如果当前层级不是0，则继续向下计算
            var childBoundsScript = child.getScript('qc.Bounds');
            var minPos = new qc.Point(0, 0);
            var maxPos = new qc.Point(0, 0);
            if (childBoundsScript) {
                var childBounds = childBoundsScript.getBounds();
                minPos.x = childBounds.x;
                minPos.y = childBounds.y;
                maxPos.x = childBounds.x + childBounds.width;
                maxPos.y = childBounds.y + childBounds.height;
            }
            else {
                // 计算子节点边界信息
                Bounds._calcRectBounds(minPos, maxPos, child, deep - 1);
            }
            if (nodeBoundsScript && nodeBoundsScript.enable) {
                // 为子节点加上内边距
                minPos.x -= nodeBoundsScript.paddingLeft;
                minPos.y -= nodeBoundsScript.paddingTop;
                maxPos.x += nodeBoundsScript.paddingRight;
                maxPos.y += nodeBoundsScript.paddingBottom;
            }

            // 调整节点边界
            minX = Math.min(minX, minPos.x);
            minY = Math.min(minY, minPos.y);
            maxX = Math.max(maxX, maxPos.x);
            maxY = Math.max(maxY, maxPos.y);
        }
    }

    if (nodeBoundsScript && nodeBoundsScript.enable) {
        // 加上外边距
        minX -= nodeBoundsScript.marginLeft;
        minY -= nodeBoundsScript.marginTop;
        maxX += nodeBoundsScript.marginRight;
        maxY += nodeBoundsScript.marginBottom;
    }
    // 更新输出边界
    outMin.x = Math.min(outMin.x, minX);
    outMin.y = Math.min(outMin.y, minY);
    outMax.x = Math.max(outMax.x, maxX);
    outMax.y = Math.max(outMax.y, maxY);
};

/**
 * 计算节点的包围区间
 * @param outMin {qc.Point} - 输入已有的最小值，并返回
 * @param outMax {qc.Point} - 输入已有的最大值，并返回
 * @param node {qc.Node} - 节点
 * @param deep {Number} - 当前还需计算的深度，为0时，不计算node节点的子节点
 * @private
 */
Bounds._calcRealBounds = function(outMin, outMax, node, deep) {
    var nodeBoundsScript = node.getScript('qc.Bounds');
    // 计算自己的边界
    var rect = node.rect;
    var minX = rect.x, minY = rect.y, maxX = rect.x + rect.width, maxY = rect.y + rect.height;

    // 计算子节点的边界
    if (deep !== 0) {
        var nodeTransform = node.worldTransform;
        var children = node.children;
        var len = children.length;
        while (len--) {
            var child = children[len];
            if (!child.isWorldVisible()) {
                continue;
            }
            // 如果当前层级不是0，则继续向下计算
            var childBoundsScript = child.getScript('qc.Bounds');
            var minPos = new qc.Point(0, 0);
            var maxPos = new qc.Point(0, 0);
            if (childBoundsScript) {
                var childBounds = childBoundsScript.getBounds();
                minPos.x = childBounds.x;
                minPos.y = childBounds.y;
                maxPos.x = childBounds.x + childBounds.width;
                maxPos.y = childBounds.y + childBounds.height;
            }
            else {
                // 计算子节点边界信息
                Bounds._calcRealBounds(minPos, maxPos, child, deep - 1);
            }
            var leftTop = new qc.Point(minPos.x, minPos.y);
            var rightTop = new qc.Point(maxPos.x, minPos.y);
            var rightBottom = new qc.Point(maxPos.x, maxPos.y);
            var leftBottom = new qc.Point(minPos.x, maxPos.y);
            var childTransform = child.worldTransform;
            leftTop = nodeTransform.applyInverse(childTransform.apply(leftTop));
            rightTop = nodeTransform.applyInverse(childTransform.apply(rightTop));
            rightBottom = nodeTransform.applyInverse(childTransform.apply(rightBottom));
            leftBottom = nodeTransform.applyInverse(childTransform.apply(leftBottom));

            var childMinX = Math.min(leftTop.x, rightTop.x, rightBottom.x, leftBottom.x);
            var childMinY = Math.min(leftTop.y, rightTop.y, rightBottom.y, leftBottom.y);
            var childMaxX = Math.max(leftTop.x, rightTop.x, rightBottom.x, leftBottom.x);
            var childMaxY = Math.max(leftTop.y, rightTop.y, rightBottom.y, leftBottom.y);

            if (nodeBoundsScript && nodeBoundsScript.enable) {
                // 为子节点加上内边距
                childMinX -= nodeBoundsScript.paddingLeft;
                childMinY -= nodeBoundsScript.paddingTop;
                childMaxX += nodeBoundsScript.paddingRight;
                childMaxY += nodeBoundsScript.paddingBottom;
            }

            // 调整节点边界
            minX = Math.min(minX, childMinX);
            minY = Math.min(minY, childMinY);
            maxX = Math.max(maxX, childMaxX);
            maxY = Math.max(maxY, childMaxY);
        }
    }

    if (nodeBoundsScript && nodeBoundsScript.enable) {
        // 加上外边距
        minX -= nodeBoundsScript.marginLeft;
        minY -= nodeBoundsScript.marginTop;
        maxX += nodeBoundsScript.marginRight;
        maxY += nodeBoundsScript.marginBottom;
    }
    // 更新输出边界
    outMin.x = Math.min(outMin.x, minX);
    outMin.y = Math.min(outMin.y, minY);
    outMax.x = Math.max(outMax.x, maxX);
    outMax.y = Math.max(outMax.y, maxY);
};

/**
 * 获取一个节点在自身坐标系下，指定深度内的边界信息
 * @param node {qc.Node} - 节点
 * @param sizeProvider {Number} - 尺寸提供类型
 * @param force {boolean} - 是否强制重算，默认不强制
 * @param deep {Number} - 遍历深度，默认为0，只计算自己本节点大小
 */
Bounds.getBounds = function(node, sizeProvider, force, deep) {
    deep = (typeof deep === 'undefined' || deep === null) ? 0 : deep;
    var nodeBoundsScript = node.getScript('qc.Bounds');
    if (nodeBoundsScript && nodeBoundsScript.enable) {
        return nodeBoundsScript.getBounds(force);
    }
    var minPos = new qc.Point(0, 0);
    var maxPos = new qc.Point(0, 0);
    Bounds._calcBounds(minPos, maxPos, sizeProvider, node, deep);
    var rect = new qc.Rectangle(0, 0, 0, 0);
    rect.x = minPos.x;
    rect.y = minPos.y;
    rect.width = maxPos.x - minPos.x;
    rect.height = maxPos.y - minPos.y;
    return rect;
};

/**
 * 获取一个节点下指定深度内边界顶点在指定对象坐标系信息
 * @param node {qc.Node} - 节点
 * @param force {boolean} - 是否强制重算，默认不强制
 * @param deep {Number} - 遍历深度，默认为0，只计算自己本节点大小
 * @param target {qc.Node} - 目标坐标系
 */
Bounds.getCorners = function(node, sizeProvider, force, deep, target) {
    var rect = Bounds.getBounds(node, sizeProvider, force, deep);
    var worldTransform = node.worldTransform;
    var targetTransform = target && target.worldTransform;
    if (sizeProvider === Bounds.USE_RECTTRANSFORM) {
        var root = Bounds.findCommonRoot(node, target || node.game.world);
        var offX = 0;
        var offY = 0;
        var tmp = node;
        while (tmp && tmp !== node.game.world && tmp !== root) {
            offX += tmp.x;
            offY += tmp.y;
            tmp = tmp.parent;
        }
        tmp = target;
        while (tmp && tmp !== node.game.world && tmp !== root) {
            offX -= tmp.x;
            offY -= tmp.y;
        }
        var leftTop = new qc.Point(rect.x + offX, rect.y + offY);
        var rightTop = new qc.Point(rect.x + rect.width + offX, rect.y + offY);
        var rightBottom = new qc.Point(rect.x + rect.width + offX, rect.y + rect.height + offY);
        var leftBottom = new qc.Point(rect.x + offX, rect.y + rect.height + offY);
        return [leftTop, rightTop, rightBottom, leftBottom];
    }
    else {
        var leftTop = new qc.Point(rect.x, rect.y);
        var rightTop = new qc.Point(rect.x + rect.width, rect.y);
        var rightBottom = new qc.Point(rect.x + rect.width, rect.y + rect.height);
        var leftBottom = new qc.Point(rect.x, rect.y + rect.height);
        return (!targetTransform) ?
            [worldTransform.apply(leftTop), worldTransform.apply(rightTop),
                worldTransform.apply(rightBottom), worldTransform.apply(leftBottom)] :
            [targetTransform.applyInverse(worldTransform.apply(leftTop)),
                targetTransform.applyInverse(worldTransform.apply(rightTop)),
                targetTransform.applyInverse(worldTransform.apply(rightBottom)),
                targetTransform.applyInverse(worldTransform.apply(leftBottom))];
    }
};

/**
 * 获取一个节点指定深度内的边界，在指定对象坐标系中的包围盒信息
 * @param node {qc.Node} - 节点
 * @param force {boolean} - 是否强制重算，默认不强制
 * @param deep {Number} - 遍历深度，默认为0，只计算自己本节点大小
 * @param target {qc.Node} - 目标坐标系
 */
Bounds.getBox = function(node, sizeProvider, force, deep, target) {
    var corners = Bounds.getCorners(node, sizeProvider, force, deep, target);
    var maxPos = new qc.Point(-Number.MAX_VALUE, -Number.MAX_VALUE);
    var minPos = new qc.Point(Number.MAX_VALUE, Number.MAX_VALUE);
    for (var i = 0; i < 4; i++) {
        var one = corners[i];
        maxPos.x = Math.max(maxPos.x, one.x);
        maxPos.y = Math.max(maxPos.y, one.y);
        minPos.x = Math.min(minPos.x, one.x);
        minPos.y = Math.min(minPos.y, one.y);
    }
    return new qc.Rectangle(minPos.x, minPos.y, maxPos.x - minPos.x, maxPos.y - minPos.y);
};

/**
 * 获取内容区域大小
 * @param node {qc.Node}
 */
Bounds.getContentRect = function(node) {
    var rect = node.rect;
    var nodeBoundsScript = node.getScript('qc.Bounds');
    if (nodeBoundsScript && nodeBoundsScript.enable) {
        rect.x += nodeBoundsScript.paddingLeft;
        rect.y += nodeBoundsScript.paddingTop;
        rect.width -= nodeBoundsScript.paddingLeft + nodeBoundsScript.paddingRight;
        rect.height -= nodeBoundsScript.paddingTop + nodeBoundsScript.paddingBottom;
    }
    return rect;
};

/**
 * 获取外边距
 * @return {{}}}
 */
Bounds.getMargin = function(node) {
    var script = node.getScript('qc.Bounds');
    if (script && script.enable) {
        return {
            top: script._marginTop,
            bottom: script._marginBottom,
            left: script._marginLeft,
            right:script._marginRight
        };
    }
    else {
        return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };
    }
};

/**
 * 查找两个节点的共同的节点
 * @param one {qc.Node} - 节点
 * @param two {qc.Node} - 节点
 */
Bounds.findCommonRoot = function(one, two) {
    if (!one || !two) {
        return null;
    }
    var t1 = one;
    var t2 = two;
    while (t1) {
        t2 = two;
        while (t2) {
            if (t1 === t2) {
                return t1;
            }
            t2 = t2.parent;
        }
        t1 = t1.parent;
    }
    return null;
};

/**
 * 使用实际显示范围作为边框
 * @constant
 * @type {number}
 */
Bounds.USE_BOUNDS = 0;
/**
 * 使用 rectTransform 作为边框
 * @constant
 * @type {number}
 */
Bounds.USE_RECTTRANSFORM = 1;