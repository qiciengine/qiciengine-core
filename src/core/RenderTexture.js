/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
qc.RenderTexture = PIXI.RenderTexture;

qc.RenderTexture.prototype.resize = function(width, height, updateBase)
{
    if (width === this.width && height === this.height)return;

    this.valid = (width > 0 && height > 0);

    this.width = width;
    this.height = height;
    this.frame.width = this.crop.width = width * this.resolution;
    this.frame.height = this.crop.height = height * this.resolution;

    if (updateBase)
    {
        this.baseTexture.width = Math.round(this.width * this.resolution);
        this.baseTexture.height = Math.round(this.height * this.resolution);
    }

    if (this.renderer.type === PIXI.WEBGL_RENDERER)
    {
        this.projection.x = this.width / 2;
        this.projection.y = -this.height / 2;
    }

    if(!this.valid)return;

    this.textureBuffer.resize(Math.round(this.width * this.resolution), Math.round(this.height * this.resolution));
};

qc.RenderTexture.prototype.directRenderWebGL = function(displayObject, offset, clear)
{
    if(!this.valid)return;

    var record = {
        x: this.renderer.offset.x,
        y: this.renderer.offset.y
    };

    this.renderer.offset.x = offset ? offset.x : 0;
    this.renderer.offset.y = offset ? offset.y : 0;

    // time for the webGL fun stuff!
    var gl = this.renderer.gl;

    if (gl.isContextLost()) {
        return false;
    }

    if (!gl.replace) {
        var oldViewPort = gl.viewport;
        gl.viewport = function(x, y, width, height) {
            if (width === 0 || height === 0 || width * height < 0) {
                console.log('viewPort:', x, y, width, height, width * height);
            }
            oldViewPort.call(gl, x, y, width, height);
        };
        gl.replace = true;
    }


    gl.viewport(0, 0, this.width * this.resolution, this.height * this.resolution);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureBuffer.frameBuffer );

    if(clear)this.textureBuffer.clear();

    var v = gl.getError();
    if (v) {
        console.log('webgl gl.getError(', v, ')');
    }

    this.renderer.spriteBatch.dirty = true;

    this.renderer.renderDisplayObject(displayObject, this.projection, this.textureBuffer.frameBuffer);

    this.renderer.spriteBatch.dirty = true;
    this.renderer.offset.x = record.x;
    this.renderer.offset.y = record.y;
};

PIXI.RenderTexture.prototype.directRenderCanvas = function(displayObject, offset, clear)
{
    if(!this.valid)return;

    var record = {
        x: this.renderer.offset.x,
        y: this.renderer.offset.y
    };

    this.renderer.offset.x = offset ? offset.x : 0;
    this.renderer.offset.y = offset ? offset.y : 0;

    if(clear)this.textureBuffer.clear();

    var context = this.textureBuffer.context;

    var realResolution = this.renderer.resolution;

    this.renderer.resolution = this.resolution;

    this.renderer.renderDisplayObject(displayObject, context);

    this.renderer.resolution = realResolution;
    this.renderer.offset.x = record.x;
    this.renderer.offset.y = record.y;
};

qc.RenderTexture.prototype.renderWebGL = function(displayObject, matrix, clear)
{
    if(!this.valid)return;
    //TOOD replace position with matrix..

    displayObject.game._qc.renderInRenderTexture = true;

    //Lets create a nice matrix to apply to our display object. Frame buffers come in upside down so we need to flip the matrix
    var wt = displayObject.getWorldTransform();
    wt.identity();
    wt.translate(0, this.projection.y * 2);
    if(matrix)wt.append(matrix);
    wt.scale(1,-1);
    // setWorld Alpha to ensure that the object is renderer at full opacity
    displayObject.worldAlpha = 1;
    displayObject._isSubNeedCalcTransform = true;
    // Time to update all the children of the displayObject with the new matrix..
    var children = displayObject.children;

    for(var i=0,j=children.length; i<j; i++)
    {
        children[i].updateTransform();
    }

    displayObject.game._qc.renderInRenderTexture = false;

    // time for the webGL fun stuff!
    var gl = this.renderer.gl;

    gl.viewport(0, 0, this.width * this.resolution, this.height * this.resolution);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureBuffer.frameBuffer );

    if(clear)this.textureBuffer.clear();

    this.renderer.spriteBatch.dirty = true;

    this.renderer.renderDisplayObject(displayObject, this.projection, this.textureBuffer.frameBuffer);

    this.renderer.spriteBatch.dirty = true;
    displayObject._isNotNeedCalcTransform = false;
};

/**
 * This function will draw the display object to the texture.
 *
 * @method renderCanvas
 * @param displayObject {DisplayObject} The display object to render this texture on
 * @param [matrix] {Matrix} Optional matrix to apply to the display object before rendering.
 * @param [clear] {Boolean} If true the texture will be cleared before the displayObject is drawn
 * @private
 */
PIXI.RenderTexture.prototype.renderCanvas = function(displayObject, matrix, clear)
{
    if(!this.valid)return;

    displayObject.game._qc.renderInRenderTexture = true;

    var wt = displayObject.worldTransform;
    wt.identity();
    if(matrix)wt.append(matrix);

    // setWorld Alpha to ensure that the object is renderer at full opacity
    displayObject.worldAlpha = 1;
    displayObject._isSubNeedCalcTransform = true;
    // Time to update all the children of the displayObject with the new matrix..
    var children = displayObject.children;

    for(var i = 0, j = children.length; i < j; i++)
    {
        children[i].updateTransform();
    }

    displayObject.game._qc.renderInRenderTexture = false;

    if(clear)this.textureBuffer.clear();

    var context = this.textureBuffer.context;

    var realResolution = this.renderer.resolution;

    this.renderer.resolution = this.resolution;

    this.renderer.renderDisplayObject(displayObject, context);

    this.renderer.resolution = realResolution;
    displayObject._isNotNeedCalcTransform = false;
};
