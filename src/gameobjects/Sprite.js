/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * sprite 精灵对象，包含动画，一般用于非 UI 的所有图片元素
 *
 * @class qc.Sprite
 * @extends qc.Node
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var Sprite = qc.Sprite = function(game, parent, uuid) {
    var phaserImage = new Phaser.Sprite(game.phaser);
    qc.Node.call(this, phaserImage, parent, uuid);

    // 设置默认的名字
    this.name = 'Sprite';

    // 设置默认的动作类型
    this.animationType = qc.Sprite.NONE_ANIMATION;

    // 我们需要重载掉 Phaser 的 setFrame 来支持帧动画缩放
    this._phaserImageSetFrame = phaserImage.setFrame;
    phaserImage.setFrame = setFrame;

    // 重载掉绘制，让骨骼动画的根节点不显示
    phaserImage._renderWebGL = spriteRenderWebGL;
    phaserImage._renderCanvas = spriteRenderCanvas;
};
Sprite.prototype = Object.create(qc.Node.prototype);
Sprite.prototype.constructor = Sprite;

/**
 * 动作类型：无动作
 * @constant
 * @type {number}
 */
Sprite.NONE_ANIMATION = 0;

/**
 * 动作类型：帧动画
 * @constant
 * @type {number}
 */
Sprite.FRAME_ANIMATION = 1;

/**
 * 动作类型：DRAGON_BONES
 * @constant
 * @type {number}
 */
Sprite.DRAGON_BONES = 2;

/**
 * 动作类型：帧采样动作
 * @constant
 * @type {number}
 */
Sprite.FRAME_SAMPLES = 3;

// 帧采样动画播放的时候插值倍数
var sInterpolationCo = 8;

/**
 * 播放图片的动画
 * @property {string} animationName
 * @property {speed} 播放速度 例如 2 表示 2 倍速播放
 * @property {loop} 是否循环播放
 */
Sprite.prototype.playAnimation = function(animationName, speed, loop) {
    var self = this;
    var animationType = self.animationType;
    if (animationType === Sprite.NONE_ANIMATION || !animationName) return;

    if (animationType === Sprite.DRAGON_BONES) {
        var animation = self._armature.animation;

        if (animation.animationNameList.indexOf(animationName) < 0) {
            console.warn("Animation is not exist.", animationName);
            return;
        }

        var playDuration = undefined;
        if (typeof(speed) === 'number' && speed != 1 && speed > 0) {
            // 获取动作时长
            var i = animation.animationNameList.length;
            var animationData;
            while (i--) {
                if (animation._animationDataList[i].name == animationName) {
                    animationData = animation._animationDataList[i];
                    break;
                }
            }
            if (animationData) { playDuration = animationData.duration / speed; }
        }

        var loopTimes;

        if (loop === true) {
            // 确定循环动作
            loopTimes = 2097152; /* (2 << 20) */
        }
        else if (loop === false) {
            // 确定单次播放
            loopTimes = 1;
        }
        else {
            // 使用预设的播放次数
            loopTimes = undefined;
        }

        // 删除 pause 状态
        self.paused = false;
        self._armature.animation.gotoAndPlay(animationName, undefined, playDuration, loopTimes);
        return;
    }

    // 默认为普通帧动画、采样动画
    var animationData = this._animation[animationName];
    if (!animationData) {
        self.game.log.error('Animation {0} not exists', animationName);
        return;
    }

    // 注册动作给 phaser
    var rate = animationData["rate"] ? animationData["rate"] : 60;
    if (animationType === Sprite.FRAME_SAMPLES)
        rate = rate * sInterpolationCo;

    if (!self.phaser.animations._anims[animationName]) {
        // 构造动作
        self.phaser.animations.add(animationName, animationData["frames"], rate);

        // 关注动作事件
        var animation = self.phaser.animations._anims[animationName];
        animation.onStart.add(function() {
            if (self._onStart) self._onStart.dispatch(self.lastAnimationName);
        });
        animation.onComplete.add(function() {
            if (self._onFinished) self._onFinished.dispatch(self.lastAnimationName);
        });
        animation.onLoop.add(function() {
            if (self._onLoopFinished) self._onLoopFinished.dispatch(self.lastAnimationName);
        });
    }

    if (typeof(loop) !== 'boolean') {
        // 参数没有指定 loop 行为，则使用配置的 loop
        loop = !!animationData['loop'];
    }

    this._slowMotion = this.game.time.timeScale;
    this._speed = (speed ? speed : 1.0) * rate;

    // 开始播放这组动作
    self.phaser.animations.play(animationName, this._speed / this._slowMotion, loop);
};

/**
 * 停止动画的播放
 */
Sprite.prototype.stop = function() {
    var self = this;
    var animationType = self.animationType;

    if (animationType === Sprite.NONE_ANIMATION) return;

    // 动画非播放中，不需要处理
    if (!self.isPlaying) return;

    if (animationType === Sprite.DRAGON_BONES) {
        var animation = self._armature.animation;
        animation.stop();
        return;
    }

    // 默认为普通帧动画、采样动画
    var currentAnim = self.phaser.animations.currentAnim;
    if (currentAnim) currentAnim.stop(undefined, true);
};

/**
 * 负责驱动精灵的骨骼动画
 */
