/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 表格类数据的hash类索引
 * @class qc.ExcelHashSheetIndex
 * @param excelSheet {qc.ExcelSheet} - 表格数据
 * @param hashKey {string} - 用来排序的列名
 * @param unique {boolean} - 键值是否唯一，唯一时，获取数据时获取的是所在行的值，否则获取的为行数组
 * @constructor
 * @internal
 */
var ExcelHashSheetIndex = qc.ExcelHashSheetIndex = function(excelSheet, hashKey, unique) {
    // 创建索引数据
    this._buildIndex(excelSheet, hashKey, unique);
};
ExcelHashSheetIndex.prototype = {};
ExcelHashSheetIndex.prototype.constructor = ExcelHashSheetIndex;

Object.defineProperties(ExcelHashSheetIndex.prototype, {
    /**
     * @property {[string]} columns - 存储排序的列信息
     * 优先按设定的key顺序，之后按原有columns的顺序
     * @readonly
     */
    columns : {
        get : function() { return this._cols.slice(0); }
    },

    /**
     * @property {[{}]} rows - 当前索引下的行数据
     * @readonly
     */
    rows : {
        get : function() { return this._rows; }
    },

    /**
     * @property {[string]} keys - 所有的键值
     * @readonly
     */
    keys : {
        get : function() { return this._keys; }
    }
});
/**
 * 创建索引数据
 * @param excelSheet {qc.ExcelSheet} - 表格数据
 * @param hashKey {string} - 用来排序的列名
 * @param unique {boolean} - 键值是否唯一，唯一时，获取数据时获取的是所在行的值，否则获取的为行数组
 * @private
 */
ExcelHashSheetIndex.prototype._buildIndex = function(excelSheet, hashKey, unique) {
    var rows = excelSheet.rows;
    this._rows = rows;
    this._cols = excelSheet.columns.slice(0);
    this._keys = [];
    var len = rows.length, i = -1;
    while (++i < len) {
        var row = rows[i];
        var keyValue = row[hashKey];
        if (unique) {
            this[keyValue] = row;
            this._keys.push(keyValue);
        }
        else {
            if (keyValue in this) {
                this[keyValue].push(row);
            }
            else {
                this[keyValue] = [row];
                this._keys.push(keyValue);
            }
        }
    }
};
