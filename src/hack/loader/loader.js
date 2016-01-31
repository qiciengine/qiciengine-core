/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * hack phaser transformUrl 方法，如果 url 已经是 http 开头就不需要再加上 baseURL
 * Transforms the asset URL. The default implementation prepends the baseURL.
 *
 * @method Phaser.Loader#transformUrl
 * @protected
 */
Phaser.Loader.prototype.transformUrl = function (url) {
    if (/^http(s|):\/\//i.test(url))
        return url;
    else
        return this.baseURL + url;
};

/**
 * Informs the loader that the given file resource has been fetched and processed;
 * or such a request has failed.
 *
 * @method Phaser.Loader#asyncComplete
 * @private
 * @param {object} file
 * @param {string} [error=''] - The error message, if any. No message implies no error.
 */
Phaser.Loader.prototype.asyncComplete = function (file, errorMessage) {

    if (typeof errorMessage === 'undefined') { errorMessage = ''; }

    file.loaded = true;
    file.error = !!errorMessage;

    // 增加返回错误码的判断
    if (file.requestObject && 
        file.requestObject.status !== 200 &&
        file.requestObject.status !== 304) {
        file.error = true;
    }

    if (errorMessage) {
        file.errorMessage = errorMessage;

        console.warn('Phaser.Loader - ' + file.type + '[' + file.key + ']' + ': ' + errorMessage);
        // debugger;
    }

    this.processLoadQueue();

};
