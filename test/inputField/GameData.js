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
            set: function(v){
                this.node.name = v;
            }
        },
        text : {
            get : function() {
                return this.node.text;
            },
            set : function(v) {
                this.node.text = v;
            }
        },
        bold : {
            get : function() {
                return this.node.bold;
            },
            set : function(v) {
                this.node.bold = v;
            }
        },
        font : {
            get : function() {
                return this.node.font;
            },
            set : function(v) {
                this.node.font = v;
            }
        },
        fontSize : {
            get : function() {
                return this.node.fontSize;
            },
            set : function(v) {
                this.node.fontSize = v;
            }
        },
        lineType : {
            get : function() {
                return this.node.lineType;
            },
            set : function(v) {
                this.node.lineType = v;
            }
        },
        color : {
            get : function() {
                return this.node.color.toString();
            },
            set : function(v) {
                this.node.color = new qc.Color(v);
            }
        },
        lineSpacing : {
            get : function() {
                return this.node.lineSpacing;
            },
            set : function(v) {
                this.node.lineSpacing = v;
            }
        },
        x: {
            get: function() {
                return this.node.x;
            },
            set: function(value){
                this.node.x = value;
            }
        },
        y: {
            get: function(){
                return this.node.y;
            },
            set: function(value){
                this.node.y = value;
            }
        },
        width: {
            get: function(){
                return this.node.width;
            },
            set: function(value){
                this.node.width = value;
            }
        },
        height: {
            get: function(){
                return this.node.height;
            },
            set: function(value){
                this.node.height = value;
            }
        },
        rotation: {
            get: function(){
                return this.node.rotation;
            },
            set: function(value){
                this.node.rotation = value;
            }
        },
        pivotX: {
            get: function() {
                return this.node.pivotX;
            },
            set: function(value) {
                this.node.pivotX = value;
            }
        },
        pivotY: {
            get: function() {
                return this.node.pivotY;
            },
            set: function(value) {
                this.node.pivotY = value;
            }
        },
        scaleX: {
            get: function(){
                return this.node.scaleX;
            },
            set: function(value){
                this.node.scaleX = value;
            }
        },
        scaleY: {
            get: function(){
                return this.node.scaleY;
            },
            set: function(value){
                this.node.scaleY = value;
            }
        },
        overflow : {
            get : function() {
                return this.node.overflow;
            },
            set : function(v) {
                this.node.overflow = v;
            }
        }
    }
);
