// 启动游戏的模板脚本

// 测试用配置
var _config_ = {
    // 项目名，默认为：Game
    projectName : 'TEST',

    // 游戏名字，默认为：未命名
    gameName : 'TEST',

    // 开发者名字，默认为：DefaultCompany
    companyName : 'QCPlay',

    // 项目唯一标识，默认为：com.DefaultCompany.Game
    bundleIdentifier : 'com.qcplay.test',

    // 游戏示例，将作为全局变量访问，默认为：game
    gameInstance : 'game',

    // 游戏实例的容器
    div : '',

    // 横版或竖版，默认为AUTO（自动旋转缩放）
    orientation : 0,

    // 所有的游戏场景和入口场景
    scene : {
        login : 'assets/state/login.bin',
        main : 'assets/state/main.bin'
    },
    entryScene : 'login'
};

// 内置的启动场景，启动后即刻载入入口场景
var splashState = {
    preload : function() {
        // do nothing
    },

    create : function() {
        // 初始化用户场景信息
        game.state.entry = _config_.entryScene;
        game.state.list = _config_.scene;

        // 进入第一个场景(需要用户第一个场景资源下载完毕才能进入)
        var loadMain = function() {
            game.state.load(game.state.entry, true, function() {
                console.log('开始入口场景的资源加载');

                // 调度下主场景的资源加载自定义逻辑（一般情况也很少）
                if (game._onFirstScenePreload)
                    game._onFirstScenePreload();
            }, function() {
                console.log('入口场景加载完毕。');

                // 调度下入口场景加载完毕的逻辑（一般也很少定制）
                if (game._onFirstSceneLoaded)
                    game._onFirstSceneLoaded();
            });
        };
        game.phaser.time.events.add(1, loadMain);
    }
};

// 入口
window.loadGame = function() {
    var instance = _config_.gameInstance;
    if (window[instance]) {
        // 已经有实例了？先关闭之
        window[instance].shutdown();
    }
    window[instance] = new qc.Game('100%', '100%', _config_.div, splashState);
    //window[instance] = new qc.Game('50%', '50%', _config_.div, splashState);
    window[instance].bundleIdentifier = _config_.bundleIdentifier;

    // 打印欢迎信息
    window[instance].log.important('**** [QC引擎提示]开始启动游戏：{0}({1})', _config_.gameName, _config_.bundleIdentifier);
}
window.loadGame();
