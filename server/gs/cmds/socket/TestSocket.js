/**
 * @author chenx
 * @date 2015.12.17
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * 测试 websocket 指令
 */

function main(socket, para1, para2, para3)
{
    trace('TestSocket main para1:%j, para2:%j, para3:%j', para1, para2, para3);
    socket.emit('MSG_TEST_SOCKET', para1, para2, para3);
}

COMMUNICATE_D.registerSocketCmd('TEST_GS_SOCKET', main);
