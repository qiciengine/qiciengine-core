var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dragonBones;
(function (dragonBones) {
    (function (display) {
        var PixiDisplayBridge = (function () {
            function PixiDisplayBridge() {
            }
            PixiDisplayBridge.prototype.getVisible = function () {
                return this._display ? this._display.visible : false;
            };
            PixiDisplayBridge.prototype.setVisible = function (value) {
                if (this._display) {
                    this._display.visible = value;
                }
            };

            PixiDisplayBridge.prototype.getDisplay = function () {
                return this._display;
            };
            PixiDisplayBridge.prototype.setDisplay = function (value) {
                if (this._display == value) {
                    return;
                }
                var index = -1;
                if (this._display) {
                    var parent = this._display.parent;
                    if (parent) {
                        index = this._display.parent.children.indexOf(this._display);
                    }
                    this.removeDisplay();
                }
                this._display = value;
                this.addDisplay(parent, index);
            };

            PixiDisplayBridge.prototype.dispose = function () {
                this._display = null;
            };

            PixiDisplayBridge.prototype.updateTransform = function (matrix, transform) {
                this._display.x = matrix.tx;
                this._display.y = matrix.ty;
                this._display.rotation = transform.skewX;
                this._display.scale.x = transform.scaleX;
                this._display.scale.y = transform.scaleY;
            };

            PixiDisplayBridge.prototype.updateColor = function (aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier) {
                if (this._display) {
                    this._display.alpha = aMultiplier;
                }
            };

            PixiDisplayBridge.prototype.addDisplay = function (container, index) {
                var parent = container;
                if (parent && this._display) {
                    if (index < 0) {
                        parent.addChild(this._display);
                    } else {
                        parent.addChildAt(this._display, Math.min(index, parent.children.length));
                    }
                }
            };

            PixiDisplayBridge.prototype.removeDisplay = function () {
                if (this._display && this._display.parent) {
                    this._display.parent.removeChild(this._display);
                }
            };
            PixiDisplayBridge.RADIAN_TO_ANGLE = 180 / Math.PI;
            return PixiDisplayBridge;
        })();
        display.PixiDisplayBridge = PixiDisplayBridge;
    })(dragonBones.display || (dragonBones.display = {}));
    var display = dragonBones.display;

    (function (textures) {
        var PixiTextureAtlas = (function () {
            function PixiTextureAtlas(image, textureAtlasRawData, scale) {
                if (typeof scale === "undefined") { scale = 1; }
                this._regions = {};

                this.image = image;
                this.scale = scale;

                this.parseData(textureAtlasRawData);
            }
            PixiTextureAtlas.prototype.dispose = function () {
                this.image = null;
                this._regions = null;
            };

            PixiTextureAtlas.prototype.getRegion = function (subTextureName) {
                return this._regions[subTextureName];
            };

            PixiTextureAtlas.prototype.parseData = function (textureAtlasRawData) {
                var textureAtlasData = dragonBones.objects.DataParser.parseTextureAtlasData(textureAtlasRawData, this.scale);
                this.name = textureAtlasData.__name;
                delete textureAtlasData.__name;

                for (var subTextureName in textureAtlasData) {
                    this._regions[subTextureName] = textureAtlasData[subTextureName];
                }
            };
            return PixiTextureAtlas;
        })();
        textures.PixiTextureAtlas = PixiTextureAtlas;
    })(dragonBones.textures || (dragonBones.textures = {}));
    var textures = dragonBones.textures;

    (function (factorys) {
        var PixiFactory = (function (_super) {
            __extends(PixiFactory, _super);
            function PixiFactory() {
                _super.call(this);
            }
            PixiFactory.prototype._generateArmature = function () {
                var armature = new dragonBones.Armature(new PIXI.DisplayObjectContainer());
                return armature;
            };

            PixiFactory.prototype._generateSlot = function () {
                var slot = new dragonBones.Slot(new display.PixiDisplayBridge());
                return slot;
            };

            PixiFactory.prototype._generateDisplay = function (textureAtlas, fullName, pivotX, pivotY) {
                var texture = PIXI.Texture.fromFrame(fullName + ".png");
                //pixi sprite
                var image = new PIXI.Sprite(texture);
                image.pivot.x = pivotX;
                image.pivot.y = pivotY;
                //
               return image;
            };
            return PixiFactory;
        })(factorys.BaseFactory);
        factorys.PixiFactory = PixiFactory;
    })(dragonBones.factorys || (dragonBones.factorys = {}));
    var factorys = dragonBones.factorys;
})(dragonBones || (dragonBones = {}));

/*
 generate a dragonbones atlas out of a TexturePacker JSONArray or Hash format atlas
 */
dragonBones.parseJSONAtlas = function(atlasJson,name,partsList){
    var bonesAtlas = {};
    bonesAtlas.name = name;
    bonesAtlas.SubTexture = [];

    var n = partsList.length;

    var subTextures = atlasJson.frames;

    var isArray = Array.isArray(subTextures);
    var k = 0;
    if(isArray) k = subTextures.length;
    //
    var partName;
    var txData;
    var filename;
    var hasExtension;

    function createFrame(txData, p_partName){
        var frame = txData.frame;
        //make a subTexture
        var subTexture = {name:p_partName};
        subTexture.x = frame.x;
        subTexture.y = frame.y;
        subTexture.width = frame.w;
        subTexture.height = frame.h;
        //
        bonesAtlas.SubTexture[i] = subTexture;
    }

    for(var i = 0; i < n; i++){
        partName = partsList[i];
        hasExtension = partName.match(/.png/i) !== null;
        if(hasExtension){
            filename = partName;
            partName = filename.substr(-4);
        } else {
            filename = partName + ".png";
        }
        //find the subtexture
        if(isArray){
            for(var j = 0; j < k; j++){
                txData = subTextures[j];
                if(txData.filename == filename){
                    createFrame(txData, partName);
                    break;
                }
            }
        } else {
            for(var s in subTextures){
                if(s == filename){
                    createFrame(subTextures[s], partName);
                    break;
                }
            }
        }
    }
    return bonesAtlas;
};


dragonBones.makeArmaturePIXI = function(config, skeletonJSON, atlasJson, texture){
   // var skeletonData = ninja_pig.bones[skeleton];
    var skeletonId = config.skeletonId;
    var armatureName = config.armatureName;
    var animationId = config.animationId;
    var partsList = config.partsList;
    var textureData = dragonBones.parseJSONAtlas(atlasJson,skeletonId,partsList);

    var factory = new dragonBones.factorys.PixiFactory();
    factory.addSkeletonData(dragonBones.objects.DataParser.parseSkeletonData(skeletonJSON));
    //console.log("factory: "+factory);
    var atlas = new dragonBones.textures.PixiTextureAtlas(texture, textureData);
    //console.log("atlas: "+atlas);
    factory.addTextureAtlas(atlas);
    var armature = factory.buildArmature(armatureName,animationId,skeletonId);
    //updateAnimation();
    dragonBones.animation.WorldClock.clock.add(armature);
    
    armature.animation.gotoAndPlay(animationId, 0.2);

    return armature;
}