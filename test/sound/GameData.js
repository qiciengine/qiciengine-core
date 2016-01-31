/**
 * 对qc.Node的qc.widget.Data类型包装，用于GameTree内部
 */
var GameData = qc.widget.Default.define(null, qc.widget.Data,
    function(node){
        GameData.super.constructor.call(this);
        // 保持对应node对象
        this._node = node;
        // 设置id用于设置父子关系时查找父亲节点
        this.id = node.uuid;
    },
    {

    },
    {

    },
    {
        node: {
            get: function(){
                return this._node;
            }
        },
        name: {
            get: function(){
                return this.node.name;
            },
            set: function(value){
                this.node.name = value;
            }
        },
        volume: {
            get: function(){
                return this.node.volume;
            },
            set: function(value){
                this.node.volume = value;
            }
        },
        playOnAwake : {
            get : function() {
                return this.node.playOnAwake;
            },
            set : function(v) {
                this.node.playOnAwake = v;
            }
        },
        mute : {
            get : function() {
                return this.node.mute;
            },
            set : function(v) {
                this.node.mute = v;
            }
        },
        loop : {
            get : function() {
                return this.node.loop;
            },
            set : function(value){
                this.node.loop = value;
            }
        }
    }
);
