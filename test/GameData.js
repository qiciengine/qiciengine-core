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
        visible: {
            get: function(){
                return this.node.visible;
            },
            set: function(value){
                this.node.visible = value;
            }
        },
        colorTint: {
            get: function(){
                return this.node.colorTint;
            },
            set: function(value){
                this.node.colorTint = value;
            }
        },
        interactive: {
            get: function(){
                return this.node.interactive;
            },
            set: function(value){
                this.node.interactive = value;
            }
        },
        alpha: {
            get: function(){
                return this.node.alpha;
            },
            set: function(value){
                this.node.alpha = value;
            }
        },
        x: {
            get: function(){
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
        anchorX: {
            get: function() {
                return this.node.pivotX;
            },
            set: function(value) {
                this.node.pivotX = value;
            }
        },
        anchorY: {
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
        }
    }
);
