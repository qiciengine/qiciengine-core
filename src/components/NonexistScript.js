/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 脚本不存在时的替代品
 * @class qc.NonexistScript
 */
var NonexistScript = defineBehaviour('qc.NonexistScript', qc.Behaviour, function() {
    // 丢失的脚本类名
    this.script = '';
    
    // 脚本数据
    this.data = {};
},{
});
NonexistScript.__hiddenInMenu = true;
