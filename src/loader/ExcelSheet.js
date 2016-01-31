/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 表格类数据
 * @class qc.ExcelSheet
 * @constructor
 * @internal
 */
var ExcelSheet = qc.ExcelSheet = function(cols, rows, primaryKey) {
    // 保存相关信息
    this._cols = cols || [];
    this._rows = rows || [];

    // 普通索引数据
    this._indexes = {};
    this._primaryKey = primaryKey;
    this._buildPrimaryIndex();
};
ExcelSheet.prototype.constructor = ExcelSheet;

Object.defineProperties(ExcelSheet.prototype, {
    /**
     * @property {[string]} columns - 获取所有的列名
     * @readonly
     */
    columns : {
        get : function() { return this._cols; }
    },

    /**
     * @property {[object]} rows - 获取所有的行
     * @readonly
     */
    rows : {
        get : function() { return this._rows; }
    }
});

/**
 * 创建主索引数据
 * @private
 */
ExcelSheet.prototype._buildPrimaryIndex = function() {
    this.addSortIndex('primary', this._primaryKey);
};

/**
 * 添加一个索引数据
 * @param name {string} - 索引的别名
 * @param keys {...string} - 行排序比较的列顺序，未指明的按原有顺序
 * @return {qc.ExcelSortSheetIndex}
 */
ExcelSheet.prototype.addSortIndex = function(name) {
    var self = this;
    var keys = Array.prototype.slice.call(arguments,1);
    var index;
    if (Array.isArray(keys[0])) {
        index = new qc.ExcelSortSheetIndex(this, keys[0]);
    }
    else {
        index = new qc.ExcelSortSheetIndex(this, keys);
    }
    this._indexes[name] = index;
    return index;
};

/**
 * 使用指定列名创建一个hash索引，创建后，可以直接通过值获取数据
 * @param name {string} - 索引的别名
 * @param columnName {string} - 需要作为hash键值的列名
 * @param unique {boolean} - 键值是否唯一
 * @return {qc.ExcelHashSheetIndex}
 */
ExcelSheet.prototype.addHashIndex = function(name, columnName, unique) {
    var index = new qc.ExcelHashSheetIndex(this, columnName, unique === undefined || unique);
    this._indexes[name] = index;
    return index;
};

/**
 * 获取一个已经设定好的索引
 * @param name {string} - 索引别名
 * @return {qc.ExcelSortSheetIndex | qc.ExcelHashSheetIndex}
 */
ExcelSheet.prototype.getIndex = function(name) {
    return this._indexes[name];
};

/**
 * 获取主索引，默认为第一列的索引
 * @returns {qc.ExcelSortSheetIndex}
 */
ExcelSheet.prototype.getPrimary = function() {
    return this.getIndex('primary');
};

/**
 * 遍历查找满足条件的第一个数据
 * @param func {function} - 需要查找的条件
 * @return {number} - 找到的行号
 * @private
 */
ExcelSheet.prototype.find = function(func) {
    var rows = this._rows;
    var len = rows.length;
    var i = -1;
    while (++i < len) {
        if (func(rows[i])) {
            return i;
        }
    }
    return -1;
};

/**
 * 遍历查找满足条件的最后一个数据
 * @param func {function} - 需要查找的条件
 * @return {number} - 找到的行号
 * @private
 */
ExcelSheet.prototype.findLast = function(func) {
    var rows = this._rows;
    var i = rows.length;
    while (i-- > 0) {
        if (func(rows[i])) {
            return i;
        }
    }
    return -1;
};

/**
 * 遍历查找所有满足条件的数据
 * @param func {function} - 需要查找的条件
 * @return {[number]} - 找到的行号
 * @private
 */
ExcelSheet.prototype.matches = function(func) {
    var rows = this._rows;
    var len = rows.length;
    var i = -1;
    var ret = [];
    while (++i < len) {
        if (func(rows[i])) {
            ret.push(i);
        }
    }
    return ret;
};

/**
 * 将一列的数据转化为日期类型
 * @param column {string} - 列名
 */
ExcelSheet.prototype.parseColumnToData = function(column) {
    var rows = this._rows;
    var len = rows.length;
    var i = -1;
    var ret = [];
    while (++i < len) {
        if (column in rows[i]) {
            rows[i][column] = ExcelAsset.parseToDate(rows[i][column]);
        }
    }
    return ret;
};