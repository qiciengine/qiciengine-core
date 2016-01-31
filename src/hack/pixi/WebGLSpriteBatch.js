/**
 * Created by chenqx on 8/5/15.
 * @hack 添加三角形绘制提交方式
 */
/**
 * 以四边形填充
 * @constant
 * @type {number}
 */
qc.BATCH_QUAD = 0;
/**
 * 以三角形填充
 * @constant
 * @type {number}
 */
qc.BATCH_TRIANGLES  = 1;


var oldWebGLSpriteBatchSetContext = PIXI.WebGLSpriteBatch.prototype.setContext;
PIXI.WebGLSpriteBatch.prototype.setContext = function(gl) {
    oldWebGLSpriteBatchSetContext.call(this, gl);
    this.quadSize = this.size;
    this.triangleSize = 300;
    this.batchIndexNumber = 6;
    var triangleIndicesNum = this.triangleSize * 3;
    this.triangleIndices = new PIXI.Uint16Array(triangleIndicesNum);
    for (var i = 0; i < triangleIndicesNum; ++i) {
        this.triangleIndices[i] = i;
    }
    this._batchType = qc.BATCH_QUAD;
    this.quadIndexBuffer = this.indexBuffer;
    this.triangleIndexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndices, gl.STATIC_DRAW);
};

var oldWebGLSpriteBatchDestroy = PIXI.WebGLSpriteBatch.prototype.destroy;
PIXI.WebGLSpriteBatch.prototype.destroy = function() {
    this.triangleIndices = null;
    this.gl.deleteBuffer(this.triangleIndexBuffer);
    oldWebGLSpriteBatchDestroy.call(this);
}

Object.defineProperties(PIXI.WebGLSpriteBatch.prototype,{
    batchType : {
        get : function() { return this._batchType; },
        set : function(v) {
            if (v === this._batchType) {
                return;
            }
            this.stop();
            // 切换IndexBuffer，Size
            if (v === qc.BATCH_TRIANGLES) {
                this.size = this.triangleSize;
                this.indexBuffer = this.triangleIndexBuffer;
                this._batchType = v;
                this.batchIndexNumber = 3;
            }
            else {
                this.size = this.quadSize;
                this.indexBuffer = this.quadIndexBuffer;
                this._batchType = v;
                this.batchIndexNumber = 6;
            }
            this.start();
        }
    }
});

/**
 * @method renderBatch
 * @param texture {Texture}
 * @param size {Number}
 * @param startIndex {Number}
 */
PIXI.WebGLSpriteBatch.prototype.renderBatch = function(texture, size, startIndex)
{
    if(size === 0)return;

    var gl = this.gl;

    // check if a texture is dirty..
    if(texture._dirty[gl.id])
    {
        this.renderSession.renderer.updateTexture(texture);
    }
    else
    {
        // bind the current texture
        gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);
    }
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.batchIndexNumber === 3 ? this.triangleIndexBuffer : this.indexBuffer);
    // now draw those suckas!
    gl.drawElements(gl.TRIANGLES, size * this.batchIndexNumber, gl.UNSIGNED_SHORT, startIndex * this.batchIndexNumber * 2);

    // increment the draw count
    this.renderSession.drawCount++;
};