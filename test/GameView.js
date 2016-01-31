/**
 * GameView用于将qc.Game的cavnas组件嵌入qc.widget的包装组件
 * @param game qc.Game对象
 * @param size {width: 500, height: 600}格式的尺寸，如果为空代表界面不进行缩放，否则以该指定尺寸范围进行缩放显示
 */
var GameView = qc.widget.Default.define(null, Object,
    function(game, size){
        this._game = game;
        this.initView();
        game.phaser.canvas.style.position = 'absolute';
        this._interactionDiv.appendChild(game.phaser.canvas);
        game.phaser.parent = this._interactionDiv;
        game.phaser.scale.parentNode = this._interactionDiv;
        game.phaser.scale.parentIsWindow = false;
        this.size = size;
    },
    {
        validateImpl: function () {
            var canvas = this.game.phaser.canvas;
            var camera = this.game.camera.phaser;
            var scale = this.game.phaser.scale;
            var width = this.clientWidth;
            var height = this.clientHeight;

            if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
                scale._lastUpdate = 0;
                if(!this.size){
                    scale.setGameSize(width, height);
                    camera.bounds.setTo(-Infinity, -Infinity, Infinity, Infinity);
                    camera.view.width = width / camera.scale.x;
                    camera.view.height = height / camera.scale.y;
                }
            }
        }
    },
    {
        view: true,
        emitter: true
    },
    {
        game: {
            get: function(){
                return this._game;
            }
        },
        size: {
            get: function(){
                return this._size;
            },
            set: function(size){
                this._size = size;
                var scale = this.game.phaser.scale;
                scale.pageAlignHorizontally = true;
                scale.pageAlignVertically = true;
                scale.minWidth = null;
                scale.minHeight = null;
                scale.maxWidth = null;
                scale.maxHeight = null;
                if(size){
                    scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    scale.pageAlignHorizontally = true;
                    scale.pageAlignVertically = true;
                    scale.setGameSize(size.width, size.height);
                }else{
                    scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
                    this.game.phaser.canvas.style.margin = 0;
                }
                this.iv();
            }
        }
    }
);
