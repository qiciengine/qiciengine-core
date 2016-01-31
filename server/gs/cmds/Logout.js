/**
 * @author chenx
 * @date 2015.10.19
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 登出指令
 */

function main(res, para)
{
    LOGIN_D.logout(res, para);
}

COMMUNICATE_D.registerCmd('LOGOUT', main);
