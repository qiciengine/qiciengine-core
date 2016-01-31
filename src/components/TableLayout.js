/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 表格布局器，元素加入规则为，将所有元素按子节点顺序
 * @class qc.TableLayout
 */
var TableLayout = defineBehaviour('qc.TableLayout', qc.Bounds, function() {
    /**
     * @property [[[{}]]] _cellStyle - 每个单元格样式信息，单元格信息从(1,1)开始存储
     * @private
     */
    this._cellStyle = [[this._buildCellInfo()]];
    /**
     * @property {number} _constraint - 表格限制
     * @private
     */
    this._constraint = TableLayout.CONSTRAINT_FLEXIBLE;

    // 在编辑器模式下需要运行
    this.runInEditor = true;

    // 默认单元格的对其方式
    this.cellAlignment = TableLayout.ALIGN_TOP_LEFT;


    this.gameObject.onChildrenChanged.add(this._doChildrenChanged, this);
    this.gameObject.onLayoutArgumentChanged.add(this._doLayoutArgumentChanged, this);
},{
    constraint : qc.Serializer.NUMBER,
    stride : qc.Serializer.NUMBER,
    startCorner : qc.Serializer.NUMBER,
    startAxis : qc.Serializer.NUMBER,
    contentSizeProvider : qc.Serializer.NUMBER,
    style : qc.Serializer.NUMBER,
    _cellStyle : qc.Serializer.MAPPING,
    autoUpdate : qc.Serializer.BOOLEAN,
    contentAlignment : qc.Serializer.NUMBER,
    cellAlignment : qc.Serializer.NUMBER,
    spacingX : qc.Serializer.NUMBER,
    spacingY : qc.Serializer.NUMBER,
    ignoreX : qc.Serializer.BOOLEAN,
    ignoreY : qc.Serializer.BOOLEAN
});

// 菜单上的显示
TableLayout.__menu = 'UI/Layout/TableLayout';

TableLayout._precision = 0.0000001;

