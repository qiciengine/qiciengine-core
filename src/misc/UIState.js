/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 组件的3种状态：
 * 普通、按下、不可交互
 *
 * @class qc.UIState
 */
qc.UIState = {
    /**
     * @property {number} NORMAL - 正常状态
     * @static
     */
    NORMAL : 0,

    /**
     * @property {number} PRESSED - 按下状态
     * @static
     */
    PRESSED : 1,

    /**
     * @property {number} DISABLED - 不可用
     * @static
     */
    DISABLED : 2
};
