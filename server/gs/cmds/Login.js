/**
 * @author chenx
 * @date 2015.10.19
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 登录指令
 */

function main(res, para)
{
    LOGIN_D.login(res, para);
}

COMMUNICATE_D.registerCmd('LOGIN', main);
