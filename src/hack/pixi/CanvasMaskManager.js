/**
 * @hackpp 在安卓uc浏览器下，在mask中绘制大小大概大于70*70时，会影响下一个超过128*128大小的图形绘制
 */
PIXI.CanvasMaskManager.prototype.popMask = function(renderSession)
{
    renderSession.context.restore();
    if (qc.__IS_ANDROID_UC) {
		var tempCanvas = qc._tempCanvas;
		if (!tempCanvas) {
			  tempCanvas = qc._tempCanvas = document.createElement('canvas');
			  tempCanvas.width = 128;
			  tempCanvas.height = 128;
		}
		renderSession.context.drawImage(tempCanvas, 0, 0, 2, 2, -5, -5, 1, 1);	
    }
	  
};