/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * A game has only one world. The world is an abstract place in which all game objects live. It is not bound
 * by stage limits and can be any size. You look into the world via cameras. All game objects live within
 * the world at world-based coordinates. By default a world is created the same size as your Stage.
 *
 * @class qc.World
 * @param {Phaser.World} phaser
 * @internal
 * @constructor
 */
var World = qc.World = function(phaser) {
    var self = this;

    // 用于派发模型变化事件，如名称变化，父子关系变化，孩子销毁等。
    self.onModelChange = new qc.Signal();

    // 调用基类初始化
    qc.Node.call(self, phaser, self);

    // 设置节点的名字
    self.name = 'world';

    // 宽高改变时需要重新relayout
    self.onSizeChange.add(function() {
        self.relayout();
    });

    // 待删除的节点列表
    self._toDestroyQ = [];

    if (window.__wx) {
        self.backDomRoot = null;
        self.frontDomRoot = null;
        return;
    }

    /**
     * property {Dom} backDomRoot - 处于底层的Dom根节点
     * @readonly
     */
    self.game.container.style.overflow = 'hidden';
    self.backDomRoot = document.createElement('div');
    self.backDomRoot.style.position = 'absolute';
    self.backDomRoot.style.left = '0px';
    self.backDomRoot.style.top = '0px';
    self.backDomRoot.style.overflow = 'hidden';
    self.game.container.insertBefore(self.backDomRoot, self.game.canvas);

    /**
     * property {Dom} frontDomRoot - 处于上层的Dom根节点
     * @readonly
     */
    self.frontDomRoot = document.createElement('div');
    self.frontDomRoot.style.position = 'absolute';
    self.frontDomRoot.style.left = '0px';
    self.frontDomRoot.style.top = '0px';
    self.frontDomRoot.style.overflow = 'hidden';
    self.game.container.appendChild(self.frontDomRoot);    
};

World.prototype = Object.create(qc.Node.prototype);
World.prototype.constructor = World;

/**
 * 需要序列化的字段和类型
 * @internal
 */
World.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // World节点的uuid不需要存储
    delete json['uuid'];

    return json;
};

// 重载World的relayout函数，不对自己进行布局，只对孩子进行布局
World.prototype.relayout = function() {
    // 所有的孩子也要进行重排
    var children = this.children;
    for (var i = 0; i < children.length; i++) {
        children[i].relayout();
    }
};

Object.defineProperties(World.prototype, {
    /**
     * The World has no fixed size, but it does have a bounds outside of which objects are no longer considered as
     * being "in world" and you should use this to clean-up the display list and purge dead objects.
     *
     * By default we set the Bounds to be from 0,0 to Game.width,Game.height.
     * I.e. it will match the size given to the game constructor with 0,0 representing the top-left of the display.
     *
     * However 0,0 is actually the center of the world, and if you rotate or scale the world all of that will happen from 0,0.
     * So if you want to make a game in which the world itself will rotate you should adjust the bounds
     * so that 0,0 is the center point, i.e. set them to -1000,-1000,2000,2000 for a 2000x2000 sized world centered around 0,0.
     *
     * @property {qc.Rectangle} bounds - Bound of this world that objects can not escape from.
     */
    'bounds' : {
        get : function()  { return this.phaser.bounds; },
        set : function(v) { this.phaser.setBounds(v.x, v.y, v.width, v.height); }
    },

    /**
     * @property {boolean} camera
     * @readonly
     */
    'camera' : {
        get : function()  { return this.phaser.camera; }
    },

    /**
     * @property {number} width - 设置游戏世界的宽度
     * @override
     */
    'width' : {
        get : function() {
            // 在编辑器模式下，获取编辑器设置的大小
            if (this._editorWidth !== undefined)
                return this._editorWidth;
            return this.phaser.width;
        },
        set : function(v) {
            if (this.width === v) return;
            this.phaser.width = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'width').set.call(this, v);
        }
    },

    /**
     * @property {number} height - 设置游戏世界的高度
     * @override
     */
    'height' : {
        get : function()
        {
            // 在编辑器模式下，获取编辑器设置的大小
            if (this._editorHeight !== undefined)
                return this._editorHeight;
            return this.phaser.height;
        },
        set : function(v) {
            if (this.height === v) return;
            this.phaser.height = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'height').set.call(this, v);
        }
    },

    /**
     * @property {number} centerX - 中心点X坐标
     * @readonly
     */
    'centerX' : {
        get : function() { return this.phaser.centerX; }
    },

    /**
     * @property {number} centerY - 中心点Y坐标
     * @readonly
     */
    'centerY' : {
        get : function() { return this.phaser.centerY; }
    },

    /**
     * @property {number} pivotX - 节点自身的原点X位置
     * @override
     * @readonly
     */
    pivotX : {
        get : function() { return 0; },
        set : function(v) { throw new Error('pivotX cannot be modified'); }
    },

    /**
     * @property {number} pivotY - 节点自身的原点Y位置
     * @override
     * @readonly
     */
    pivotY : {
        get : function() { return 0; },
        set : function(v) { throw new Error('pivotY cannot be modified'); }
    },

    /**
     * @property {qc.Signal} onSizeChange - 大小发生变化的事件
     * @readonly
     */
    onSizeChange: {
        get: function() { return this.game.phaser.scale.onSizeChange; }
    }
});

/**
 * 帧调度：preUpdate
 * @internal
 */
World.prototype.preUpdate = function() {
    // 清理下需要被析构的节点
    this._toDestroyQ.forEach(function(node) {
        node.destroyImmediately();
    });
    this._toDestroyQ.length = 0;
};

/**
 * 添加待删除的节点
 * @param node
 * @internal
 */
World.prototype.addToDestroy = function(node) {
    this._toDestroyQ.push(node);
};

/**
 * 更新Front和Back的DomRoot
 */
World.prototype.updateDomRoot = function() {   
    // 输入状态不进行更新
    if (window.__wx || this.game.isBooted && this.game.input.inputting) {
        return;
    }

    var frontStyle = this.frontDomRoot.style;
    var backStyle = this.backDomRoot.style;
    var canvasStyle = this.game.canvas.style;        
    frontStyle.width = backStyle.width = canvasStyle.width;
    frontStyle.height = backStyle.height = canvasStyle.height;
    frontStyle.marginLeft = backStyle.marginLeft = canvasStyle.marginLeft;
    frontStyle.marginTop = backStyle.marginTop = canvasStyle.marginTop;
    frontStyle.marginRight = backStyle.marginRight = canvasStyle.marginRight;
    frontStyle.marginBottom = backStyle.marginBottom = canvasStyle.marginBottom;                        
};

