/**
 * @author chenx
 * @date 2015.12.08
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 取得微信签名指令
 */

function main(res, para)
{
    var appid = para.appid;
    var url = para.url;

    WECHAT_D.getSign(appid, url)
        .then(function(result){
            COMMUNICATE_D.sendMessage(res, result);
        })
        .catch(function(err){
            COMMUNICATE_D.sendMessage(res, { ret : false })
        })
}

COMMUNICATE_D.registerCmd('GET_WECHAT_SIGN', main);
