/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 交互元素的表现：普通、按下、不可用
 * @class qc.TransitionBehaviour
 */
var TransitionBehaviour = qc.defineBehaviour('qc.TransitionBehaviour', qc.Behaviour, function() {
    if (this.gameObject.state === undefined) {
        throw new Error('The target node does not have the interactive function, and can not be added to this component.');
        return;
    }

    this.target = this.gameObject;
    this._transition = qc.Transition.TEXTURE_SWAP;
},
{
    target : qc.Serializer.NODE,
    _transition : qc.Serializer.NUMBER,
    _normalTexture : qc.Serializer.AUTO,
    _pressedTexture : qc.Serializer.AUTO,
    _disabledTexture : qc.Serializer.AUTO,
    _normalColor : qc.Serializer.COLOR,
    _pressedColor : qc.Serializer.COLOR,
    _disabledColor : qc.Serializer.COLOR
});

// 菜单上的显示
TransitionBehaviour.__menu = 'UI/TransitionBehaviour';

Object.defineProperties(TransitionBehaviour.prototype, {
    /**
     * @property {qc.Node} target - 做表现的目标节点
     */
    target : {
        get : function() { return this._target; },
        set :function(v) {
            this._target = v;
            this._reset();
        }
    },

    /**
     * @property {number} transition - 按钮的切换方式
     * TODO: 动画方式暂时不支持
     */
    transition : {
        get : function() { return this._transition; },
        set : function(v) {
            if (this._transition === v) return;
            this._transition = v;
            if (!this.target) return;
            this._reset();
        }
    },

    /**
     * @property {qc.Texture} normalTexture - 普通状态下的贴图
     */
    normalTexture : {
        get : function() {
            return this._normalTexture;
        },
        set : function(v) {
            if (v === this._normalTexture) return;
            this._normalTexture = v;
            if (!this.target) return;

            // 如果当前处于普通状态，则更新下贴图
            if (this.gameObject.state === qc.UIState.NORMAL &&
                this.transition === qc.Transition.TEXTURE_SWAP)
                this.target.frame = this.normalTexture;
        }
    },

    /**
     * @property {qc.Texture} pressedTexture - 按下的贴图(如果没有指定使用普通状态贴图)
     */
    pressedTexture : {
        get : function() { return this._pressedTexture; },
        set : function(v) {
            if (v === this._pressedTexture) return;
            this._pressedTexture = v;
            if (!this.target) return;

            //  如果当前处于按下状态，则更新下贴图
            if (this.gameObject.state === qc.UIState.PRESSED &&
                this.transition === qc.Transition.TEXTURE_SWAP)
                this.target.frame = this.pressedTexture;
        }
    },

    /**
     * @property {qc.Texture} disabledTexture - 置灰的贴图(如果没有指定使用普通状态贴图)
     */
    disabledTexture : {
        get : function() { return this._disabledTexture; },
        set : function(v) {
            if (v === this._disabledTexture) return;
            this._disabledTexture = v;
            if (!this.target) return;

            //  如果当前处于置灰状态，则更新下贴图
            if (this.gameObject.state === qc.UIState.DISABLED &&
                this.transition === qc.Transition.TEXTURE_SWAP)
                this.target.frame = this.disabledTexture;
        }
    },

    /**
     * @property {qc.Color} normalColor - 普通情况下的混合色，默认为白色
     */
    normalColor : {
        get : function() { return this._normalColor; },
        set : function(v) {
            if (this._normalColor === v) return;
            if (!this.target) return;
            v = v || Color.white;
            if (!(v instanceof Color)) {
                this.game.log.error('Expected qc.Color, got:{0}', v);
                return;
            }
            this._normalColor = v;

            // 如果当前处于普通状态，更新下混合色
            if (this.gameObject.state === qc.UIState.NORMAL &&
                this.transition === qc.Transition.COLOR_TINT)
                this.target.colorTint = this.normalColor;
        }
    },

    /**
     * @property {qc.Color} pressedColor - 按下的混合色
     */
    pressedColor : {
        get : function() { return this._pressedColor; },
        set : function(v) {
            if (this._pressedColor === v) return;
            if (!this.target) return;
            v = v || Color.grey;
            if (!(v instanceof Color)) {
                this.game.log.error('Expected qc.Color, got:{0}', v);
                return;
            }
            this._pressedColor = v;

            // 如果当前处于按下状态，更新下混合色
            if (this.gameObject.state === qc.UIState.PRESSED &&
                this.transition === qc.Transition.COLOR_TINT)
                this.target.colorTint = this.pressedColor;
        }
    },

    /**
     * @property {qc.Color} disabledColor - 组件无效时颜色
     */
    disabledColor : {
        get : function() { return this._disabledColor; },
        set : function(v) {
            if (this._disabledColor === v) return;
            if (!this.target) return;
            v = v || Color.grey;
            if (!(v instanceof Color)) {
                this.game.log.error('Expected:qc.Color, got:{0}', v);
                return;
            }
            this._disabledColor = v;

            // 如果当前处于置灰状态，更新下混合色
            if (this.gameObject.state === qc.UIState.DISABLED &&
                this.transition === qc.Transition.COLOR_TINT)
                this.target.colorTint = this.disabledColor;
        }
    },

    /**
     * @property {string} pressedAnimation - 按下时的动作
     */
    pressedAnimation : {
        get : function() { return this._pressedAnimation; },
        set :function(v) {
            if (this._pressedAnimation === v) return;
            this._pressedAnimation = v;
        }
    }
});