Object.defineProperties(TableLayout.prototype, {
    constraint : {
        get : function() { return isNaN(this._constraint) ? TableLayout.CONSTRAINT_FLEXIBLE : this._constraint; },
        set : function(value) {
            if (this._constraint === value) {
                return;
            }
            this._constraint = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {Number} stride - 步幅，开始方向为水平方向时，为列数，开始方向为垂直方向时，为行数
     */
    stride : {
        get : function() { return isNaN(this._stride) ? 0 : this._stride; },
        set : function(value) {
            if (value === this._stride) {
                return;
            }
            this._stride = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {number} startCorner - 布局开始的角，默认从左上开始
     */
    startCorner : {
        get : function() { return this._startCorner || TableLayout.CORNER_TOP_LEFT; },
        set : function(value) {
            if (value === this._startCorner) {
                return;
            }
            this._startCorner = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {number} startAxis - 布局开始添加的轴，默认优先填充水平方向
     */
    startAxis : {
        get : function() { return this._startAxis || TableLayout.AXIS_HORIZONTAL; },
        set : function(value) {
            if (value === this._startAxis) {
                return;
            }
            this._startAxis = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {Number} contentSizeProvider - 默认使用的内容尺寸提供器，如果节点上有附加相关脚本则使用节点设置
     */
    contentSizeProvider : {
        get : function() { return this._contentSizeProvider || TableLayout.USE_BOUNDS; },
        set : function(value) {
            if (value === this._contentSizeProvider) {
                return;
            }
            this._contentSizeProvider = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {number} style - 当前布局器的样式，是保持子节点大小还是以本节点 RectTransform 对子节点进行调整，默认保持子节点尺寸
     */
    style : {
        get : function() { return this._style || TableLayout.STYLE_WRAP_ELEMENT; },
        set : function(value) {
            if (value === this._style) {
                return;
            }
            this._style = value;
            this.rebuildTable();
        }
    },

    /**
     * @prototype {boolean} autoUpdate - 是否每帧自动重排
     */
    autoUpdate : {
        get : function() { return this._autoUpdate; },
        set : function(value) {
            this._autoUpdate = value;
        }
    },

    /**
     * @property {number} spacingX - 设置单元格的水平间距
     */
    spacingX : {
        get : function() {
            return this._spacingX || 0;
        },
        set : function(value) {
            if (this._spacingX === value) {
                return;
            }
            this._spacingX = value;
            this.rebuildTable();
        }
    },

    /**
     * @property {number} spacingY - 设置单元格的垂直间距
     */
    spacingY : {
        get : function() {
            return this._spacingY || 0;
        },
        set : function(value) {
            if (this._spacingY === value) {
                return;
            }
            this._spacingY = value;
            this.rebuildTable();
        }
    },
    /**
     * @property {number} cellWidth - 设置单元格的宽度
     */
    cellWidth : {
        get : function() {
            return this.getCellStyle(null, null).cellWidth;
        },
        set : function(value) {
            this.setCellStyle(null, null, null, null, null, null, null, value);
        }
    },

    /**
     * @property {number} cellHeight - 设置单元格的高度
     */
    cellHeight : {
        get : function() {
            return this.getCellStyle(null, null).cellHeight;
        },
        set : function(value) {
            this.setCellStyle(null, null, null, null, null, null, null, null, value);
        }
    },

    /**
     * @property {number} contentAlignment - 设置内容在容器中的对齐方式，仅在style === TableLayout.STYLE_RESIZE_ELEMENT时生效
     */
    contentAlignment : {
        get : function() {
            return this._contentAlignment || TableLayout.ALIGN_TOP_LEFT;
        },
        set : function(value) {
            if (this._contentAlignment === value) {
                return;
            }
            this._contentAlignment = value;
            this.rebuildTable();
        }
    },

    /**
     * @property {number} cellAlignment - 设置单元格的内容在容器中的对齐方式
     */
    cellAlignment : {
        get : function() {
            return this.getCellStyle(null, null).align;
        },
        set : function(value) {
            if (this.cellAlignment === value) {
                return;
            }
            this.setCellStyle(null, null, value);
            this.rebuildTable();
        }
    },

    /**
     * @property {number} columnCount - 当前列数
     */
    columnsCount : {
        get : function() {
            var size = this._calcColumnRow();
            return size.x;
        }
    },

    /**
     * @property {number} rowsCount - 当前列数
     * @readonly
     */
    rowsCount : {
        get : function() {
            var size = this._calcColumnRow();
            return size.y;
        }
    },
    /**
     * @property {boolean} ignoreX - 是否不调整 x 坐标
     */
    ignoreX : {
        get : function() { return !!this._ignoreX; },
        set : function(value) {
            if (this._ignoreX === value) return;
            this._ignoreX = value;
        }
    },
    /**
     * @property {boolean} ignoreY - 是否不调整 y 坐标
     */
    ignoreY : {
        get : function() { return !!this._ignoreY; },
        set : function(value) {
            if (this._ignoreY === value) return;
            this._ignoreY = value;
        }
    }
});

/**
 * postUpdate
 */
TableLayout.prototype.postUpdate = function() {
    // 启用状态下更新mask
    if (this.enable && (this.autoUpdate || this._needRebuildTable)) {
        this.rebuildTable();
        this._needRebuildTable = false;
    }
};

/**
 * 获取所有参与布局的子节点数量
 * @private
 */
TableLayout.prototype._getChildrenCount = function() {
    var len = 0;
    var realChildren = this.gameObject.children;
    for (var idx = 0; idx < realChildren.length; ++idx) {
        if (realChildren[idx] && realChildren[idx].isWorldVisible()) {
            len++;
        }
    }
    return len;
};

/**
 * 获取所有参与布局的子节点
 * @private
 */
TableLayout.prototype._getChildren = function() {
    var children = [];
    var realChildren = this.gameObject.children;
    for (var idx = 0; idx < realChildren.length; ++idx) {
        if (realChildren[idx] && realChildren[idx].isWorldVisible()) {
            children.push(realChildren[idx]);
        }
    }
    return children;
};

/**
 * 按规则吸收样式
 * @param base {{}} - 基础样式
 * @param append {{}} - 要吸收的样式
 * @private
 */
TableLayout.prototype._mixinStyle = function(base, append) {
    return {
        align : ((append.align & 0xF0) === 0 ? (base.align & 0xF0) : (append.align & 0xF0)) |
        ((append.align & 0x0F) === 0 ? (base.align & 0x0F) : (append.align & 0x0F)),
        timestamp : Math.max(append.timestamp, base.timestamp),
        paddingLeft : isNaN(append.paddingLeft) ? base.paddingLeft : append.paddingLeft,
        paddingRight : isNaN(append.paddingRight) ? base.paddingRight : append.paddingRight,
        paddingTop : isNaN(append.paddingTop) ? base.paddingTop : append.paddingTop,
        paddingBottom : isNaN(append.paddingBottom) ? base.paddingBottom : append.paddingBottom,
        cellWidth : isNaN(append.cellWidth) ? base.cellWidth : append.cellWidth,
        cellHeight : isNaN(append.cellHeight) ? base.cellHeight : append.cellHeight
    }
};

/**
 * 计算一个节点在父节点下的 RectTransform
 * @param node {qc.Node} - 节点
 * @param deep {number} - 遍历的深度，默认只计算节点本身
 */
TableLayout._calcRectTransform = function(node, deep) {
    deep = isNaN(deep) ? 0 : deep;
    var rect = node.rect;
    if (deep !== 0) {
        return rect;
    }
    var children = node.children;
    var len = children.length;
    while (len--) {
        var childRect = TableLayout._calcRectTransform(children[len], deep - 1);
        rect.x = Math.min(rect.x, childRect.x);
        rect.y = Math.min(rect.y, childRect.y);
        rect.w = Math.max(rect.x + rect.width, childRect.x + childRect.width) - rect.x;
        rect.h = Math.max(rect.y + rect.height, childRect.y + childRect.height) - rect.y;
    }
    return rect;
};

/**
 * 获取表格单元格的包围大小，对于已经设置了尺寸提供器的节点使用节点设置，否则使用表格的优先设置
 * @param node {qc.Node} - 需要计算的节点
 * @param style {{}} - 节点的样式
 */
TableLayout.prototype.getCellRect = function(node, force) {
    return qc.Bounds.getBox(node, this.contentSizeProvider, force, 0, this.gameObject);
};

/**
 * 得到一个单元格的样式，返回的为拷贝，无法直接进行设置，如果需要设置，请使用setCellStyle接口
 * 当获取样式时，对于每个细节参数（水平对齐方式，垂直对齐方式，上、右、下、左边距）优先返回本单元格设置的样式，如果没有单独设置，则返回行或者列中较晚设置的样式，
 * 如果行列也没有，则返回全局设置
 * @param column {Number | null} - 要返回的单元格的列，如果为 null，则表示返回指定行的样式，如果为 null 且row === null,则返回全局样式
 * @param row {Number | null} - 要返回的单元格的行，如果为 null，则表示返回指定列的样式，如果为 null 且column === null,则返回全局样式
 * @returns {{align: （Number}, timestamp: (number), paddingLeft: (number), paddingRight: (number), paddingTop: (number), paddingBottom: (number)}}
 */
TableLayout.prototype.getCellStyle = function(column, row) {
    // 每行，每列的第0个用来记录通用属性，所以要将列和行的数值+1
    column = (column == null) ? 0 : column + 1;
    row = (row == null) ? 0 : row + 1;
    var baseStyle = this._cellStyle[0][0];
    // 确定行样式
    var rowStyle = this._cellStyle[row] && this._cellStyle[row][0];
    // 确认列样式
    var colStyle = this._cellStyle[0][column];

    if (!colStyle || (rowStyle && rowStyle.timestamp > colStyle.timestamp)) {
        colStyle && (baseStyle = this._mixinStyle(baseStyle, colStyle));
        rowStyle && (baseStyle = this._mixinStyle(baseStyle, rowStyle));
    }
    else {
        rowStyle && (baseStyle = this._mixinStyle(baseStyle, rowStyle));
        colStyle && (baseStyle = this._mixinStyle(baseStyle, colStyle));
    }

    var cellStyle = this._cellStyle[row] && this._cellStyle[row][column];
    cellStyle && (baseStyle = this._mixinStyle(baseStyle, cellStyle));
    baseStyle.paddingTop = isNaN(baseStyle.paddingTop) ? 0 : baseStyle.paddingTop;
    baseStyle.paddingLeft = isNaN(baseStyle.paddingLeft) ? 0 : baseStyle.paddingLeft;
    baseStyle.paddingRight = isNaN(baseStyle.paddingRight) ? 0 : baseStyle.paddingRight;
    baseStyle.paddingBottom = isNaN(baseStyle.paddingBottom) ? 0 : baseStyle.paddingBottom;
    baseStyle.cellWidth = isNaN(baseStyle.cellWidth) ? 0 : baseStyle.cellWidth;
    baseStyle.cellHeight = isNaN(baseStyle.cellHeight) ? 0 : baseStyle.cellHeight;
    return baseStyle;
};

/**
 * 设置一个单元格样式
 * @param column {Number | null} - 要设置的单元格的列，如果为 null，则表示设定指定行的样式，如果为 null 且row === null,则设置全局样式
 * @param row {Number | null} - 要设置的单元格的行，如果为 null，则表示设定指定列的样式，如果为 null 且column === null,则设置全局样式
 * @param align {Number} - 要设置的对齐格式
 * @param paddingTop {Number} - 单元格内边框的上边距
 * @param paddingRight {Number} - 单元格内边框的右边距
 * @param paddingBottom {Number} - 单元格内边框的下边距
 * @param paddingLeft {Number} - 单元格内边框的左边距
 * @param cellWidth {Number} - 单元格的最小宽度
 * @param cellHeight {Number} - 单元格的最小高度
 */
TableLayout.prototype.setCellStyle = function(column, row, align, paddingTop, paddingRight, paddingBottom, paddingLeft, cellWidth, cellHeight) {
    column = (column == null) ? 0 : column + 1;
    row = (row == null) ? 0 : row + 1;
    if (!this._cellStyle[row]) {
        this._cellStyle[row] = [];
    }
    if (!this._cellStyle[row][column])
        this._cellStyle[row][column] = this._buildCellInfo();
    var cell = this._cellStyle[row][column];
    align != null && (cell.align = align);
    paddingTop != null && (cell.paddingTop = paddingTop);
    paddingRight != null && (cell.paddingRight = paddingRight);
    paddingBottom != null && (cell.paddingBottom = paddingBottom);
    paddingLeft != null && (cell.paddingLeft = paddingLeft);
    cellWidth != null && (cell.cellWidth = cellWidth);
    cellHeight != null & (cell.cellHeight = cellHeight);
    this._cellStyle[row][column].timestamp = this.gameObject.game.time.fixedTime;
    this.rebuildTable();
};

/**
 * 清除一个单元格样式
 * @param column {Number | null} - 要清除的单元格的列，如果为 null，则表示清除指定行的样式，如果为 null 且row === null,则清除全局样式
 * @param row {Number | null} - 要清除的单元格的行，如果为 null，则表示清除指定列的样式，如果为 null 且column === null,则清除全局样式
 */
TableLayout.prototype.clearCellStyle = function(column, row) {
    column = (column == null) ? 0 : column + 1;
    row = (row == null) ? 0 : row + 1;
    if (column === 0 && row === 0) {
        this._cellStyle[0][0] = this._buildCellInfo();
        return;
    }
    this._cellStyle[row] && this._cellStyle[row][column] &&
    (this._cellStyle[row][column] = null);
};

/**
 * 创建一个默认的单元格样式
 */
TableLayout.prototype._buildCellInfo = function() {
    return {
        align : 0,
        timestamp : 0,
        paddingLeft : NaN,
        paddingRight : NaN,
        paddingTop : NaN,
        paddingBottom : NaN,
        cellWidth : NaN,
        cellHeight : NaN
    };
};

/**
 * 计算当前的行列信息
 * @private
 */
TableLayout.prototype._calcColumnRow = function() {
    var totalChildren = this._getChildrenCount();
    var stride = this.stride;
    var constraint = this.constraint;
    if (constraint === TableLayout.CONSTRAINT_FLEXIBLE) {
        var style = this.getCellStyle(null, null);
        var rect = qc.Bounds.getContentRect(this.gameObject);
        if (this.startAxis === TableLayout.AXIS_HORIZONTAL) {
            stride = Math.min(Math.max(1, Math.floor((rect.width + this.spacingX) / (style.cellWidth + this.spacingX))), totalChildren);
            constraint = TableLayout.CONSTRAINT_FIX_COLUMN_COUNT;
        }
        else {
            stride = Math.min(Math.max(1, Math.floor((rect.height + this.spacingY) / (style.cellHeight + this.spacingY))), totalChildren);
            constraint = TableLayout.CONSTRAINT_FIX_ROW_COUNT;
        }
    }
    // 计算最后排布的行数和列数，
    var columnCount = constraint === TableLayout.CONSTRAINT_FIX_ROW_COUNT ? Math.ceil(totalChildren / stride) : stride;
    var rowCount = constraint === TableLayout.CONSTRAINT_FIX_ROW_COUNT ? stride : Math.ceil(totalChildren / stride);

    return new qc.Point(columnCount, rowCount);
};

/**
 * 计算子节点在表格中的位置，当不限制行数和列数时无效
 * @param index
 * @param pos
 * @returns {qc.Point}
 * @private
 */
TableLayout.prototype._calcPos = function(index, pos) {
    var size = this._calcColumnRow();

    pos = pos || new qc.Point(0,0);
    if (this.startAxis === TableLayout.AXIS_HORIZONTAL) {
        pos.x = index % size.x;
        pos.y = Math.floor(index / size.x);
    }
    else {
        pos.x = Math.floor(index / size.y);
        pos.y = index % size.y;
    }
    (this.startCorner & 0xF0) !== 0 && (pos.x = size.x - 1 - pos.x);
    (this.startCorner & 0x0F) !== 0 && (pos.y = size.y - 1 - pos.y);
    return pos;
};

/**
 * 调整单元格的位置
 * @param cell {{}} - 单元格信息
 * @param targetBounds {qc.Rectangle} - 目标区域
 * @private
 */
TableLayout.prototype._setCellPosition = function(cell, targetBounds) {
    if (! this.ignoreX || this.columnsCount > 1) {
        var x = cell.node.x;
        if ((cell.style.align & TableLayout.ALIGN_RIGHT) !== 0) {
            x += targetBounds.x - cell.bounds.x + (targetBounds.width - cell.bounds.width);
        }
        else if ((cell.style.align & TableLayout.ALIGN_CENTER) !== 0) {
            x += targetBounds.x - cell.bounds.x + (targetBounds.width - cell.bounds.width) / 2;
        }
        else {
            x += targetBounds.x - cell.bounds.x;
        }
        if (Math.abs(x - cell.node.x) > TableLayout._precision) {
            cell.node.x = x;
        }
    }
    if (!this.ignoreY || this.rowsCount > 1) {
        var y = cell.node.y;
        if ((cell.style.align & TableLayout.ALIGN_BOTTOM) !== 0) {
            y += targetBounds.y - cell.bounds.y + (targetBounds.height - cell.bounds.height);
        }
        else if ((cell.style.align & TableLayout.ALIGN_MIDDLE) !== 0) {
            y += targetBounds.y - cell.bounds.y + (targetBounds.height - cell.bounds.height) / 2;
        }
        else {
            y += targetBounds.y - cell.bounds.y;
        }
        if (Math.abs(y - cell.node.y) > TableLayout._precision) {
            cell.node.y = y;
        }
    }
};

/**
 * 设置节点的显示区域
 * @param cell
 * @param targetBounds
 * @param width
 * @param height
 * @private
 */
TableLayout.prototype._setCellSize = function(cell, width, height) {
    // 首先调整节点大小到指定大小
    if (Math.abs(cell.bounds.width - width) < TableLayout._precision &&
        Math.abs(cell.bounds.height - height) < TableLayout._precision) {
        return;
    }
    var margin = Bounds.getMargin(cell.node);
    var nodeExpectWidth = width - margin.left - margin.right,
        nodeExpectHeight = height - margin.top - margin.bottom,
        boundsWith = cell.bounds.width  - margin.left - margin.right,
        boundsHeight = cell.bounds.height  - margin.top - margin.bottom;
    cell.node.setAnchor(new qc.Point(0, 0), new qc.Point(0, 0), false);
    cell.node.x = 0;
    cell.node.y = 0;
    boundsWith <= 0 ? (cell.node.width = nodeExpectWidth) :
        (cell.node.width *= nodeExpectWidth / boundsWith);
    boundsHeight <=0 ? (cell.node.height = nodeExpectHeight) :
        (cell.node.height *= nodeExpectHeight / boundsHeight);
    cell.node.setStretch(0, 0, 0, 0);
    cell.bounds = this.getCellRect(cell.node, true);
};

/**
 * 重新布局
 */
TableLayout.prototype.relayout = function() {
    this.rebuildTable();
};

/**
 * 调整表格
 */
TableLayout.prototype.rebuildTable = function() {
    var style = this.getCellStyle(null, null);
    if (this.style === TableLayout.STYLE_WRAP_ELEMENT) {
        this._rebuildWrapTable();
    }
    else {
        this._rebuildResizeTable();
    }
};

/**
 * 获取在某一轴线上的默认布局系数
 * @private
 */
TableLayout.prototype._getDefaultLayout = function(axis){
    return {min : 0,
        preferred : 0,
        flexible : 0,
        extra : 0};
};

/**
 * 获取节点的布局系数
 * @param node
 * @private
 */
TableLayout.prototype.getCellLayout = function(node) {
    return qc.LayoutElement.getLayoutElement(node);
};

/**
 * 调整动态模式
 * @private
 */
TableLayout.prototype._rebuildResizeTable = function() {
    var children = this._getChildren();
    var cellSize = [];
    var columnsWidth = [];
    var rowsHeight = [];
    var widthArgs = [];
    var heightArgs = [];
    var len = children.length;
    var pos = new qc.Point(0, 0);

    // 收集信息，取每行每列的信息进行整合
    var idx = -1;
    while (++idx < len) {
        this._calcPos(idx, pos);
        var layout = this.getCellLayout(children[idx]);
        var style = this.getCellStyle(pos.x, pos.y);
        var box = this.getCellRect(children[idx]);
        (cellSize[pos.y] || (cellSize[pos.y] = []))[pos.x] = {
            node : children[idx],
            layout : layout,
            bounds : box,
            style : style
        };
        var widthInfo = widthArgs[pos.x] || (widthArgs[pos.x] = this._getDefaultLayout('x'));
        var heightInfo = heightArgs[pos.y] || (heightArgs[pos.y] = this._getDefaultLayout('y'));
        // 调整首选尺寸
        layout.preferredWidth < 0 && children[idx].nativeSize && (layout.preferredWidth = children[idx].nativeSize.width);
        layout.preferredHeight < 0 && children[idx].nativeSize && (layout.preferredHeight = children[idx].nativeSize.height);

        if (!isNaN(style.cellWidth) && style.cellWidth > 0) {
            layout.minWidth = style.cellWidth;
            layout.preferredWidth = style.cellWidth;
        }
        if (!isNaN(style.cellHeight) && style.cellHeight > 0) {
            layout.minHeight = style.cellHeight;
            layout.preferredHeight = style.cellHeight;
        }

        layout.minWidth >= 0 && (widthInfo.min = Math.max(widthInfo.min, layout.minWidth));
        layout.minHeight >= 0 && (heightInfo.min = Math.max(heightInfo.min, layout.minHeight));

        widthInfo.preferred = Math.max(widthInfo.preferred, layout.preferredWidth, widthInfo.min);
        heightInfo.preferred = Math.max(heightInfo.preferred, layout.preferredHeight, widthInfo.min);

        layout.flexibleWidth >= 0 && (widthInfo.flexible = Math.max(widthInfo.flexible, layout.flexibleWidth));
        layout.flexibleHeight >= 0 && (heightInfo.flexible = Math.max(heightInfo.flexible, layout.flexibleHeight));

        widthInfo.extra = Math.max(widthInfo.extra, style.paddingLeft + style.paddingRight);
        heightInfo.extra = Math.max(heightInfo.extra, style.paddingTop + style.paddingBottom);
    }

    // 计算全局信息
    var totalWidthInfo = {
        min : 0,
        preferred : 0,
        flexible : 0,
        extra : 0,
        fixed : 0
    };
    var totalHeightInfo = {
        min : 0,
        preferred : 0,
        flexible : 0,
        extra : 0,
        fixed : 0
    };
    widthArgs.forEach(function(v){
        totalWidthInfo.min += v.min;
        totalWidthInfo.preferred += v.preferred;
        totalWidthInfo.flexible += v.flexible;
        totalWidthInfo.extra += v.extra;
    });
    heightArgs.forEach(function(v){
        totalHeightInfo.min += v.min;
        totalHeightInfo.preferred += v.preferred;
        totalHeightInfo.flexible += v.flexible;
        totalHeightInfo.extra += v.extra;
    });
    // 开始计算各个格子的大小
    var rect = qc.Bounds.getContentRect(this.gameObject);
    var totalSpacingX = Math.max(0, widthArgs.length - 1) * this.spacingX;
    var totalSpacingY = Math.max(0, heightArgs.length - 1) * this.spacingY;
    var offset = new qc.Point(0, 0);

    // 水平分布
    if (rect.width <= totalWidthInfo.min + totalWidthInfo.extra + totalSpacingX) {
        // 可用区域小于需要的最小值，按最小值分配
        for (var i = 0; i < widthArgs.length; ++i) {
            if (!widthArgs[i]) {
                columnsWidth[i] = 0;
                continue;
            }
            columnsWidth[i] = widthArgs[i].min + widthArgs[i].extra;
        }
    }
    else if (rect.width <= totalWidthInfo.preferred + totalWidthInfo.extra + totalSpacingX) {
        // 可用区域小于首选需要的值时，将大于min需求的部分按首选值的权重分配
        var divisible = rect.width - totalWidthInfo.extra - totalWidthInfo.min - totalSpacingX;
        for (var i = 0; i < widthArgs.length; ++i) {
            if (!widthArgs[i]) {
                columnsWidth[i] = 0;
                continue;
            }
            columnsWidth[i] = divisible * widthArgs[i].preferred / (totalWidthInfo.preferred || 1) +
            widthArgs[i].min + widthArgs[i].extra;
        }
    }
    else {

        // 如果还有多余的空间，按可变区域权重分配
        var divisible = rect.width - totalWidthInfo.extra - totalWidthInfo.preferred - totalSpacingX;
        for (var i = 0; i < widthArgs.length; ++i) {
            if (!widthArgs[i]) {
                columnsWidth[i] = 0;
                continue;
            }
            columnsWidth[i] = divisible * widthArgs[i].flexible / (totalWidthInfo.flexible || 1) +
            widthArgs[i].preferred + widthArgs[i].extra;
        }
        // 都不可拓展，则需要按对齐方式调整偏移
        if (totalWidthInfo.flexible === 0) {
            if ((this.contentAlignment & TableLayout.ALIGN_RIGHT) !== 0) {
                offset.x = divisible;
            }
            else if ((this.contentAlignment & TableLayout.ALIGN_CENTER) !== 0) {
                offset.x = divisible / 2;
            }
        }
    }

    // 垂直分布
    if (rect.height <= totalHeightInfo.min + totalHeightInfo.extra + totalSpacingY) {
        // 可用区域小于需要的最小值，按最小值分配
        for (var i = 0; i < heightArgs.length; ++i) {
            if (!heightArgs[i]) {
                rowsHeight[i] = 0;
                continue;
            }
            rowsHeight[i] = heightArgs[i].min + heightArgs[i].extra;
        }
    }
    else if (rect.height <= totalHeightInfo.preferred + totalHeightInfo.extra + totalSpacingY) {
        // 可用区域小于首选需要的值时，将大于min需求的部分按首选值的权重分配
        var divisible = rect.height - totalHeightInfo.extra - totalHeightInfo.min - totalSpacingY;
        for (var i = 0; i < heightArgs.length; ++i) {
            if (!heightArgs[i]) {
                rowsHeight[i] = 0;
                continue;
            }
            rowsHeight[i] = divisible * heightArgs[i].preferred / (totalHeightInfo.preferred || 1) +
            heightArgs[i].min + heightArgs[i].extra;
        }
    }
    else {
        // 如果还有多余的空间，按可变区域权重分配
        var divisible = rect.height - totalHeightInfo.extra - totalHeightInfo.preferred - totalSpacingY;
        for (var i = 0; i < heightArgs.length; ++i) {
            if (!heightArgs[i]) {
                rowsHeight[i] = 0;
                continue;
            }
            rowsHeight[i] = divisible * heightArgs[i].flexible / (totalHeightInfo.flexible || 1) +
            heightArgs[i].preferred + heightArgs[i].extra;
        }
        // 都不可拓展，则需要按对齐方式调整偏移
        if (totalHeightInfo.flexible === 0) {
            if ((this.contentAlignment & TableLayout.ALIGN_BOTTOM) !== 0) {
                offset.y = divisible;
            }
            else if ((this.contentAlignment & TableLayout.ALIGN_MIDDLE) !== 0) {
                offset.y = divisible / 2;
            }
        }
    }

    // 进行显示
    var selfBounds = qc.Bounds.getContentRect(this.gameObject);
    var targetBounds = new qc.Rectangle(0, 0, 0, 0);
    var startWidth = 0;
    var startHeight = 0;
    for (var y = 0; y < rowsHeight.length; y++) {
        startWidth = 0;
        for (var x = 0; x < columnsWidth.length; x++ ) {
            var cell = cellSize[y][x];
            if (!cell) {
                startWidth += columnsWidth[x] + this.spacingX;
                continue;
            }
            targetBounds.x = selfBounds.x + startWidth + cell.style.paddingLeft  + offset.x;
            targetBounds.y = selfBounds.y + startHeight + cell.style.paddingTop + offset.y;
            targetBounds.width = columnsWidth[x] - cell.style.paddingLeft - cell.style.paddingRight;
            targetBounds.height = rowsHeight[y] - cell.style.paddingTop - cell.style.paddingBottom;
            var cellWidth = targetBounds.width;
            var cellHeight = targetBounds.height;
            if (cell.layout.flexibleWidth <= 0 && targetBounds.width > cell.layout.preferredWidth && cell.layout.preferredWidth > 0) {
                cellWidth = cell.layout.preferredWidth;
            }
            if (cell.layout.flexibleHeight <= 0 && targetBounds.height > cell.layout.preferredHeight && cell.layout.preferredHeight > 0) {
                cellHeight = cell.layout.preferredHeight;
            }
            this._setCellSize(cell, cellWidth, cellHeight);
            this._setCellPosition(cell, targetBounds);

            startWidth += columnsWidth[x] + this.spacingX;
        }
        startHeight += rowsHeight[y] + this.spacingY;
    }
};

/**
 * 调整固定列或者行的表格
 */
TableLayout.prototype._rebuildWrapTable = function() {
    var children = this._getChildren();
    var cellSize = [];
    var columnsWidth = [];
    var rowsHeight = [];
    var len = children.length;
    var pos = new qc.Point(0, 0);
    while (len--) {
        this._calcPos(len, pos);
        var style = this.getCellStyle(pos.x, pos.y);
        var box = this.getCellRect(children[len]);
        (cellSize[pos.y] || (cellSize[pos.y] = []))[pos.x] = {
            node : children[len],
            bounds : box,
            style : style
        };
        // 自由模式下，以设定的宽高为宽高，否则只是作为最小宽高进行处理
        if (style.cellWidth > 0) {
            columnsWidth[pos.x] = style.cellWidth;
        }
        else {
            columnsWidth[pos.x] = Math.max(box.width + style.paddingLeft + style.paddingRight, columnsWidth[pos.x] || 0, style.cellWidth);
        }
        if (style.cellHeight > 0)
        {
            rowsHeight[pos.y] = style.cellHeight;
        }
        else {
            rowsHeight[pos.y] = Math.max(box.height + style.paddingTop + style.paddingBottom, rowsHeight[pos.y]|| 0, style.cellHeight);
        }
    }

    var totalWidth = 0;
    var totalHeight = 0;
    for (var x = 0; x < columnsWidth.length; x++ ) {
        totalWidth += columnsWidth[x];
    }
    for (var y = 0; y < rowsHeight.length; y++) {
        totalHeight += rowsHeight[y];
    }

    var selfBounds = qc.Bounds.getContentRect(this.gameObject);
    var offset = new qc.Point(0, 0);
    if ((this.contentAlignment & TableLayout.ALIGN_BOTTOM) !== 0) {
        offset.y = selfBounds.height - totalHeight;
    }
    else if ((this.contentAlignment & TableLayout.ALIGN_MIDDLE) !== 0) {
        offset.y = (selfBounds.height - totalHeight) / 2;
    }
    if ((this.contentAlignment & TableLayout.ALIGN_RIGHT) !== 0) {
        offset.x = selfBounds.width - totalWidth;
    }
    else if ((this.contentAlignment & TableLayout.ALIGN_CENTER) !== 0) {
        offset.x = (selfBounds.width - totalWidth) / 2;
    }


    var targetBounds = new qc.Rectangle(0, 0, 0, 0);
    var startWidth = 0;
    var startHeight = 0;
    for (var y = 0; y < rowsHeight.length; y++) {
        startWidth = 0;
        for (var x = 0; x < columnsWidth.length; x++ ) {
            var cell = cellSize[y][x];
            if (!cell) {
                var style = this.getCellStyle(x, y);
                var cellWidth = columnsWidth[x] === undefined ? style.cellWidth : columnsWidth[x];
                startWidth += cellWidth + this.spacingX;
                continue;
            }

            targetBounds.x = selfBounds.x + startWidth + cell.style.paddingLeft + offset.x;
            targetBounds.y = selfBounds.y + startHeight + cell.style.paddingTop + offset.y;
            targetBounds.width = columnsWidth[x] - cell.style.paddingLeft - cell.style.paddingRight;
            targetBounds.height = rowsHeight[y] - cell.style.paddingTop - cell.style.paddingBottom;

            this._setCellPosition(cell, targetBounds);

            startWidth += columnsWidth[x] + this.spacingX;
        }
        startHeight += rowsHeight[y] + this.spacingY;
    }
};

/**
 * 当子节点变化时
 * @private
 */
TableLayout.prototype._doChildrenChanged = function(event) {
    var len = event.children.length;
    if (event.type === 'add') {
        while (len--) {
            if (event.children[len]) {
                event.children[len].onLayoutArgumentChanged.add(this._doLayoutArgumentChanged, this);
            }
        }
    }
    else if (event.type === 'remove') {
        while (len--) {
            if (event.children[len]) {
                event.children[len].onLayoutArgumentChanged.remove(this._doLayoutArgumentChanged, this);
            }
        }
    }
    this._needRebuildTable = true;
};

TableLayout.prototype._doLayoutArgumentChanged = function() {
    this._needRebuildTable = true;
};


/**
 * 不限制行数和列数，根据大小自动进行调整
 * @constant
 * @type {number}
 */
TableLayout.CONSTRAINT_FLEXIBLE = 0;
/**
 * 限制列数
 * @constant
 * @type {number}
 */
TableLayout.CONSTRAINT_FIX_COLUMN_COUNT = 1;
/**
 * 限制行数
 * @constant
 * @type {number}
 */
TableLayout.CONSTRAINT_FIX_ROW_COUNT = 2;

/**
 * 保持子节点尺寸的情况下进行布局，Bounds会随着子节点的变化而变化
 * @constant
 * @type {number}
 */
TableLayout.STYLE_WRAP_ELEMENT = 0;

/**
 * 保持本节点的RectTransform，改变子节点的尺寸进行布局
 * @constant
 * @type {number}
 */
TableLayout.STYLE_RESIZE_ELEMENT = 1;

/**
 * 使用 RectTransform 作为布局尺寸提供者
 * RectTransform不受 Scale，Rotation 参数影响
 * @constant
 * @type {number}
 */
TableLayout.USE_RECTTRANSFORM = qc.LayoutElement.USE_RECTTRANSFORM;

/**
 * 使用Bounds作为布局尺寸提供者
 * Bounds为实现显示节点需要的尺寸
 * @constant
 * @type {number}
 */
TableLayout.USE_BOUNDS = qc.LayoutElement.USE_BOUNDS;

/**
 * 水平方向
 * @constant
 * @type {number}
 */
TableLayout.AXIS_HORIZONTAL = 0;
/**
 * 垂直方向
 * @constant
 * @type {number}
 */
TableLayout.AXIS_VERTICAL = 1;

/**
 * 左上角
 * @constant
 * @type {number}
 */
TableLayout.CORNER_TOP_LEFT = 0x00;
/**
 * 右上角
 * @constant
 * @type {number}
 */
TableLayout.CORNER_TOP_RIGHT = 0x10;
/**
 * 右下角
 * @constant
 * @type {number}
 */
TableLayout.CORNER_BOTTOM_RIGHT = 0x11;

/**
 * 左下角
 * @constant
 * @type {number}
 */
TableLayout.CORNER_BOTTOM_LEFT = 0x01;

/**
 * 水平居左
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_LEFT = 0x01;
/**
 * 水平居中
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_CENTER = 0x02;
/**
 * 水平居右
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_RIGHT = 0x04;
/**
 * 垂直居上
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_TOP = 0x10;
/**
 * 垂直居中
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_MIDDLE = 0x20;
/**
 * 垂直居下
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_BOTTOM = 0x40;

/**
 * 左上
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_TOP_LEFT = TableLayout.ALIGN_TOP | TableLayout.ALIGN_LEFT;
/**
 * 中上
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_TOP_CENTER = TableLayout.ALIGN_TOP | TableLayout.ALIGN_CENTER;
/**
 * 右上
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_TOP_RIGHT = TableLayout.ALIGN_TOP | TableLayout.ALIGN_RIGHT;
/**
 * 左中
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_MIDDLE_LEFT = TableLayout.ALIGN_MIDDLE | TableLayout.ALIGN_LEFT;
/**
 * 中心
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_MIDDLE_CENTER = TableLayout.ALIGN_MIDDLE | TableLayout.ALIGN_CENTER;
/**
 * 右中
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_MIDDLE_RIGHT = TableLayout.ALIGN_MIDDLE | TableLayout.ALIGN_RIGHT;
/**
 * 左下
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_BOTTOM_LEFT = TableLayout.ALIGN_BOTTOM | TableLayout.ALIGN_LEFT;
/**
 * 中下
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_BOTTOM_CENTER = TableLayout.ALIGN_BOTTOM | TableLayout.ALIGN_CENTER;
/**
 * 右下
 * @constant
 * @type {number}
 */
TableLayout.ALIGN_BOTTOM_RIGHT = TableLayout.ALIGN_BOTTOM | TableLayout.ALIGN_RIGHT;