Sprite.prototype.update = function() {
    if (this.animationType === qc.Sprite.FRAME_SAMPLES && this.isPlaying) {
        this.phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE);
    }

    if (this.animationType === qc.Sprite.DRAGON_BONES &&
        this._armature) {

        // 当前动作静止
        if (this.isPaused()) return;

        // 骨骼动画需要驱动起来
        var passedTime = 0.001 * this.game.time.deltaTime;
        this._armature.advanceTime(passedTime);
    }
    else if (this.animationType === qc.Sprite.FRAME_ANIMATION || this.animationType === qc.Sprite.FRAME_SAMPLES) {
        // 帧动画，如果 timeScale 发生变更，需要重新设置播放速度
        var timeScale = this.game.time.timeScale;
        if (timeScale === this._slowMotion)
            return;

        this._slowMotion = timeScale;
        var animation = this.phaser.animations.currentAnim;
        if (animation) animation.speed = this._speed / timeScale;
    }
};

/**
 * 绑定骨骼动画的事件
 */
Sprite.prototype.bindDragonBonesEvent = function() {
    var self = this;
    self._armature.addEventListener('start', function() {
        if (self._onStart) self._onStart.dispatch(self.lastAnimationName);
    });
    self._armature.addEventListener('complete', function() {
        if (self._onFinished) self._onFinished.dispatch(self.lastAnimationName);
    });
    self._armature.addEventListener('loopComplete', function() {
        if (self._onLoopFinished) self._onLoopFinished.dispatch(self.lastAnimationName);
    });
};

/**
 * 获取动作具体信息
 * @param {animationName} 动作名
 * @returns 动作的具体信息，没有找到返回 undefined
 */
Sprite.prototype.getAnimationInfo = function(animationName) {
    var self = this;
    var animationType = this.animationType;
    if (animationType === Sprite.NONE_ANIMATION) return;

    if (animationType === Sprite.DRAGON_BONES) {
        // 骨骼动画
        var animation = this._armature.animation;
        if (animation.animationNameList.indexOf(animationName) < 0) {
            return;
        }

        var i = animation.animationNameList.length;
        var animationData;
        while (i--) {
            if (animation._animationDataList[i].name == animationName) {
                animationData = animation._animationDataList[i];
                break;
            }
        }
        return animationData;
    }
    else {
        var animationData = this._animation[animationName];
        if (!animationData)
            return;
        var frames = animationData['frames'] || [];
        var rate = animationData['rate'] ? parseFloat(animationData['rate']) : 30;
        return {
            frames : frames,
            frameRate : rate,
            loop : animationData['loop'] ? 0 : 1,
            duration : frames.length / rate
        };
    }
};

