var dragonBones;
(function (dragonBones) {
    (function (display) {
        var QcDisplayBridge = (function () {
            function QcDisplayBridge() {
            }

            QcDisplayBridge.prototype.getVisible = function () {
                return this._display ? this._display.visible : false
            };
            QcDisplayBridge.prototype.setVisible = function (value) {
                if (this._display) {
                    this._display.visible = value
                }
            };
            QcDisplayBridge.prototype.getDisplay = function () {
                return this._display
            };
            QcDisplayBridge.prototype.setDisplay = function (value) {
                if (this._display == value) {
                    return
                }
                var index = -1;
                if (this._display) {
                    var parent = this._display.parent;
                    if (parent) {
                        index = this._display.parent.children.indexOf(this._display);
                    }
                    this.removeDisplay()
                }
                this._display = value;
                this.addDisplay(parent, index)
            };
            QcDisplayBridge.prototype.dispose = function () {
                this._display = null
            };
            QcDisplayBridge.prototype.updateTransform = function (matrix, transform) {
                // apply the matrix to the qc game display object
                this._display.x = matrix.tx;
                this._display.y = matrix.ty;
                this._display.skewX = transform.skewX;
                this._display.skewY = transform.skewY;
                this._display.scaleX = transform.scaleX;
                this._display.scaleY = transform.scaleY;
            };
            QcDisplayBridge.prototype.updateColor = function (aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier) {
                if (this._display) {
                    this._display.alpha = aMultiplier
                }
            };
            QcDisplayBridge.prototype.addDisplay = function (container, index) {
                var parent = container;
                if (parent && this._display) {
                    if (index < 0 || typeof index === "undefined") {
                        if (this._display.parent === parent)
                            parent.removeChild(this._display);
                        parent.addChild(this._display)
                    } else {
                        parent.addChildAt(this._display, Math.min(index, parent.children.length))
                    }
                }
            };
            QcDisplayBridge.prototype.removeDisplay = function () {
                if (this._display && this._display.parent) {
                    this._display.parent.removeChild(this._display)
                }
            };
            QcDisplayBridge.RADIAN_TO_ANGLE = 180 / Math.PI;
            return QcDisplayBridge
        })();
        display.QcDisplayBridge = QcDisplayBridge
    })(dragonBones.display || (dragonBones.display = {}));
    var display = dragonBones.display;
    (function (textures) {
        var QcBonesAtlas = (function () {
            function QcBonesAtlas(image, textureAtlasRawData, scale) {
                if (typeof scale === "undefined") {
                    scale = 1
                }
                this._regions = {};
                this.image = image;
                this.scale = scale;
                this.atlasId = textureAtlasRawData.atlasId;
                this.parseData(textureAtlasRawData)
            }

            QcBonesAtlas.prototype.dispose = function () {
                this.image = null;
                this._regions = null
            };
            QcBonesAtlas.prototype.getRegion = function (subTextureName) {
                return this._regions[subTextureName]
            };
            QcBonesAtlas.prototype.parseData = function (textureAtlasRawData) {
                var textureAtlasData = dragonBones.objects.DataParser.parseTextureAtlasData(textureAtlasRawData, this.scale);
                this.name = textureAtlasData.__name;
                delete textureAtlasData.__name;
                for (var subTextureName in textureAtlasData) {
                    this._regions[subTextureName] = textureAtlasData[subTextureName]
                }
            };
            return QcBonesAtlas
        })();
        textures.QcBonesAtlas = QcBonesAtlas
    })(dragonBones.textures || (dragonBones.textures = {}));
    var textures = dragonBones.textures;
    (function (factorys) {
        var QcBonesFactory = (function (_super) {
            __extends(QcBonesFactory, _super);
            function QcBonesFactory() {
                _super.call(this)
            }

            QcBonesFactory.prototype._generateArmature = function (armatureName) {
                var display = new qc.Node(new Phaser.Group(dragonBones.game, null));
                var armature = new dragonBones.Armature(display);
                display.name = armatureName;
                display._bone = true;
                return armature
            };
            QcBonesFactory.prototype._generateSlot = function () {
                var slot = new dragonBones.Slot(new display.QcDisplayBridge());
                return slot
            };
            QcBonesFactory.prototype._generateDisplay = function (textureAtlas, frameName, pivotX, pivotY) {
                // 创建一个贴图
                var image = new qc.UIImage(dragonBones.game._qc);

                // 载入对应的帧
                var imgName = textureAtlas.atlasId;
                image.texture = image.game.assets.find(imgName);
                image.frame = frameName;
                image.name = frameName;
                image._bone = true;
                image.resetNativeSize();

                // 设置旋转轴
                image.pivotX = pivotX / image.width;
                image.pivotY = pivotY / image.height;

                if (image.parent) {
                    image.parent.removeChild(image);
                }
                return image;
            };
            return QcBonesFactory
        })(factorys.BaseFactory);
        factorys.QcBonesFactory = QcBonesFactory
    })(dragonBones.factorys || (dragonBones.factorys = {}));
    var factorys = dragonBones.factorys
})(dragonBones || (dragonBones = {}));

//----------------------------------

/**
 * 将 DragonBone 的格式转换为 Phaser 接受的格式，用于驱动 frameData
 */
dragonBones.CoverAtlas = function(atlasJson) {
    var frames;
    var atlas = {
        'meta' : { 'image' : atlasJson.imagePath },
        'frames' : frames = {}
    };

    // 往 frames 填充内容
    var textures = atlasJson.SubTexture;
    var len = textures.length;
    var frameData;
    for (var i = 0; i < len; i++) {
        frameData = textures[i];
        frames[frameData.name] = {
            "filename" : frameData.name,
            "frame" : { "x" : frameData.x, "y" : frameData.y, "w" : frameData.width, "h" : frameData.height },
            "rotated": false,
            "trimmed": false,
            "spriteSourceSize": { "x" : 0, "y" : 0, "w" : frameData.width, "h" : frameData.height },
            "sourceSize": { "w" : frameData.width, "h" : frameData.height }
        };
    }

    return atlas;
};

/**
 * 工具类，寻找一块骨骼节点
 */
dragonBones.findArmature = function(skeleton) {
    return skeleton.armature[0].name;
};

/**
 * 工具类，用于创建骨骼
 */
dragonBones.makeQcArmature = function(skeletonData, atlasJson, texture, key) {
    // 图片的关联需要修改下
    atlasJson.name = key;
    skeletonData.name = key;
    var textureData = atlasJson;
    textureData.atlasId = textureData.name;// set the is

    // 创建工厂，提供骨骼、贴图信息
    var factory = new dragonBones.factorys.QcBonesFactory();
    factory.addSkeletonData(dragonBones.objects.DataParser.parseSkeletonData(skeletonData));

    var atlas = new dragonBones.textures.QcBonesAtlas(texture, textureData);
    factory.addTextureAtlas(atlas);

    // 生成骨骼网络
    var armature = factory.buildArmature(dragonBones.findArmature(skeletonData));

    // 加入到时钟中开始供驱动
    // dragonBones.animation.WorldClock.clock.add(armature);

    return armature;
};

// 将命名空间注册到qc中供全局访问
qc.dragonBones = dragonBones;

// 插件方式，注册dragonBones的game元素以及驱动Update
qc.dragonBonesDriver = function(game, parent) {
    qc.dragonBones.game = game;
};
qc.dragonBonesDriver.prototype = {
    update : function() {
        // qc.dragonBones.animation.WorldClock.clock.advanceTime(0.02);
    }
};
qc.dragonBonesDriver.prototype.constructor = qc.dragonBonesDriver;
