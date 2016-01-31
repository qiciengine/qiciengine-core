/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 表格资源
 *
 * @class qc.ExcelAsset
 * @constructor
 * @internal
 */
var ExcelAsset = qc.ExcelAsset = function(key, url, data, meta) {
    /**
     * @property {string} key - 图集的标志
     * @readonly
     */
    this.key = key;

    /**
     * @property {string} url - 资源的网址
     * @readonly
     */
    this.url = url;

    /**
     * @property {{}} meta - meta数据
     * @private
     */
    this._meta = meta;

    /**
     * @property {{}} _data - 原始表格数据
     * @private
     */
    this._data = typeof data === 'string' ? JSON.parse(data) : data;

    /**
     * @property {{}} _tables - 整理后的表格数据
     * @private
     */
    this._sheets = {};

    // 构建表格数据
    this._makeSheetData();
};
ExcelAsset.prototype.constructor = ExcelAsset;

Object.defineProperties(ExcelAsset.prototype, {
    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    },

    /**
     * @property {[string]} sheetsName - 获取所有的表名
     * @readonly
     */
    sheetsName : {
        get : function() { return this._sheets ? Object.keys(this._sheets) : []; }
    },

    /**
     * @property {{}} - sheets - 获取所有表数据
     * @readonly
     */
    sheets : {
        get : function() { return this._sheets; }
    },

    /**
     * @property {{}} meta - 元数据
     * @readonly
     */
    meta :  {
        get : function() { return this._meta; }
    }
});

/**
 * 生成表格数据
 * @private
 */
ExcelAsset.prototype._makeSheetData = function() {
    var sheetsName = this._data ? Object.keys(this._data) : [];
    for (var i = 0; i < sheetsName.length; i++) {
        var sheetName = sheetsName[i];
        var rows = this._data[sheetName].rows;
        var cols = this._data[sheetName].cols;
        var primaryKey = this._meta[sheetName] ? (this._meta[sheetName].primaryKey || []) : [];
        var sheetData = new qc.ExcelSheet(cols, rows, primaryKey);
        this._sheets[sheetName] = sheetData;
    }
};

/**
 * 通过名字获取一个表格的所有数据
 * @param name {string} - 表单名字
 */
ExcelAsset.prototype.findSheet = function(name) {
    return this.sheets[name];
};

/**
 * 释放excel资源
 * @param game
 * @internal
 */
ExcelAsset.prototype.unload = function(game) {
    // do nothing
};

/**
 * Excel的日期时间与javascript时间起点间的差值
 * @type {number}
 * @constant
 * @private
 */
ExcelAsset._EXCEL_DATE_OFF = -2208988800000; // new Date('1900-1-1') - new Date('1970-1-1');

/**
 * 当前时区的偏移毫秒数
 * @type {number}
 * @constant
 * @private
 */
ExcelAsset._TIMEZONE_OFF = new Date().getTimezoneOffset() * 60 * 1000;

/**
 * excel的日期类型是从1900年开始，使用时需要进行转化
 * @param number {Number} - excel的时间数值
 * @return {Date} - javascript的时间
 */
ExcelAsset.parseToDate = function(number) {
    return new Date(ExcelAsset._EXCEL_DATE_OFF + number * 86400000 + ExcelAsset._TIMEZONE_OFF);
};