Object.defineProperties(Sprite.prototype, {
    /**
     *  @property {qc.Texture} texture
     */
    texture: {
        get : function() {
            if (!this._atlas) return null;
            return new qc.Texture(this._atlas, this.frame);
        },
        set : function(texture) {
            var self = this;
            
            // 如果之前是骨骼动画，需要移除掉骨骼
            if (self.animationType === Sprite.DRAGON_BONES && self._boneBase) {
                self.removeChild(self._boneBase);
                self._armature = null;
                self._boneBase = null;
            }

            if (!texture) {
                self._atlas = null;
                self.phaser.loadTexture(null, self.frame);
                self.animationType = Sprite.NONE_ANIMATION;
                return;
            }
            if (texture instanceof qc.Atlas) texture = new qc.Texture(texture, self.frame);
            var atlas = self._atlas = texture.atlas;

            // 记录动作信息
            self.animationType = atlas.animation ? atlas.animation.type : Sprite.NONE_ANIMATION;
            if (self.animationType === Sprite.DRAGON_BONES) {
                var armature = self._armature = qc.dragonBones.makeQcArmature(
                    atlas.animation.data,
                    atlas.json,
                    atlas.img, atlas.key);
                if (!armature) {
                    console.warn("makeQcArmature failed:(img:", atlas.img,
                        "atlas:", atlas.json, "skeleton:", atlas.animation.data, ")");
                    return;
                }
                self._armature = armature;

                // 添加到世界中
                var bonesBase = armature.getDisplay();
                self.addChild(bonesBase);
                self._boneBase = bonesBase;

                // 集成上个骨骼的 colorTint
                self.colorTint = self.colorTint;
            }
            else if (self.animationType === Sprite.FRAME_ANIMATION) {
                self._animation = atlas.animation.data.animations;
                self.phaser.animations = new Phaser.AnimationManager(self.phaser);
            }
            else if (self.animationType === Sprite.FRAME_SAMPLES) {
                self._animation = atlas.animation.data.samples;
                self.phaser.animations = new Phaser.AnimationManager(self.phaser);
            }

            // 如果frame不存在，则使用第一帧
            if (!atlas.getFrame(texture.frame)) texture.frame = 0;
            
            // 载入贴图（通过设置frame来起效）
            self.phaser.key = atlas.key;
            self.frame = texture.frame;
            self.paused = false;

            // 绑定事件监听
            if (self.animationType === Sprite.DRAGON_BONES) {
                self.bindDragonBonesEvent();
            }

            // 如果有默认动作，尝试播放 or 删除之
            if (self.defaultAnimation) {
                if (!self.animationNameList || self.animationNameList.indexOf(self.defaultAnimation) < 0) {
                    // 没有这个动作
                    self.defaultAnimation = null;
                }
                else
                    self.playAnimation(self.defaultAnimation);
            }

            self._dispatchLayoutArgumentChanged('size');

            if (self._onTextureChanged) {
                self._onTextureChanged.dispatch();
            }
        }
    },

    /**
     *  获取or设置当前的图片帧，一般是图集才会用到该属性（可以为数字或别名）
     *  @property {int|string} frame
     */
    frame: {
        get : function() {
            return this.phaser.frameName;
        },
        set : function(value) {
            if (!this.texture) return;

            var frameNames = this.texture.atlas.frameNames || [0];
            if (typeof(value) === 'string' && frameNames.indexOf(value) === -1)
                return;
            this.phaser.loadTexture(this.texture.atlas.key, value, false);
            this._dispatchLayoutArgumentChanged('size');

            if (this._onTextureChanged) {
                this._onTextureChanged.dispatch();
            }
        }
    },

    /**
     * @property {string} defaultAnimation - 默认的动作，在资源成功载入后会尝试播放
     * @readonly
     */
    defaultAnimation : {
        get : function() {
            return this._defaultAnimation;
        },
        set : function(value) {
            if (value === '')
                value = null;
            this._defaultAnimation = value;

            // 尝试下播放
            this.playAnimation(value);
        }
    },

    /**
     * 当前动作是否停止
     * @property {bool} paused
     */
    paused : {
        get : function() {
            return this.isPaused();
        },
        set : function(value) {
            switch (this.animationType) {
            case qc.Sprite.FRAME_ANIMATION :
            case qc.Sprite.FRAME_SAMPLES :
                if (!this.phaser.animations.currentAnim) return;
                this.phaser.animations.paused = value;
                break;
            case qc.Sprite.DRAGON_BONES :
                this._paused = value;
                break;
            default :
                // do nothing
                break;
            }
        }
    },

    /**
     * 当前动作是否播放中
     */
    isPlaying : {
        get : function() {
            switch (this.animationType) {
            case qc.Sprite.FRAME_ANIMATION :
            case qc.Sprite.FRAME_SAMPLES :
                var ani = this.phaser.animations.currentAnim;
                return !!ani && ani.isPlaying;
            case qc.Sprite.DRAGON_BONES :
                return this._armature && this._armature.animation.getIsPlaying();
            default :
                return false;
            }
        }
    },

    /**
     * 当前动作是否结束
     */
    isComplete : {
        get : function() {
            switch (this.animationType) {
            case qc.Sprite.FRAME_ANIMATION :
            case qc.Sprite.FRAME_SAMPLES :
                var ani = this.phaser.animations.currentAnim;
                return !!ani && ani.isFinished;
            case qc.Sprite.DRAGON_BONES :
                return this._armature && this._armature.animation.getIsComplete();
            default :
                return false;
            }
        }
    },

    /**
     * 上一个播放的动作名字
     */
    lastAnimationName : {
        get : function() {
            switch (this.animationType) {
            case qc.Sprite.FRAME_ANIMATION :
            case qc.Sprite.FRAME_SAMPLES :
                var ani = this.phaser.animations.currentAnim;
                if (!ani) return null;
                return ani.name;
            case qc.Sprite.DRAGON_BONES :
                return this._armature && this._armature.animation.getLastAnimationName();
            default :
                return false;
            }
        }
    },

    /**
     * @property {Phaser.Signal} onStart -  动作开始事件
     */
    onStart : {
        get: function() {
            if (!this._onStart) {
                this._onStart = new Phaser.Signal();
            }
            return this._onStart;
        }
    },

    /**
     * @property {Phaser.Signal} onFinished -  动作结束事件
     */
    onFinished : {
        get: function() {
            if (!this._onFinished) {
                this._onFinished = new Phaser.Signal();
            }
            return this._onFinished;
        }
    },

    /**
     * @property {Phaser.Signal} onLoopFinished -  循环动作的单轮播放完毕事件
     */
    onLoopFinished : {
        get: function() {
            if (!this._onLoopFinished) {
                this._onLoopFinished = new Phaser.Signal();
            }
            return this._onLoopFinished;
        }
    },

    /**
     * @property {qc.Rectangle} nativeSize - 图片实际大小
     * @readonly
     */
    nativeSize : {
        get : function() {
            return (this.phaser && this.phaser.texture && this.phaser.texture.crop) || new qc.Rectangle(0, 0, 0, 0);
        }
    },

    /**
     * 获取当前使用的骨骼根节点
     * @property armature
     */
    armature : {
        get : function() {
            return this._armature;
        }
    },

    /**
     * 获取当前可以播放的动作列表
     * @property {array} animationNameList
     */
    animationNameList : {
        get : function() {
            switch (this.animationType) {
            case qc.Sprite.FRAME_ANIMATION :
                if (!this.texture)
                    return null;
                var allAnimationData = this.texture.atlas.animation.data.animations;
                if (!allAnimationData)
                    return null;
                return Object.keys(allAnimationData);
            case qc.Sprite.DRAGON_BONES :
                if (!this._armature)
                    return null;
                return this._armature.animation.animationNameList;
            case qc.Sprite.FRAME_SAMPLES :
                var data = this._animation;
                if (!data) return null;
                return Object.keys(data);
            default :
                return null;
            }
        }
    },

    /**
     * 设置颜色混合
     * @property {qc.Color} colorTint
     */
    colorTint : {
        get : function() {
            return new Color(this.phaser.tint);
        },

        set : function(value) {
            if (!(value instanceof Color))
                throw new Error('Expected:qc.Color');

            this.phaser.tint = value.toNumber();

            // 如果是骨骼动作，需要遍历进去
            if (this.animationType === qc.Sprite.DRAGON_BONES &&
                this._armature) {
                this._armature._slotList.forEach(function(slot) {
                    if (slot._displayList) {
                        slot._displayList.forEach(function(image) {
                            image.colorTint = value;
                        });
                    }
                });
            }
        }
    },

    /**
     * @property {Phaser.Signal} onTextureChanged - 当显示的贴图发生变化时触发
     */
    onTextureChanged : {
        get : function() {
            if (!this._onTextureChanged) {
                this._onTextureChanged = new Phaser.Signal();
            }
            return this._onTextureChanged;
        }
    },

    /**
     * @property {string} class - 类名
     * @internal
     * @readonly
     */
    class : {
        get : function() { return 'qc.Sprite'; }
    }
});

