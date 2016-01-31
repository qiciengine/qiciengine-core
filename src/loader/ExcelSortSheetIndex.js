/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 表格类数据的排序类索引数据，数据的查找使用二分法进行
 * @class qc.ExcelSortSheetIndex
 * @param excelSheet {qc.ExcelSheet} - 表格数据
 * @param keys {[string]} - 用来排序的列名
 * @constructor
 * @internal
 */
var ExcelSortSheetIndex = qc.ExcelSortSheetIndex = function(excelSheet, keys) {
    /**
     * @property {qc.ExcelSheet} sheet - 表格数据
     */
    this.sheet = excelSheet;

    /**
     * @property {[string]} _keys - 索引的列名
     * @private
     */
    this._keys = keys;

    // 创建索引数据
    this._buildIndex();
};
ExcelSortSheetIndex.prototype = {};
ExcelSortSheetIndex.prototype.constructor = ExcelSortSheetIndex;

Object.defineProperties(ExcelSortSheetIndex.prototype, {
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
    }
});

/**
 * 创建索引数据
 * @private
 */
ExcelSortSheetIndex.prototype._buildIndex = function() {
    var self = this;
    var cols = this.sheet.columns.slice(0);
    if (this._keys) {
        for (var i = 0; i < this._keys.length; i++) {
            var idx = cols.indexOf(this._keys[i]);
            cols.splice(idx, 1);
        }
        Array.prototype.unshift.apply(cols, this._keys);
    }
    self._cols = cols;
    self._rows = this.sheet.rows.slice(0);
    self._rows.sort(function(one, two) {
        self._rowCompare(cols, one, two);
    });
};

/**
 * 查找第一个满足条件的行
 * @param {...*} values - 满足条件的值，值的顺序为本对象columns设定的顺序
 */
ExcelSortSheetIndex.prototype.first = function() {
    var argLen = arguments.length;
    if (argLen === 0)
        return 0;
    var self = this;
    return this._dichotomySearchFirst(this._rows, arguments, function(value, arrayElement) {
        return self._searchCompare(value, arrayElement);
    });
};

/**
 * 查找第一个满足条件的行
 * @param {...*} values - 满足条件的值，值的顺序为本对象columns设定的顺序
 */
ExcelSortSheetIndex.prototype.last = function() {
    var argLen = arguments.length;
    if (argLen === 0)
        return 0;
    var self = this;
    return this._dichotomySearchLast(this._rows, arguments, function(value, arrayElement) {
        return self._searchCompare(value, arrayElement);
    });
};

/**
 * 查找第一个满足条件的行范围
 * @param {...*} values - 满足条件的值，值的顺序为本对象columns设定的顺序
 * @return {[start, end] | null}
 */
ExcelSortSheetIndex.prototype.matches = function() {
    var argLen = arguments.length;
    if (argLen === 0)
        return [0, this._rows.length];
    var self = this;
    var first = this._dichotomySearchFirst(this._rows, arguments, function(value, arrayElement) {
        return self._searchCompare(value, arrayElement);
    });
    if (first < 0) {
        return null;
    }
    var last = this._dichotomySearchFirst(this._rows, arguments, function(value, arrayElement) {
        return self._searchCompare(value, arrayElement);
    }, first);
    return [first, last];
};

/**
 * 单元格数据比较
 * @param one {number|string|null|undefined} - 单元格数据
 * @param two {number|string|null|undefined} - 单元格数据
 * @private
 */
ExcelSortSheetIndex.prototype._cellCompare = function(one, two) {
    if (!one) {
        if (!two)
            return 0;
        else
            return 1;
    }
    if (!two)
        return -1;

    if (one === two)
        return 0;
    else if (one < two)
        return -1;
    else
        return 1;
};

/**
 * 查询时使用的比较函数
 * @param value
 * @param arrayElement
 * @private
 */
ExcelSortSheetIndex.prototype._searchCompare = function(value, arrayElement) {
    if (!arrayElement) {
        return 1;
    }
    var cols = this._cols;
    var argLen = value.length;
    var i = -1;
    var ret;
    while (++i < argLen) {
        ret = this._cellCompare(value[i], arrayElement[cols[i]]);
        if (ret > 0)
            return 1;
        else if (ret < 0)
            return -1;
    }
    return 0;
};

/**
 * 行进行比较
 * @param one {{}} - 需要比较的行数据
 * @param two {{}} - 需要比较的列数据
 * @param cols {[string]} - 需要比较的列
 * @param start {number} - 开始的位置
 * @param length {number} - 长度
 * @private
 */
ExcelSortSheetIndex.prototype._rowCompare = function(one, two, cols, start, length) {
    if (!one) {
        if (!two)
            return 0;
        else
            return 1;
    }
    if (!two)
        return -1;

    start = start || 0;
    var end = start + (length || (cols.length - start));
    var col, ret;
    for (var i = start; i < end; i++) {
        col = cols[i];
        ret = this._cellCompare(one[col], two[col]);
        if (ret === 0)
            continue;
        return ret;
    }
    return 0;
};

/**
 * 通过二分法在数组中查找相关
 * @param array {[]} - 需要查询的数组
 * @param value {*} - 需要查询的值
 * @param compare {Function} - 比较函数,function(value, arrayElement)
 * @return {number}
 */
ExcelSortSheetIndex.prototype._dichotomySearch = function(array, value, compare) {
    var low = 0;
    var high = array.length - 1;
    var middle = 0;
    var ret = 0;
    while (low <= high) {
        middle = Math.floor((low + high) / 2);
        ret = compare(value, array[middle]);
        if (ret < 0) {
            high = middle - 1;
        }
        else if (ret > 0) {
            low = middle + 1;
        }
        else {
            return middle;
        }
    }
    return -1;
};

/**
 * 数组中存在同键值的，查找第一次出现的值
 * @param array {[]} - 需要查询的数组
 * @param value {*} - 需要查询的值
 * @param compare {Function} - 比较函数,function(value, arrayElement)
 * @param low {number} - 查询开始的序号
 * @param high {number} - 查询结束的序号
 * @returns {number}
 * @private
 */
ExcelSortSheetIndex.prototype._dichotomySearchFirst = function(array, value, compare, low, high) {
    var low = low || 0;
    var high = high || array.length - 1;
    var middle = 0;
    var ret = 0;
    while (low < high) {
        middle = Math.floor((low + high) / 2);
        ret = compare(value, array[middle]);
        if (ret <= 0) {
            high = middle;
        }
        else {
            low = middle + 1;
        }
    }
    if (compare(value, array[low]) === 0) {
        return low;
    }
    return -1;
};

/**
 * 数组中存在同键值的，查找最后一次出现的值
 * @param array {[]} - 需要查询的数组
 * @param value {*} - 需要查询的值
 * @param compare {Function} - 比较函数,function(value, arrayElement)
 * @param low {number} - 查询开始的序号
 * @param high {number} - 查询结束的序号
 * @returns {number}
 * @private
 */
ExcelSortSheetIndex.prototype._dichotomySearchLast = function(array, value, compare, low, high) {
    var low = low || 0;
    var high = high || array.length - 1;
    var middle = 0;
    var ret = 0;
    while (low < high) {
        middle = Math.ceil((low + high) / 2);
        ret = compare(value, array[middle]);
        if (ret < 0) {
            high = middle - 1;
        }
        else {
            low = middle;
        }
    }
    if (compare(value, array[high]) === 0) {
        return low;
    }
    return -1;
};