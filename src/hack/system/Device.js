/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */


var oldDeviceInitialize = Phaser.Device._initialize;

Phaser.Device._initialize = function () {
    oldDeviceInitialize.call(this);
    
    var ua = window.navigator.userAgent;
    
    // 判断是否为UCBrowser浏览器
    this.UCBrowser = /UCBrowser/.test(ua);

    // 判断iOS版本号
    if (this.iOS)
    {
        (navigator.appVersion).match(/OS (\d+)/);
        this.iOSVersion = parseInt(RegExp.$1, 10);
    }

    // 获取AppleWebkit类型和版本号
    var appleWebKit = /AppleWebKit\/([0-9\.]+)/;
    var result = appleWebKit.exec(navigator.userAgent);
    if (result && result.length > 0) {
        this.AppleWebKit = true;
        this.AppleWebKitVersion = result[1].split('.');
    }
    else {
        this.AppleWebKit = false;
    }

    this.supportStencil = !this.AppleWebKit || this.AppleWebKitVersion[0] > 534;
    
    if (this.android && this.UCBrowser) {
        qc.__IS_ANDROID_UC = true;
    }
};