/**
 * 设置图片大小为实际大小
 * @method qc.Sprite#resetNativeSize
 */
Sprite.prototype.resetNativeSize = function() {
    this.width = this.nativeSize.width;
    this.height = this.nativeSize.height;
};

/**
 * 动作是否处于暂停状态
 * @method qc.Sprite#isPaused
 */
Sprite.prototype.isPaused = function() {
    switch (this.animationType) {
    case qc.Sprite.FRAME_ANIMATION :
    case qc.Sprite.FRAME_SAMPLES :
        if (!this.phaser.animations.currentAnim) return false;
        return this.phaser.animations.paused;
    case qc.Sprite.DRAGON_BONES :
        return this._paused;
    default :
        return false;
    }
};

/**
 * @hackpp
 * 此处 hack phaser 的 set frame 方法，因为 phaesr 播放帧动画时候，调用
 * setFrame 方法，而我们希望其对应的 frame 大小应该是我们在 inspector 中设置
 * 的 width/height，故 hack 后多做一些事情
 */
var setFrame = function (frame) {
    var sprite = this._qc;

    // 原有方法调用
    sprite._phaserImageSetFrame.call(this, frame);

    // 非骨骼动画，set frame 之后，做一下 setWidth/setHeight 方法
    if (sprite.animationType !== qc.Sprite.DRAGON_BONES) {
        sprite.setWidth(sprite.width);
        sprite.setHeight(sprite.height);
    }
};


var _spriteWebGLAddQuad = function(spriteBatch, sprite, w0, h0, w1, h1, w2, h2, w3, h3, uvx0, uvy0, uvx1, uvy1, a, b, c, d, tx, ty, tint) {
    if(spriteBatch.currentBatchSize >= spriteBatch.size)
    {
        spriteBatch.flush();
        spriteBatch.currentBaseTexture = sprite.texture.baseTexture;
    }

    var colors = spriteBatch.colors;
    var positions = spriteBatch.positions;
    var index = spriteBatch.currentBatchSize * 4 * spriteBatch.vertSize;

    if(spriteBatch.renderSession.roundPixels)
    {
        positions[index] = a * w0 + c * h0 + tx | 0;
        positions[index+1] = d * h0 + b * w0 + ty | 0;
        positions[index+5] = a * w1 + c * h1 + tx | 0;
        positions[index+6] = d * h1 + b * w1 + ty | 0;
        positions[index+10] = a * w2 + c * h2 + tx | 0;
        positions[index+11] = d * h2 + b * w2 + ty | 0;
        positions[index+15] = a * w3 + c * h3 + tx | 0;
        positions[index+16] = d * h3 + b * w3 + ty | 0;
    }
    else
    {
        positions[index] = a * w0 + c * h0 + tx;
        positions[index+1] = d * h0 + b * w0 + ty;
        positions[index+5] = a * w1 + c * h1 + tx;
        positions[index+6] = d * h1 + b * w1 + ty;
        positions[index+10] = a * w2 + c * h2 + tx;
        positions[index+11] = d * h2 + b * w2 + ty;
        positions[index+15] = a * w3 + c * h3 + tx;
        positions[index+16] = d * h3 + b * w3 + ty;
    }

    positions[index+2] = uvx0;
    positions[index+3] = uvy0;
    positions[index+7] = uvx1;
    positions[index+8] = uvy0;
    positions[index+12] = uvx1;
    positions[index+13] = uvy1;
    positions[index+17] = uvx0;
    positions[index+18] = uvy1;

    colors[index+4] = colors[index+9] = colors[index+14] = colors[index+19] = tint;

    // increment the batchsize
    spriteBatch.sprites[spriteBatch.currentBatchSize++] = sprite;

};

/**
 * hack sprite 的 _renderWebGL 方法为了让骨骼动画的根节点不显示
 * @hackpp
 */