// 默认普通状态的贴图
TransitionBehaviour.prototype._normalTexture = '';

// 默认按下状态的贴图
TransitionBehaviour.prototype._pressedTexture = '';

// 默认无效状态的贴图
TransitionBehaviour.prototype._disabledTexture = '';

// 默认正常混合色
TransitionBehaviour.prototype._normalColor = Color.white;

// 默认按下时混合色
TransitionBehaviour.prototype._pressedColor = Color.grey;

// 默认无效时的混合色
TransitionBehaviour.prototype._disabledColor = Color.grey;

/**
 * 初始化处理
 */
TransitionBehaviour.prototype.awake = function() {
    // 关注状态变更的事件
    this.gameObject.onStateChange.add(this._reset, this);

    // 立刻重新绘制下
    this._reset();
};

/**
 * @method onDestroy
 * @internal
 */
TransitionBehaviour.prototype.onDestroy = function() {
    // 删除状态监听
    this.gameObject.onStateChange.remove(this._reset, this);
};

/**
 * 重新绘制下
 * @private
 */
TransitionBehaviour.prototype._reset = function() {
    if (!this.target) return;
    if (!this.enable) return;

    switch (this.transition) {
    case qc.Transition.NONE:
        // 啥也不干
        break;

    case qc.Transition.TEXTURE_SWAP:
        switch (this.gameObject.state) {
        case qc.UIState.NORMAL:
            if (this.normalTexture)
                this.target.frame = this.normalTexture;
            break;
        case qc.UIState.PRESSED:
            if (this.pressedTexture)
                this.target.frame = this.pressedTexture;
            break;
        case qc.UIState.DISABLED:
            if (this.disabledTexture)
                this.target.frame = this.disabledTexture;
            break;
        }
        break;

    case qc.Transition.COLOR_TINT:
        switch (this.gameObject.state) {
        case qc.UIState.NORMAL:
            this.target.colorTint = this.normalColor; break;
        case qc.UIState.PRESSED:
            this.target.colorTint = this.pressedColor; break;
        case qc.UIState.DISABLED:
            this.target.colorTint = this.disabledColor; break;
        }
        break;

    case qc.Transition.ANIMATION:
        // TODO: 暂时不支持
        break;
    }
}
