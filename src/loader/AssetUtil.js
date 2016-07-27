/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 资源的工具接口
 * @internal
 */
var AssetUtil = qc.AssetUtil = {
    /**
     * 几种资源类型，在meta文件中需要指明
     */
    ASSET_SCENE  : 1,
    ASSET_PREFAB : 2,
    ASSET_ATLAS  : 3,
    ASSET_TEXT   : 4,
    ASSET_FONT   : 5,
    ASSET_SOUND  : 6,
    ASSET_EXCEL  : 7,
    ASSET_WEBFONT : 8,
    ASSET_ACTION : 9,
    ASSET_ACTIONMANAGER : 10,
    ASSET_TS     : 99,
    ASSET_JS     : 100,
    ASSET_UNKNOWN : 101,

    /**
     * 解析资源
     * @internal
     */
    parse : function(game, assetInfo, nextStep) {
        // 进行解压
        var files, key = assetInfo.key, url = assetInfo.url;
        if (!/\.bin$/.test(url)) {
            // 非 bin 资源
            if (assetInfo.isRaw) {
                // 图片资源，增加到缓存层
                this._addAtlasToCache(game, key, url);
            }
            else {
                // 只有声音这种类型了，将声音添加到声音管理器中
                var sound = game.assets._cache.getSound(url);
                if (sound) {
                    var asset = new qc.SoundAsset(key, url, sound.data, {uuid: key, type: AssetUtil.ASSET_SOUND});
                    game.assets.cache(key, url, asset);
                }
            }
            if (nextStep) nextStep();
            return;
        }
        else if (!assetInfo.isSound) {
            // json 方式
            var data = game.assets._cache.getText(url);
            delete game.assets._cache._text[url];

            try {
                files = JSON.parse(data);
            }
            catch (e)
            {
                game.log.error('Asset{0}/{1} Parse fail', key, url);
                qc.Util.popupError(e.message);
                if (nextStep) nextStep();
                return;
            }
        }
        else {
            // 二进制方式
            var data = game.assets._cache.getBinary(url);
            delete game.assets._cache._binary[url];

            var rawData, cursor;
            var dataView = new Uint8Array(data); // 建立视图

            if (dataView[0] === 0x51 && dataView[1] === 0x43) {
                // concat 类型
                rawData = dataView;
                cursor = 2;
            }
            else {
                game.log.error('Asset({0}) parse fail', url);
                game.assets._parsing--;
                return;
            }

            var nextBlockInfo = function() {
                var bodyLen = (rawData[cursor] << 24) |
                    (rawData[cursor + 1] << 16) |
                    (rawData[cursor + 2] << 8) |
                    rawData[cursor + 3];
                var bodyIndex = cursor + 4;
                cursor += bodyLen + 4;
                return [bodyIndex, bodyLen];
            };

            // 声音文件，meta 跟 binary 的音乐资源
            files = [];
            var slice;
            slice = nextBlockInfo();
            files.push(game.serializer.unpackUTF8(rawData.subarray(slice[0], slice[0] + slice[1])));
            slice = nextBlockInfo();
            files.push(data.slice(slice[0], slice[1]));
        }

        // JSON 解析出meta内容
        var meta = JSON.parse(files[0]);
        switch (meta.type) {
        case AssetUtil.ASSET_ATLAS:
            return AssetUtil._parseAtlas(game, meta, JSON.parse(files[1]), files[2],
                files[3] ? JSON.parse(files[3]) : undefined, key, url, nextStep);
        case AssetUtil.ASSET_PREFAB:
            return AssetUtil._parsePrefab(game, JSON.parse(files[1]), key, url, meta, nextStep);
        case AssetUtil.ASSET_SCENE:
            return AssetUtil._parseScene(game, JSON.parse(files[1]), key, url, meta, nextStep);
        case AssetUtil.ASSET_TEXT:
            return AssetUtil._parseText(game, files[1], key, url, meta, nextStep);
        case AssetUtil.ASSET_FONT:
            return AssetUtil._parseFont(game, meta, files[1], files[2], key, url, nextStep);
        case AssetUtil.ASSET_SOUND:
            return AssetUtil._parseSound(game, meta, files[1], key, url, nextStep);
        case AssetUtil.ASSET_EXCEL:
            return AssetUtil._parseExcel(game, meta, JSON.parse(files[1]), key, url, nextStep);
        case AssetUtil.ASSET_WEBFONT:
            return AssetUtil._parseWebFont(game, meta, JSON.parse(files[1]), key, url, nextStep);
        case AssetUtil.ASSET_ACTION:
            return AssetUtil._parseAction(game, JSON.parse(files[1]), key, url, meta, nextStep);
        case AssetUtil.ASSET_ACTIONMANAGER:
            return AssetUtil._parseActionManager(game, JSON.parse(files[1]), key, url, meta, nextStep);
        default:
            throw new Error('unsupported asset type：' + meta.type);
        }
    },

    /**
     * @param url 资源下载路径
     * @returns {*|boolean} 当前文件是否是音乐资源
     */
    isSound : function(url) {
        if (qc.Util.isArray(url)) {
            for (var i = 0; i < url.length; i++) {
                if (url[i] && /\.(mp3|ogg|mp3\.bin|ogg\.bin)$/.test(url[i].toLowerCase()))
                    return true;
            }
            return false;
        }
        return (url && /\.(mp3|ogg|mp3\.bin|ogg\.bin)$/.test(url.toLowerCase()));
    },

    // 解析图集
    _parseAtlas : function(game, meta, json, image, ani, key, url, nextStep) {
        var img = new Image();
        img.src = "data:image/png;base64," + image;

        // 等待图片加载完毕
        img.onerror = function() {
            img.onerror = undefined;
            nextStep();
        };
        img.onload = function() {
            img.onload = undefined;

            // 缓存起来（先写到phaser缓存中）
            var c = game.assets._cache;
            {
                c._images[url] = { url : url, data : img };
                PIXI.BaseTextureCache[url] = new PIXI.BaseTexture(img);
                PIXI.TextureCache[url] = new PIXI.Texture(PIXI.BaseTextureCache[url]);
                if (Object.keys(json).length > 0) {
                    if (ani &&
                        (meta.animationType === Sprite.DRAGON_BONES ||
                        meta.animationType === Sprite.FRAME_SAMPLES)) {
                        // 骨骼动画的JSON比较特殊，需要特殊转换下
                        var json2 = qc.dragonBones.CoverAtlas(json);
                        c._images[url].frameData = Phaser.AnimationParser.JSONDataHash(game.phaser, json2, url);
                    }
                    else {
                        if (json && qc.Util.isArray(json.frames))
                            c._images[url].frameData =
                                Phaser.AnimationParser.JSONData(game.phaser, json, url);
                        else
                            c._images[url].frameData =
                                Phaser.AnimationParser.JSONDataHash(game.phaser, json, url);
                    }
                }
                else {
                    if (! meta.spriteSheet) {
                        c._images[url].frameData = new Phaser.FrameData();
                        c._images[url].frame = new Phaser.Frame(0, 0, 0, img.width, img.height, '', '');
                        c._images[url].frameData.addFrame(new Phaser.Frame(0, 0, 0, img.width, img.height, null,
                            game.math.uuid()));
                    }
                    else {
                        // 指定了 spriteSheet 信息，需要通过该信息还原帧数据
                        var frameWidth = img.width / (meta.spriteSheet.columns || 1);
                        var frameHeight = img.height / (meta.spriteSheet.rows || 1);
                        var margin = meta.spriteSheet.margin || 0;
                        var spacing = meta.spriteSheet.spacing || 0;

                        c._images[url].frameData = Phaser.AnimationParser.spriteSheet(game.phaser, url, frameWidth, frameHeight, -1, margin, spacing);
                    }
                }
                c._resolveURL(url, c._images[url]);
            }
            var atlas = new qc.Atlas(key, url, c._images[url], meta, ani);
            atlas.json = json;
            atlas.img = img;
            game.assets.cache(key, url, atlas);

            // 调用回调
            nextStep();
        };
    },

    // 注册一张图片到游戏中（包括注册给 PIXI / PHASER / QC）
    addAtlasFromImage : function(game, key, url, img) {
        // 注册给 PIXI、PHASER
        game.assets._cache.addImage(url, url, img);

        // 注册给 QC
        return this._addAtlasToCache(game, key, url);
    },

    // 注册一张图片给 QC 的缓存层
    _addAtlasToCache : function(game, key, url) {
        // 注册给 QC
        var imgData = game.assets._cache._images[url];
        var atlas = new qc.Atlas(key, url, imgData, {
            uuid : game.math.uuid(),
            type : AssetUtil.ASSET_ATLAS
        });
        atlas.img = imgData.data;
        game.assets.cache(key, url, atlas);
        return atlas;
    },

    // 解析字体
    _parseFont : function(game, meta, image, xml, key, url, nextStep) {
        // xml转换下
        xml = game.assets._loader.parseXml(xml);

        var img = new Image();
        img.src = "data:image/png;base64," + image;
        // 等待图片加载完毕
        img.onerror = function() {
            img.onerror = undefined;
            nextStep();
        };
        img.onload = function() {
            img.onload = undefined;
            var font = new qc.Font(key, url, img, xml, meta);
            font._fontFamily = qc.UIText.BITMAPFONT;
            game.assets._cache.addBitmapFont(url, url, img, xml, font.xSpacing, font.ySpacing);
            game.assets.cache(key, url, font);
            nextStep();
        };
    },

    // 解析字符串
    _parseText : function(game, text, key, url, meta, nextStep) {
        game.assets._cache.addText(url, url, text);
        game.assets.cache(key, url, new qc.TextAsset(key, url, text, meta));
        nextStep();
    },

    // 解析场景
    _parseScene : function(game, scene, key, url, meta, nextStep) {
        return AssetUtil._parsePrefab(game, scene, key, url, meta, nextStep);
    },

    // 解析预制
    _parsePrefab : function(game, prefab, key, url, meta, nextStep) {
        // 缓存起来
        game.assets.cache(key, url, new Prefab(key, url, prefab, meta));
        nextStep();
    },

    // 解析 action
    _parseAction : function(game, action, key, url, meta, nextStep) {
        // 缓存起来
        game.assets.cache(key, url, new ActionAsset(key, url, action, meta));
        nextStep();
    },

    // 解析 action manager
    _parseActionManager : function(game, actionManager, key, url, meta, nextStep) {
        // 缓存起来
        game.assets.cache(key, url, new ActionManagerAsset(key, url, actionManager, meta));
        nextStep();
    },

    // 解析声音
    _parseSound : function(game, meta, sound, key, url, nextStep) {
        // 将声音添加到声音管理器中
        game.assets._cache.addSound(url, url, sound);

        // 判断声音是否已经解码
        if (game.assets._cache.isSoundDecoded(url)) {
            var asset = new qc.SoundAsset(key, url, game.phaser.cache.getSound(url), meta);
            game.assets.cache(key, url, asset);
            nextStep();
        }
        else {
            // 解码声音
            game.sound.phaser.decode(url, {url : url, key : key, meta : meta, nextStep : nextStep} );
        }
    },

    // 解析表格数据
    _parseExcel : function(game, meta, data, key, url, nextStep) {
        // 缓存
        game.assets.cache(key, url, new qc.ExcelAsset(key, url, data, meta));
        nextStep();
    },

    // 解析webFont
    _parseWebFont : function(game, meta, fontUrl, key, url, nextStep) {
        AssetUtil._deleteWebFont(meta.uuid);
        AssetUtil._loadWebFont(game, meta.uuid, fontUrl.url);
        var font = new qc.Font(meta.uuid, url, font, null, meta);
        if (typeof fontUrl.url === 'string') {
            font._fontUrl = [fontUrl.url];
        }
        else
            font._fontUrl = fontUrl.url;

        font._fontFamily = qc.UIText.WEBFONT;

        game.assets.cache(key, url.toString(), font);
        nextStep();

        // webfontloader.js是第三方包，需要判断是否加载
        if (window.WebFont) {
            WebFont.load({
                timeout: 60000,
                custom: {
                    families: [meta.uuid]
                },
                fontactive: function(fontName) {
                    // 此时有可能游戏世界尚未创建，因此需要添加此判断
                    if (game.world) {
                        // 清除相关的字体缓存信息
                        Object.keys(PIXI.Text.fontPropertiesCache).forEach(function(font) {
                           if (font.indexOf(meta.uuid) >= 0) {
                               delete PIXI.Text.fontPropertiesCache[font];
                           }
                        });
                        // 通知相关节点更新
                        AssetUtil._refreshWebFont(fontName, game.world);
                    }

                    // 扔出事件
                    game.assets.webFontLoaded.dispatch();
                },
                fontinactive: function(fontName) {
                    game.log.error("Load " + fontName + " fail");
                }
            });
        }
    },

    _webFontType: {
        "eot" : "embedded-opentype",
        "ttf" : "truetype",
        "ttc" : "truetype",
        "woff" : "woff",
        "svg" : "svg"
    },

    // 加载WebFont字体
    _loadWebFont: function(game, name, url) {
        var TYPE = AssetUtil._webFontType;
        var fontStyle = document.createElement("style");
        fontStyle.type = "text/css";
        fontStyle.id = "qc.webfont." + name;
        document.getElementsByTagName('head')[0].appendChild(fontStyle);

        var fontStr = "@font-face { font-family:" + name + "; src:";

        if (qc.Util.isArray(url)) {
            for (var i = 0, li = url.length; i < li; i++) {
                var src = url[i];
                var type = AssetUtil._getSuffix(url[i]);

                if (url[i].indexOf('http') >= 0)
                    fontStr += "url('" + url[i] + "') format('" + TYPE[type] + "')";
                else
                    // 相对路径
                    fontStr += "url('" + (game.assets.baseURL + url[i]) + "') format('" + TYPE[type] + "')";
                fontStr += (i === li - 1) ? ";" : ",";
            }
        }
        else {
            var type = AssetUtil._getSuffix(url);
            fontStr += "url('" + url + "') format('" + TYPE[type] + "');";
        }
        fontStyle.textContent += fontStr + "};";
    },

    // 删除WebFont字体
    _deleteWebFont: function(name) {
        while (true) {
            var font = document.getElementById("qc.webfont." + name);
            if (font)
                qc.Util.removeHTML(font);
            else
                break;
        }
    },

    // 字体加载完成后更新字体
    _refreshWebFont : function(fontName, node) {
        if (node instanceof qc.UIText) {
            node._refreshWebFont(fontName);
        }
        var children = node.children;
        var len = children.length;
        while (len--) {
            var child = children[len];
            AssetUtil._refreshWebFont(fontName, child);
        }
    },

    // 获取文件后缀
    _getSuffix : function(url) {
        var extension = url.substr((Math.max(0, url.lastIndexOf(".")) || Infinity) + 1);
        return extension.toLowerCase();
    },

    // Functions to create xhrs
    _createStandardXHR : function() {
        try {
            return new window.XMLHttpRequest();
        } catch( e ) {}
    },

    _createActiveXHR : function() {
        try {
           return new window.ActiveXObject( "Microsoft.XMLHTTP" );
        } catch( e ) {}
    },

    // 取得 xhr 对象
    getXHR : function() {
        var loc;
        // #8138, IE may throw an exception when accessing
        // a field from window.location if document.domain has been set
        try {
                loc = location.href;
        } catch( e ) {
                // Use the href attribute of an A element
                // since IE will modify it given document.location
                loc = document.createElement( "a" );
                loc.href = "";
                loc = loc.href;
        }
        var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
        var rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
        var locParts = rurl.exec( loc.toLowerCase() ) || [];
        var isLocal = rlocalProtocol.test(locParts[1]);

        var xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !isLocal && AssetUtil._createStandardXHR() || AssetUtil._createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	AssetUtil._createStandardXHR;

        return xhr();
    },

    // Get请求
    get : function(url, onload, onerror) {
        var xhr = AssetUtil.getXHR();

        xhr.open('GET', url, true);
        xhr.responseType = 'text';

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    onload(xhr.responseText);
                }
                else {
                    if (onerror) onerror(xhr);
                }
            }
            else {
            }
        };

        xhr.send();
    },

    // Post 请求
    post : function(url, strData, onload, onerror) {
        var xhr = AssetUtil.getXHR();

        xhr.open('POST', url, true);
        xhr.responseType = 'text';

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    onload(xhr.responseText);
                }
                else {
                    if (onerror) onerror(xhr);
                }
            }
            else {
            }
        };

        xhr.send(strData);
    },
};