var spriteRenderWebGL = function(renderSession) {
    var _qc = this._qc;
    var animationType = _qc.animationType;

    if (animationType === qc.Sprite.FRAME_SAMPLES) {
        if (!this.visible || this.alpha <= 0 || !this.renderable) return;
        if (!this.animations.currentAnim) return;
        var spriteBatch = renderSession.spriteBatch;
        var sprite = this;

        var frameIndex = this.animations.currentAnim._frameIndex;

        var animationData = _qc.texture.atlas.animation.data;
        var uvs = animationData.uvs;
        var lastAnimationName = _qc.lastAnimationName;
        var lastAnimationInfo = _qc._animation[lastAnimationName];
        var curAnimationFrames = lastAnimationInfo.frames;
        var texture = sprite.texture;
        var resolution = texture.baseTexture.resolution;
        var worldTransform = sprite.worldTransform;
        var sa = worldTransform.a / resolution;
        var sb = worldTransform.b / resolution;
        var sc = worldTransform.c / resolution;
        var sd = worldTransform.d / resolution;
        var stx = worldTransform.tx;
        var sty = worldTransform.ty;
        var tint = sprite.tint;
        var parentAlpha = sprite.parent.worldAlpha * sprite.alpha;
        var last = lastAnimationInfo.last;
        var ibegin, uvbegin, ibegin2, uvmap;

        // 处理 tint（alpha后续不同部位都不同，需要单独处理）
        tint = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16);

        var intIndex = -1;
        var id1, id2;
        var convert;
        var dealCacheList;

        // 处理帧的预处理缓存
        if (!animationData.convert) animationData.convert = {};
        if (!animationData.convert[lastAnimationName])
            animationData.convert[lastAnimationName] = convert = new Array(curAnimationFrames.length);
        else
            convert = animationData.convert[lastAnimationName];

        if ((frameIndex & 0x7) === 0) {
            intIndex = (frameIndex >> 3);
            if (!convert[intIndex]) dealCacheList = [intIndex];
        }
        else if (frameIndex === last - 1) {
            intIndex = (frameIndex >> 3) + 1;
            if (!convert[intIndex]) dealCacheList = [intIndex];
        }
        else {
            id1 = frameIndex >> 3;
            id2 = id1 + 1;
            if (!convert[id1] && !convert[id2]) dealCacheList = [ id1, id2 ];
            else if (!convert[id1]) dealCacheList = [ id1 ];
            else if (!convert[id2]) dealCacheList = [ id2 ];
        }

        var dw0, dh0, dw1, dh1, dw2, dh2, dw3, dh3;
        var alpha;

        if (dealCacheList) {
            var width = sprite.texture.baseTexture.width;
            var height = sprite.texture.baseTexture.height;
            var uvmax= uvs.length >> 2;
            for (var dealIndex = 0, dealLen = dealCacheList.length; dealIndex < dealLen; dealIndex++) {
                var dealID = dealCacheList[dealIndex];
                var frameData = curAnimationFrames[dealID];
                if (!frameData) {
                    console.log(dealID, dealCacheList);
                    continue;
                }
                uvmap = new Array(uvmax);
                for (var i = 0, len = frameData.length / 10; i < len; i++) {
                    ibegin = i * 10;
                    uvbegin = frameData[ibegin] * 4;
                    uvmap[uvbegin] = i;

                    var la = frameData[ibegin + 1];
                    var lb = frameData[ibegin + 2];
                    var lc = frameData[ibegin + 3];
                    var ld = frameData[ibegin + 4];
                    var ltx = frameData[ibegin + 5];
                    var lty = frameData[ibegin + 6];
                    var px = frameData[ibegin + 7];
                    var py = frameData[ibegin + 8];
                    var lw = (uvs[uvbegin + 2] - uvs[uvbegin]) * width;
                    var lh = (uvs[uvbegin + 3] - uvs[uvbegin + 1]) * height;

                    // 定位点
                    var w0 = lw * -px;
                    var h0 = lh * -py;
                    var w1 = lw * (1 - px);
                    var h1 = lh * (1 - py);

                    frameData[ibegin + 1] = la * w0 + lc * h0 + ltx;
                    frameData[ibegin + 2] = lb * w0 + ld * h0 + lty;
                    frameData[ibegin + 3] = la * w1 + lc * h0 + ltx;
                    frameData[ibegin + 4] = lb * w1 + ld * h0 + lty;
                    frameData[ibegin + 5] = la * w1 + lc * h1 + ltx;
                    frameData[ibegin + 6] = lb * w1 + ld * h1 + lty;
                    frameData[ibegin + 7] = la * w0 + lc * h1 + ltx;
                    frameData[ibegin + 8] = lb * w0 + ld * h1 + lty;
                }

                animationData.convert[lastAnimationName][dealID] = true;
                if (!animationData.uvmap) animationData.uvmap = {};
                if (!animationData.uvmap[lastAnimationName]) animationData.uvmap[lastAnimationName] = {};
                animationData.uvmap[lastAnimationName][dealID] = uvmap;
            }
        }

        if (intIndex >= 0)
        {
            // 不需要进行插值的显示
            var frameData = curAnimationFrames[intIndex];
            for (var i = 0, len = frameData.length / 10; i < len; i++) {
                ibegin = i * 10;
                uvbegin = frameData[ibegin] * 4;

                dw0 = frameData[ibegin + 1];
                dh0 = frameData[ibegin + 2];
                dw1 = frameData[ibegin + 3];
                dh1 = frameData[ibegin + 4];
                dw2 = frameData[ibegin + 5];
                dh2 = frameData[ibegin + 6];
                dw3 = frameData[ibegin + 7];
                dh3 = frameData[ibegin + 8];

                alpha = frameData[ibegin + 9];

                _spriteWebGLAddQuad(spriteBatch, sprite,
                    dw0, dh0, dw1, dh1, dw2, dh2, dw3, dh3,
                    uvs[uvbegin],
                    uvs[uvbegin + 1],
                    uvs[uvbegin + 2],
                    uvs[uvbegin + 3],
                    sa, sb, sc, sd, stx, sty,
                    tint + ((alpha * parentAlpha) << 24));
            }
        }
        else {
            // 本帧需要进行线性插值
            var co = (frameIndex - (id1 << 3)) / (id2 === last ? last - (id1 << 3) : 8);

            var frameData = curAnimationFrames[id1];
            var frameData2 = curAnimationFrames[id2];
            var uvmap = animationData.uvmap[lastAnimationName][id2];
            for (var i = 0, len = frameData.length / 10; i < len; i++) {
                ibegin = i * 10;
                uvbegin = frameData[ibegin] * 4;
                ibegin2 = uvmap[uvbegin] * 10;
                if (isNaN(ibegin2)) {
                    // 这个节点在下个动作帧中无法找到，就不进行插值了
                    dw0 = frameData[ibegin + 1];
                    dh0 = frameData[ibegin + 2];
                    dw1 = frameData[ibegin + 3];
                    dh1 = frameData[ibegin + 4];
                    dw2 = frameData[ibegin + 5];
                    dh2 = frameData[ibegin + 6];
                    dw3 = frameData[ibegin + 7];
                    dh3 = frameData[ibegin + 8];
                    alpha = frameData[ibegin + 9];
                }
                else {
                    // 进行现行插值
                    dw0 = frameData[ibegin + 1];
                    dh0 = frameData[ibegin + 2];
                    dw1 = frameData[ibegin + 3];
                    dh1 = frameData[ibegin + 4];
                    dw2 = frameData[ibegin + 5];
                    dh2 = frameData[ibegin + 6];
                    dw3 = frameData[ibegin + 7];
                    dh3 = frameData[ibegin + 8];
                    alpha = frameData[ibegin + 9];
                    dw0 = dw0 + (frameData2[ibegin2 + 1] - dw0) * co;
                    dh0 = dh0 + (frameData2[ibegin2 + 2] - dh0) * co;
                    dw1 = dw1 + (frameData2[ibegin2 + 3] - dw1) * co;
                    dh1 = dh1 + (frameData2[ibegin2 + 4] - dh1) * co;
                    dw2 = dw2 + (frameData2[ibegin2 + 5] - dw2) * co;
                    dh2 = dh2 + (frameData2[ibegin2 + 6] - dh2) * co;
                    dw3 = dw3 + (frameData2[ibegin2 + 7] - dw3) * co;
                    dh3 = dh3 + (frameData2[ibegin2 + 8] - dh3) * co;
                    alpha = alpha + (frameData2[ibegin2 + 9] - alpha) * co;
                }

                _spriteWebGLAddQuad(spriteBatch, sprite,
                    dw0, dh0, dw1, dh1, dw2, dh2, dw3, dh3,
                    uvs[uvbegin],
                    uvs[uvbegin + 1],
                    uvs[uvbegin + 2],
                    uvs[uvbegin + 3],
                    sa, sb, sc, sd, stx, sty,
                    tint + ((alpha * parentAlpha) << 24));
            }
        }

        return PIXI.DisplayObjectContainer.prototype._renderWebGL.call(this, renderSession);

    }
    else if (animationType === qc.Sprite.DRAGON_BONES && _qc._armature) {
        // 骨骼动画
        return PIXI.DisplayObjectContainer.prototype._renderWebGL.call(this, renderSession);
    }
    else {
        // 普通动画
        return Phaser.Sprite.prototype._renderWebGL.call(this, renderSession);
    }
};

