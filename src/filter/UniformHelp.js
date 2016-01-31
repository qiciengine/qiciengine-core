/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 同步数据的辅助类
 * @param type {string} - Filter Uniform Type
 * @param value {*|func} - 需要同步的值或者函数
 */
var UniformHelp = qc.Filter.UniformHelp = function(type, value) {
    /**
     * @property {string} _type - 同步类型
     * @private
     */
    this._type = type;
    /**
     * @property {*} _value - 同步的值
     * @private
     */
    this._value = value;
    /**
     * @property {boolean} _valueIsFunc - 值是否为函数
     * @private
     */
    this._valueIsFunc = (typeof this._value === 'function');
};
UniformHelp.prototype = {};
UniformHelp.prototype.constructor = UniformHelp;

Object.defineProperties(UniformHelp.prototype, {
    /**
     * @property {string} type - 同步的类型
     * @readonly
     */
    type : {
        get : function() { return this._type; }
    },
    /**
     * @property {*} value - 同步的值
     * @readonly
     */
    value : {
        get : function() {
            if (this._valueIsFunc) {
                return this._value();
            }
            else {
                return this._value;
            }
        }
    }
});

