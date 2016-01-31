/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 组件的交互变换模式
 * 不切换、颜色混合、图片变换、自定义动作
 * @class qc.Transition
 */
qc.Transition = {
    /**
     * @property {number} NONE - 不需要有任何变换
     * @static
     */
    NONE : 0,

    /**
     * @property {number} COLOR_TINT - 变换颜色
     * @static
     */
    COLOR_TINT : 1,

    /**
     * @property {number} TEXTURE_SWAP - 使用图片变换
     * @static
     */
    TEXTURE_SWAP : 2,

    /**
     * @property {number} ANIMATION - 使用自定义动画
     * @static
     */
    ANIMATION : 3
};