/**
 * hack sprite 的 _renderCanva 方法为了让骨骼动画的根节点不显示
 * @hackpp
 */
var spriteRenderCanvas = function(renderSession) {
    var _qc = this._qc;
    var animationType = _qc.animationType;

    if (animationType === qc.Sprite.FRAME_SAMPLES) {
        if (this.visible === false || this.alpha === 0 || this.renderable === false || this.texture.crop.width <= 0 || this.texture.crop.height <= 0) return;
        if (!this.animations.currentAnim) return;

        var context = renderSession.context;

        if (this.blendMode !== renderSession.currentBlendMode)
        {
            renderSession.currentBlendMode = this.blendMode;
            context.globalCompositeOperation = PIXI.blendModesCanvas[renderSession.currentBlendMode];
        }
        if (this._mask) renderSession.maskManager.pushMask(this._mask, renderSession);

        //  Ignore null sources
        if (this.texture.valid)
        {
            var resolution = this.texture.baseTexture.resolution / renderSession.resolution;

            //  If smoothingEnabled is supported and we need to change the smoothing property for this texture
            ////---- Hackpp here resize 时 context 中的平滑属性会被变更，需要重新设置
            if (renderSession.smoothProperty &&
                (renderSession.scaleMode !== this.texture.baseTexture.scaleMode ||
                context[renderSession.smoothProperty] !== (renderSession.scaleMode === PIXI.scaleModes.LINEAR))) {
                renderSession.scaleMode = this.texture.baseTexture.scaleMode;
                context[renderSession.smoothProperty] = (renderSession.scaleMode === PIXI.scaleModes.LINEAR);
            }

            var texture;
            var width = this.texture.baseTexture.width;
            var height = this.texture.baseTexture.height;

            if (this.tint !== 0xFFFFFF) {
                if (this.cachedTint !== this.tint) {
                    this.cachedTint = this.tint;
                    var crop = this.texture.crop;
                    var cx = crop.x;
                    var cy = crop.y;
                    var cw = crop.width;
                    var ch = crop.height;
                    crop.x = 0;
                    crop.y = 0;
                    crop.width = width;
                    crop.height = height;
                    this.tintedTexture = PIXI.CanvasTinter.getTintedTexture(this, this.tint);
                    crop.x = cx;
                    crop.y = cy;
                    crop.width = cw;
                    crop.height = ch;
                }
                texture = this.tintedTexture;
            }
            else {
                texture = this.texture.baseTexture.source;
            }

            var sprite = this;
            var frameIndex = this.animations.currentAnim._frameIndex;
            var animationData = _qc.texture.atlas.animation.data;
            var uvs = animationData.uvs;
            var lastAnimationName = _qc.lastAnimationName;
            var curAnimationFrames = _qc._animation[lastAnimationName].frames;
            var imageResolution = sprite.texture.baseTexture.resolution;
            var worldTransform = sprite.worldTransform;
            var sa = worldTransform.a / imageResolution;
            var sb = worldTransform.b / imageResolution;
            var sc = worldTransform.c / imageResolution;
            var sd = worldTransform.d / imageResolution;
            var stx = worldTransform.tx;
            var sty = worldTransform.ty;
            var last = _qc._animation[lastAnimationName].last;
            var intIndex, id1, id2, convert, uvmap, frameData, frameData2, co, ibegin, uvbegin, ibegin2;

            if ((frameIndex & 0x7) === 0) {
                intIndex = (frameIndex >> 3);
                frameData = curAnimationFrames[intIndex];
            }
            else if (frameIndex === last - 1) {
                intIndex = (frameIndex >> 3) + 1;
                frameData = curAnimationFrames[intIndex];
            }
            else {
                id1 = frameIndex >> 3;
                id2 = id1 + 1;

                // 需要根据前后帧进行插值
                frameData = curAnimationFrames[id1];
                frameData2 = curAnimationFrames[id2];

                co = (frameIndex - (id1 << 3)) / (id2 === last ? last - (id1 << 3) : 8);

                // 需确保 id2 对应的 uvmap 已存在
                if (!animationData.uvmap) animationData.uvmap = {};
                if (!animationData.uvmap[lastAnimationName])
                    animationData.uvmap[lastAnimationName] = convert = new Array(curAnimationFrames.length);
                else
                    convert = animationData.uvmap[lastAnimationName];

                if (!convert[id2]) {
                    var uvmax= uvs.length >> 2;
                    uvmap = new Array(uvmax);
                    frameData2 = curAnimationFrames[id2];
                    for (var i = 0, len = frameData2.length / 10; i < len; i++) {
                        uvbegin = frameData2[i * 10] * 4;
                        uvmap[uvbegin] = i;
                    }
                    convert[id2] = uvmap;
                }
                else
                    uvmap = convert[id2];
            }

            var palpha = this.parent.worldAlpha * sprite.alpha;

            for (var i = 0, len = frameData.length / 10; i < len; i++) {
                ibegin = i * 10;
                uvbegin = frameData[ibegin] * 4;

                var la = frameData[ibegin + 1];
                var lb = frameData[ibegin + 2];
                var lc = frameData[ibegin + 3];
                var ld = frameData[ibegin + 4];
                var ltx = frameData[ibegin + 5];
                var lty = frameData[ibegin + 6];
                var px = frameData[ibegin + 7];
                var py = frameData[ibegin + 8];
                var ialpha = frameData[ibegin + 9];

                // 考虑线性插值
                if (id2) {
                    ibegin2 = uvmap[uvbegin] * 10;
                    if (!isNaN(ibegin2)) {
                        la = la + (frameData2[ibegin2 + 1] - la) * co;
                        lb = lb + (frameData2[ibegin2 + 2] - lb) * co;
                        lc = lc + (frameData2[ibegin2 + 3] - lc) * co;
                        ld = ld + (frameData2[ibegin2 + 4] - ld) * co;
                        ltx = ltx + (frameData2[ibegin2 + 5] - ltx) * co;
                        lty = lty + (frameData2[ibegin2 + 6] - lty) * co;
                        px = px + (frameData2[ibegin2 + 7] - px) * co;
                        py = py + (frameData2[ibegin2 + 8] - py) * co;
                        ialpha = ialpha + (frameData2[ibegin2 + 9] - ialpha) * co;
                    }
                }

                var uv0 = uvs[uvbegin] * width;
                var uv1 = uvs[uvbegin + 1] * height;
                var uv2 = uvs[uvbegin + 2] * width;
                var uv3 = uvs[uvbegin + 3] * height;

                var fa = la * sa + lb * sc;
                var fb = la * sb + lb * sd;
                var fc = lc * sa + ld * sc;
                var fd = lc * sb + ld * sd;
                var ftx = (ltx * sa + lty * sc + stx) * renderSession.resolution;
                var fty = (ltx * sb + lty * sd + sty) * renderSession.resolution;

                var frameWidth = uv2 - uv0;
                var frameHeight = uv3 - uv1;

                // 定位点
                var dx = frameWidth * -px;
                var dy = frameHeight * -py;

                // 设置矩阵
                if (renderSession.roundPixels) {
                    context.setTransform(fa, fb, fc, fd, ftx | 0, fty | 0);
                    dx = dx | 0;
                    dy = dy | 0;
                }
                else {
                    context.setTransform(fa, fb, fc, fd, ftx, fty);
                }

                // 绘制图形
                context.globalAlpha = palpha * (ialpha / 255);
                context.drawImage(texture,
                    uv0, uv1, frameWidth, frameHeight,
                    dx / resolution, dy / resolution, frameWidth / resolution, frameHeight / resolution);
            }
        }

        // OVERWRITE
        var children = this.children;
        for (var i = 0; i < children.length; i++)
        {
            children[i]._renderCanvas(renderSession);
        }

        if (this._mask)
        {
            renderSession.maskManager.popMask(renderSession);
        }
    }
    else if (animationType === qc.Sprite.DRAGON_BONES && _qc._armature) {
        // 骨骼动画
        return PIXI.DisplayObjectContainer.prototype._renderCanvas.call(this, renderSession);
    }
    else {
        // 普通动画
        return Phaser.Sprite.prototype._renderCanvas.call(this, renderSession);
    }
};

