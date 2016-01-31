// @hackpp PIXI.WebGLMaskManager 中 popMask和pushMask不匹配的问题
PIXI.WebGLMaskManager.prototype.popMask = function(maskData, renderSession)
{
    var gl = this.gl;
    if(!maskData._webGL[gl.id].data.length)return;
    renderSession.stencilManager.popStencil(maskData, maskData._webGL[gl.id].data[0], renderSession);
};