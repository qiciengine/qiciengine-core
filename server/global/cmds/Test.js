/**
 * @author chenx
 * @date 2015.10.15
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 测试指令
 */

function main(res, para)
{
    COMMUNICATE_D.sendMessage(res, { text : "Hello" });
}

COMMUNICATE_D.registerCmd('TEST', main);