/**
 * 获取帧采样动画的 bounds
 */
Sprite.prototype.getSampledAnimationBounds = function() {
    var animationType = this.animationType;

    // 其他类型返回无效
    if (animationType !== qc.Sprite.FRAME_SAMPLES)
        return new qc.Rectangle(0, 0, 0, 0);

    // 获取动作的基本信息
    var animationName = this.lastAnimationName;
    if (!animationName)
        return new qc.Rectangle(0, 0, 0, 0);

    var animationData = this.texture.atlas.animation.data;
    var boundsData = animationData.bounds;

    if (!boundsData)
        boundsData = animationData.bounds = {};

    // 是否已经计算过并记录下来
    var bounds = boundsData[animationName];
    if (bounds) return bounds;

    var uvs = animationData.uvs;
    var width = this.phaser.texture.baseTexture.width;
    var height = this.phaser.texture.baseTexture.height;
    var animationInfo = this._animation[animationName];
    var convertInfo = animationData.convert ? (animationData.convert[animationName] || {}) : {};

    var frameID, frameCount, frameData;
    var i, len, convert;
    var ibegin, uvbegin;
    var la, lb, lc, ld, ltx, lty, px, py, lw, lh, w0, h0, w1, h1;
    var x1, x2, x3, x4, y1, y2, y3, y4;

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (frameID = 0, frameCount = animationInfo.frames.length; frameID < frameCount; frameID++) {
        frameData = animationInfo.frames[frameID];
        convert = convertInfo[frameID];

        for (i = 0, len = frameData.length / 10; i < len; i++) {
            ibegin = i * 10;
            uvbegin = frameData[ibegin] * 4;

            if (!convert) {
                la = frameData[ibegin + 1];
                lb = frameData[ibegin + 2];
                lc = frameData[ibegin + 3];
                ld = frameData[ibegin + 4];
                ltx = frameData[ibegin + 5];
                lty = frameData[ibegin + 6];
                px = frameData[ibegin + 7];
                py = frameData[ibegin + 8];
                lw = (uvs[uvbegin + 2] - uvs[uvbegin]) * width;
                lh = (uvs[uvbegin + 3] - uvs[uvbegin + 1]) * height;

                // 定位点
                w0 = lw * -px;
                h0 = lh * -py;
                w1 = lw * (1 - px);
                h1 = lh * (1 - py);

                x1 = la * w0 + lc * h0 + ltx, y1 = lb * w0 + ld * h0 + lty;
                x2 = la * w1 + lc * h0 + ltx, y2 = lb * w1 + ld * h0 + lty;
                x3 = la * w1 + lc * h1 + ltx, y3 = lb * w1 + ld * h1 + lty;
                x4 = la * w0 + lc * h1 + ltx, y4 = lb * w0 + ld * h1 + lty;
            }
            else {
                x1 = frameData[ibegin + 1], y1 = frameData[ibegin + 2];
                x2 = frameData[ibegin + 3], y2 = frameData[ibegin + 4];
                x3 = frameData[ibegin + 5], y3 = frameData[ibegin + 6];
                x4 = frameData[ibegin + 7], y4 = frameData[ibegin + 8];
            }

            minX = Math.min(minX, x1, x2, x3, x4);
            maxX = Math.max(maxX, x1, x2, x3, x4);
            minY = Math.min(minY, y1, y2, y3, y4);
            maxY = Math.max(maxY, y1, y2, y3, y4);
        }
    }

    // 设置并存储
    bounds = boundsData[animationName] = new qc.Rectangle(minX, minY, maxX - minX, maxY - minY);
    return bounds;
};

/**
 * 设置节点的宽度
 * @protected
 * @override
 */
Sprite.prototype.setWidth = function(w) {
    Node.prototype.setWidth.call(this, w);
    if (!this.phaser.texture.trim) {
        this.phaser.texture.frame.width = w;
    }
};

/**
 * 设置节点的高度
 * @protected
 * @override
 */
Sprite.prototype.setHeight = function(h) {
    Node.prototype.setHeight.call(this, h);
    if (!this.phaser.texture.trim) {
        this.phaser.texture.frame.height = h;
    }
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
Sprite.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加UIImage需要序列化的内容
    json.texture = s.TEXTURE;
    json.frame = s.AUTO;
    json.defaultAnimation = s.STRING;

    return json;
};
