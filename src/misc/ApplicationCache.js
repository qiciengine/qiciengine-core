/**
 * @author chenx
 * @date 2015.12.13
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * applicatioin cache 事件处理
 */

var appCache = window.applicationCache;
if (!!appCache)
{
    var logEvent = function(e) {
        //console.log('applicationCache', e);
    }

    var logError = function(e) {
        //console.log("applicationCache error " + e);
    };

    appCache.addEventListener('cached', logEvent, false);
    appCache.addEventListener('checking', logEvent, false);
    appCache.addEventListener('downloading', logEvent, false);
    appCache.addEventListener('error', logError, false);
    appCache.addEventListener('noupdate', logEvent, false);
    appCache.addEventListener('obsolete', logEvent, false);
    appCache.addEventListener('progress', logEvent, false);
    appCache.addEventListener('updateready', logEvent, false);
}
