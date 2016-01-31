
/**
 * Renders the Stage to this canvas view
 *
 * @method render
 * @param stage {Stage} the Stage element to be rendered
 */
PIXI.CanvasRenderer.prototype.render = function(stage)
{
    // remove this line
    // stage.updateTransform();

    this.context.setTransform(1,0,0,1,0,0);

    this.context.globalAlpha = 1;

    this.renderSession.drawCount = 0;
    this.renderSession.currentBlendMode = PIXI.blendModes.NORMAL;
    this.context.globalCompositeOperation = PIXI.blendModesCanvas[PIXI.blendModes.NORMAL];
    
    if (this.dirtyRectangle.enable) {
        if (!this.dirtyRectangle.updateDirtyRegion(this.context, this.resolution, stage))
        {
            this.context.fillStyle = 'rgba(0, 0, 0, 0)';
            this.context.fillRect(0, 0, 1, 1);
            this.dirtyRectangle.showDirtyRectangle(this.context, this.resolution);
            return;
        }
    }
    else if (navigator.isCocoonJS && this.view.screencanvas)
    {
        this.context.fillStyle = "black";
        this.context.clear();
    }

    if (this.clearBeforeRender)
    {
        if (this.transparent)
        {
            this.context.clearRect(0, 0, this.width, this.height);
        }
        else
        {
            this.context.fillStyle = stage.backgroundColorString;
            this.context.fillRect(0, 0, this.width , this.height);
        }
    }
    
    this.renderDisplayObject(stage);

    if (this.dirtyRectangle.enable) {
        this.dirtyRectangle.restore(this.context);
        this.dirtyRectangle.showDirtyRectangle(this.context, this.resolution);
    }
};
