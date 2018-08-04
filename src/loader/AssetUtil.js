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

        // 本地文件读取的数据
        var data = assetInfo.data;
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

                // 若为微信，则判断该声音是否为本地文件，若为本地文件，则更新 md5
                if (window.__wx) {
                    // 取得本地文件列表信息
                    var localFiles = game.storage.get('localFiles') || {};

                    // 取得本地资源md5列表
                    var assetsMd5 = game.storage.get('assetsMd5') || {};

                    // 缓存的文件的 key 为 Assets 之下的路径
                    var key = url.replace('Assets/', '');

                    // 该文件不在md5列表中，不处理
                    if (assetsMd5[key]) {
                        var localInfo = localFiles[key];
                        if (localInfo) {
                            // 若本地文件 md5 一样，则不保存
                            if (localInfo['md5'] == assetsMd5[key]) {
                                game.log.important("文件({0})md5一致，不缓存。", url);

                                // 更新下访问时间
                                localInfo['time'] = game.time.now;
                                // 延迟写缓存
                                game.storage.delaySet('localFiles', localFiles, 10000);
                            }
                        }
                        else {
                            localInfo = {};

                            // 延迟更新文件列表
                            localInfo['md5']  = assetsMd5[key];
                            localInfo['time'] = game.time.now;
                            localFiles[key]   = localInfo;
                            game.storage.delaySet('localFiles', localFiles, 10000);
                        }
                    }
                }
            }
            if (nextStep) nextStep();
            return;
        }
        else if (!assetInfo.isSound) {
            // json 方式
            data = data || game.assets._cache.getText(url);
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
            data = data || game.assets._cache.getBinary(url);
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

        // 微信小游戏，写入本地
        if (window.__wx && !assetInfo.data)
            AssetUtil.wxSaveAsset(game, url, data);

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
        if (!window.__wx)
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
            if (!window.__wx) {
                var font = new qc.Font(key, url, img, xml, meta);
                font._fontFamily = qc.UIText.BITMAPFONT;
                game.assets._cache.addBitmapFont(url, url, img, xml, font.xSpacing, font.ySpacing);
                game.assets.cache(key, url, font);
                nextStep();
            }
            else if (window.Tautologistics) {
                // 微信使用 htmpparser.js 来进行解析
                var handler = new Tautologistics.NodeHtmlParser.DefaultHandler(function(error, dom) {
                    if (error) {
                        game.log.error("解析字体文件{0}的 xml 失败。", url);
                        nextStep();
                    }
                    else {
                        var font = new qc.Font(key, url, img, dom, meta);
                        font._fontFamily = qc.UIText.BITMAPFONT;
                        game.assets._cache.addBitmapFont(url, url, img, dom, font.xSpacing, font.ySpacing);
                        game.assets.cache(key, url, font);
                        nextStep();
                    }
                });
                var parser = new Tautologistics.NodeHtmlParser.Parser(handler);
                parser.parseComplete(xml);
            }
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

        var fontLoaded = function(fontName) {
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
        }

        if (window.__wx) {
            for (var i = 0; i < font._fontUrl.length; i++) {
                // 先读取本地字体文件
                var url = font._fontUrl[i];
                var path = wx.env.USER_DATA_PATH + "/" + url;
                var fs = wx.getFileSystemManager();
                try {
                    fs.accessSync(path);

                    // 加载本地字体文件
                    var fontName = wx.loadFont(path);
                    if (fontName) {
                        game.log.trace("Asset {0}->{1} load from local filesystem.", url, fontName);
                        var font = game.assets.find(key);
                        if (font)
                            font.wxFontName = fontName;
                        else
                            game.log.error("加载本地字体" + url + "成功后取不到 font 资源");
                        fontLoaded(fontName);
                    }
                }
                catch (e) {
                    // 本地不存在，则从网络下载
                    // 确保目录已创建
                    AssetUtil.wxAssureDirectory(game, url);

                    wx.downloadFile({
                        url: game.assets.baseURL + url,
                        filePath: wx.env.USER_DATA_PATH + "/" + url,
                        success: function(res) {
                            // 写入本地
                            game.log.trace("字体 {0} 下载成功. res : {1}", url, JSON.stringify(res));
                            // 下载成功，加载本地字体文件
                            var fontName = wx.loadFont(wx.env.USER_DATA_PATH + "/" + url);
                            if (fontName) {
                                game.log.trace("Asset {0}->{1} load from local filesystem.", url, fontName);
                                var font = game.assets.find(key);
                                if (font) {
                                    font.wxFontName = fontName;
                                }
                                else
                                    game.log.error("从网络加载本地字体" + url + "成功后取不到 font 资源");
                                fontLoaded(fontName);
                            }
                        },
                        fail: function(e){
                            game.log.error("Download " + game.assets.baseURL + url + " fail：" + JSON.stringify(e));
                        }
                    });
                }
            }
        }
        // webfontloader.js是第三方包，需要判断是否加载
        else if (window.WebFont) {
            WebFont.load({
                timeout: 60000,
                custom: {
                    families: [meta.uuid]
                },
                fontactive: function(fontName) {
                    fontLoaded(fontName);
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
        if (window.__wx) {
            var header = {};
            header['Content-Type'] = 'text/plain;charset=UTF-8';
            // 微信环境
            wx.request({
                url: url,
                header: header,
                dataType: "text",
                success: function(res) {
                    onload(res.data);
                },
                fail: function(e) {
                    console.log("err:" + JSON.stringify(e));
                    onerror();
                }
            });
            return;
        }

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
        if (window.__wx) {
            var header = {};
            header['Content-Type'] = 'text/plain;charset=UTF-8';
            // 微信环境
            wx.request({
                url: url,
                method: "POST",
                data: strData,
                header: header,
                dataType: "text",
                success: function(res) {
                    onload(res.data);
                },
                fail: function() {
                    onerror();
                }
            });
            return;
        }

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

    // 将一个 canvas 转换成 qc.Atlas 数据
    createAtlasFromCanvas: function(game, key, canvas) {
        var atlas = game.assets.find(key);
        if (atlas) {
            var baseTexture = PIXI.BaseTextureCache[key];
            if (baseTexture && baseTexture.source == canvas) {
                // 存在该 canvas 转换后的数据，直接返回
                baseTexture.dirty();
                return atlas;
            }
            atlas.unload(game);
        }
        var c = game.assets._cache;
        PIXI.BaseTextureCache[key] = new PIXI.BaseTexture(canvas);
        PIXI.TextureCache[key] = new PIXI.Texture(PIXI.BaseTextureCache[key]);
        c._images[key] = { url : key, data : canvas };
        c._images[key].frameData = new Phaser.FrameData();
        c._images[key].frame = new Phaser.Frame(0, 0, 0, canvas.width, canvas.height, '', '');
        c._images[key].frameData.addFrame(new Phaser.Frame(0, 0, 0, canvas.width, canvas.height, null,
            game.math.uuid()));
        var atlas = new qc.Atlas(key, key, c._images[key], {});
        atlas.json = {};
        atlas.img = canvas;
        game.assets.cache(key, key, atlas);
        return atlas;
    },

    // 删除无用的资源，将不在 md5 资源列表中的文件删除掉
    wxRemoveUnusedAssets: function(game) {
        if (!window.__wx || typeof wx.getSharedCanvas == "function")
            return;
        // 取得本地资源md5列表
        var assetsMd5 = game.storage.get('assetsMd5') || {};

        var fs = wx.getFileSystemManager();
        var path = wx.env.USER_DATA_PATH + '/Assets';

        var explorePath = function(dir) {
            try {
                var list = fs.readdirSync(dir);
                for (var i = 0; i < list.length; i++) {
                    var subPath = list[i];
                    var fullPath = dir + "/" + subPath;
                    try {
                        var stat = fs.statSync(fullPath);
                        if (stat.isDirectory()) {
                            explorePath(fullPath);
                        }
                        else {
                            var key = fullPath.replace(path + '/', '');
                            if (!assetsMd5[key]) {
                                game.log.trace("本地文件({0})不在md5列表中，删除之！", key);
                                fs.unlink({filePath : fullPath});
                            }
                        }
                    } catch(e) {
                        game.log.important("wxRemoveUnusedAssets statSync({0}) 出错：{1}", fullPath, e);
                    }
                }
            } catch (e) {
                game.log.important("wxRemoveUnusedAssets readdirSync({0}) 出错：{1}", dir, e);
                return;
            }
        };
        explorePath(path);
    },

    // 清理空间后写入文件
    wxCleanLocalFiles: function(game, url, data, retry) {
        if (!window.__wx || typeof wx.getSharedCanvas == "function")
            return;

        // 取得本地文件列表信息
        var localFiles = game.storage.get('localFiles') || {};

        // 按时间进行排序
        var sortList = [];
        for (var key in localFiles) {
            var value = { key : key, time : localFiles[key].time };
            qc.Util.insertSortedList(sortList, value, function(v1, v2) {
                return v1.time < v2.time;
            }, true);
        }

        var fs = wx.getFileSystemManager();
        var count = 0;
        var maxCount = 20 * 1024 * 1024;
        // 按照时间依次删除本地文件，直到删除的空间到达指定字节为止
        for (var i = 0; i < sortList.length; i++) {
            if (count >= maxCount)
                break;

            var key = sortList[i].key;
            try {
                var path = wx.env.USER_DATA_PATH + "/Assets/" + key;
                var stat = fs.statSync(path);
                count += stat.size;
                fs.unlinkSync(path);
            } catch(e) {
                game.log.important("wxCleanLocalFiles statSync({0}) 出错：{1}", path, e);
            }
        }

        // 删除完后尝试再次写入文件
        if (retry)
            return;
        if (url && data)
            qc.AssetUtil.wxWriteFile(game, url, data, true);
    },

    // 微信中确保目录存在
    wxAssureDirectory: function(game, url) {
        if (!window.__wx || typeof wx.getSharedCanvas == "function")
            return;

        var fs = wx.getFileSystemManager();
        var path = "";
        var pathList = [ wx.env.USER_DATA_PATH ];
        pathList = pathList.concat(url.split('/'));
        // 确保目录已创建
        for (var i = 0; i < pathList.length - 1; i++) {
            if (i === 0)
                path = pathList[0];
            else
                path = path + "/" + pathList[i];
            try {
                fs.accessSync(path);
            } catch(e) {
                // 不存在，创建
                try {
                    fs.mkdirSync(path);
                }
                catch(e) {
                    game.log.trace("创建目录{0}失败：{1}", path, JSON.stringify(e));
                }
            }
        }
    },

    // 微信中写入本地文件
    wxWriteFile: function(game, url, data, retry, callback) {
        if (!window.__wx)
            return;

        // 确保目录已创建
        AssetUtil.wxAssureDirectory(game, url);

        // 写文件
        var fs = wx.getFileSystemManager();
        var path = wx.env.USER_DATA_PATH + "/" + url;
        fs.writeFile({
            filePath: path,
            data:     data,
            encoding: 'utf8',
            success: function() {
                game.log.trace("资源({0})写入本地文件", url);
                if (callback)
                    callback.apply(null, [url]);
            },
            fail: function(res) {
                game.log.important("资源({0})写入本地文件{1}失败：{2}", url, path, res.errMsg);
                // 写入失败，可能是空间已满，清理空间后再写入
                fs.unlink({filePath : path});
                AssetUtil.wxCleanLocalFiles(game, url, data, retry);
            }
        });
    },

    // 微信中尝试保存资源
    wxSaveAsset: function(game, url, data) {
        if (!window.__wx || typeof wx.getSharedCanvas == "function")
            return;

        // 取得本地文件列表信息
        var localFiles = game.storage.get('localFiles') || {};

        // 取得本地资源md5列表
        var assetsMd5 = game.storage.get('assetsMd5') || {};

        // 缓存的文件的 key 为 Assets 之下的路径
        var key = url.replace('Assets/', '');

        // 该文件不在md5列表中，不缓存
        if (!assetsMd5[key]) {
            game.log.important("文件({0})不在md5列表中，不缓存。", url);
            return;
        }

        var localInfo = localFiles[key];
        if (localInfo) {
            // 若本地文件 md5 一样，则不保存
            if (localInfo['md5'] == assetsMd5[key]) {
                game.log.important("文件({0})md5一致，不缓存。", url);

                // 更新下访问时间
                localInfo['time'] = game.time.now;
                // 延迟写缓存
                game.storage.delaySet('localFiles', localFiles, 10000);
                return;
            }
        }
        else
            localInfo = {};

        // 延迟更新文件列表
        localInfo['md5']  = assetsMd5[key];
        localInfo['time'] = game.time.now;
        localFiles[key]   = localInfo;
        game.storage.delaySet('localFiles', localFiles, 10000);

        // 写本地文件
        AssetUtil.wxWriteFile(game, url, data);
    },

    // 尝试读取本地资源
    wxReadAsset: function(game, assetInfo) {
        if (!window.__wx || typeof wx.getSharedCanvas == "function")
            return;

        var url = assetInfo.url;

        // 取得本地文件列表信息
        var localFiles = game.storage.get('localFiles') || {};

        // 取得本地资源md5列表
        var assetsMd5 = game.storage.get('assetsMd5') || {};

        // 缓存的文件的 key 为 Assets 之下的路径
        var key = url.replace('Assets/', '');

        // 读取本地文本
        var readLocalFile = function(path) {
            var fs = wx.getFileSystemManager();
            var data;
            try {
                if (assetInfo.isSound) {
                    fs.accessSync(path);

                    // 音频文件，使用 wx 接口加载
                    var data = new Audio();
                    data.name = url;

                    var playThroughEvent = function () {
                        data.removeEventListener('canplaythrough', playThroughEvent, false);
                        data.removeEventListener('stalled', onStalled, false);
                        data.onerror = null;
                    };
                    data.onerror = function () {
                        data.removeEventListener('canplaythrough', playThroughEvent, false);
                        data.removeEventListener('stalled', onStalled, false);
                        data.onerror = null;
                        var asset = game.assets.find(url);
                        if (asset)
                            asset.unload(game);
                    };
                    var onStalled = function() {
                        data.removeEventListener('canplaythrough', playThroughEvent, false);
                        data.removeEventListener('stalled', onStalled, false);
                        data.onerror = null;
                        var asset = game.assets.find(url);
                        if (asset)
                            asset.unload(game);
                    };

                    data.preload = 'auto';
                    data.src = path;
                    data.addEventListener('canplaythrough', playThroughEvent, false);
                    data.addEventListener('stalled', onStalled, false);
                    assetInfo.data = data;

                    game.assets._cache.addSound(url, url, data, false, true);

                    return data;
                }
                else {
                    data = fs.readFileSync(path, "utf8");
                    assetInfo.data = data;

                    return data;
                }
            } catch(e) {
            }
        }

        // 尝试读取包里的文件
        var data = readLocalFile(url);
        if (data) {
            game.log.trace('Asset {0} load from package.', url);
            return data;
        }

        // 该文件不在md5列表中
        if (!assetsMd5[key]) {
            game.log.important("文件({0})不在md5列表中，不尝试读取本地资源。", url);
            return;
        }

        var localInfo = localFiles[key];
        if (localInfo && localInfo['md5'] == assetsMd5[key]) {
            // 读取本地文件
            var path = wx.env.USER_DATA_PATH + "/" + url;
            var data = readLocalFile(path);

            if (data) {
                game.log.trace('Asset {0} load from local filesystem.', url);

                // 更新文件的访问时间
                localInfo['time'] = game.time.now;
                localFiles[key] = localInfo;
                game.storage.delaySet('localFiles', localFiles, 10000);
                return data;
            }
            else {
                // 读取失败，需要删除文件列表缓存
                delete localFiles[key];
                game.storage.delaySet('localFiles', localFiles, 10000);
                var fs = wx.getFileSystemManager();
                fs.unlink({filePath : path});
            }
        }
    },

    // 更新微信资源 md5 信息
    updateWxResMd5: function(game, dislistUrl, assetsMd5Url, callback) {
        AssetUtil.get(dislistUrl, function(data) {
            try {
                var dislist = JSON.parse(data);
                game.log.trace("Download dislist success: {0}", data);

                // 先取本地缓存的版本信息
                var localVersion = game.storage.get('version') || '';
                var assetsMd5    = game.storage.get('assetsMd5');
                if (localVersion == dislist.version && assetsMd5) {
                    // 版本一样，进入主界面
                    game.log.trace("资源版本一致。");
                    if (typeof callback == "function")
                        callback.apply(null, [dislist]);
                    return;
                }

                // 下载 md5 列表
                AssetUtil.get(assetsMd5Url, function(data) {
                    var md5List = {};
                    try {
                        md5List = JSON.parse(data);
                        game.log.trace("下载 md5List 成功。");

                        // 更新到缓存中
                        game.storage.set('assetsMd5', md5List);
                        game.storage.set('version', dislist.version);

                        // 删除无用的资源
                        AssetUtil.wxRemoveUnusedAssets(game);

                        if (typeof callback == "function")
                            callback.apply(null, [dislist]);
                    }
                    catch (e)
                    {
                        game.log.error('parse md5List({0}) fail.', assetsMd5Url);
                        if (typeof callback == "function")
                            callback.apply(null, []);
                    }
                }, function(){
                    game.log.error('download md5List({0}) fail.', assetsMd5Url);
                    if (typeof callback == "function")
                        callback.apply(null, []);
                });
            }
            catch (e)
            {
                game.log.error('parse dislist({0}) fail.', dislistUrl);
                if (typeof callback == "function")
                    callback.apply(null, []);
                return;
            }
        }, function(){
            game.log.error('download dislist({0}) fail.', dislistUrl);
            if (typeof callback == "function")
                callback.apply(null, []);
        });
    }
};
