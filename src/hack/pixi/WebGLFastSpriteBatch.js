/**
 * Created by chenqx on 8/5/15.
 * @hack 添加三角形绘制提交方式
 */
var oldWebGLFastSpriteBatchSetContext = PIXI.WebGLFastSpriteBatch.prototype.setContext;
PIXI.WebGLFastSpriteBatch.prototype.setContext = function(gl) {
    oldWebGLFastSpriteBatchSetContext.call(this, gl);
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

var oldWebGLFastSpriteBatchDestroy = PIXI.WebGLFastSpriteBatch.prototype.destroy;
PIXI.WebGLFastSpriteBatch.prototype.destroy = function() {
    this.triangleIndices = null;
    this.gl.deleteBuffer(this.triangleIndexBuffer);
    oldWebGLFastSpriteBatchDestroy.call(this);
}

Object.defineProperties(PIXI.WebGLFastSpriteBatch.prototype,{
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

PIXI.WebGLFastSpriteBatch.prototype.flush = function()
{
    // If the batch is length 0 then return as there is nothing to draw
    if (this.currentBatchSize===0)return;

    var gl = this.gl;

    // bind the current texture

    if(!this.currentBaseTexture._glTextures[gl.id])this.renderSession.renderer.updateTexture(this.currentBaseTexture, gl);

    gl.bindTexture(gl.TEXTURE_2D, this.currentBaseTexture._glTextures[gl.id]);

    // upload the verts to the buffer

    if(this.currentBatchSize > ( this.size * 0.5 ) )
    {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    }
    else
    {
        var view = this.vertices.subarray(0, this.currentBatchSize * 4 * this.vertSize);

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
    }
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.batchIndexNumber === 3 ? this.triangleIndexBuffer : this.indexBuffer);
    // now draw those suckas!
    gl.drawElements(gl.TRIANGLES, this.currentBatchSize * this.batchIndexNumber, gl.UNSIGNED_SHORT, 0);

    // then reset the batch!
    this.currentBatchSize = 0;

    // increment the draw count
    this.renderSession.drawCount++;
};