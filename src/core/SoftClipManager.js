/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 软件裁切的管理，使用多边形裁切算法，对节点进行裁切
 * @type {Function}
 */
var SoftClipManager = qc.SoftClipManager = function(renderSession) {
    /**
     * @property {WebGLRenderSession} renderSession - 绘制上下文
     */
    this.renderSession = renderSession;

    /**
     * @property {[]} _polygons - 当前裁切的多边形
     * @private
     */
    this._polygons = [];
};
SoftClipManager.prototype = {};
SoftClipManager.prototype.constructor = SoftClipManager;

Object.defineProperties(SoftClipManager.prototype, {
    /**
     * @property {boolean} needClip - 是否需要裁切
     */
    needClip : {
        get : function() {
            return !!this._polygons.length;
        }
    }
});

/**
 * 获取裁切管理器
 * @param renderSession
 * @returns {SoftClipManager|*|softClipManager}
 */
SoftClipManager.getManager = function(renderSession) {
    var clipMgr = renderSession.softClipManager;
    if (!clipMgr) {
        clipMgr = renderSession.softClipManager = new SoftClipManager(renderSession);
    }
    return clipMgr;
};

/**
 * 添加一个裁切多边形
 * @param polygon
 */
SoftClipManager.prototype.pushPolygon = function(polygon) {
    var self = this;
    var polygons = [];
    self.renderSession.spriteBatch.batchType = qc.BATCH_TRIANGLES;
    if (!self._polygons.length) {
        var len = arguments.length;
        while (len--) {
            var one = arguments[len];
            var ret = qc.GeometricTool.quickDecomp(one);
            if (ret.length)
                Array.prototype.push.apply(polygons, ret);
            else {
                var tri = GeometricTool.Triangulate(one);
                for (var idx = 0; idx < tri.length; idx += 3) {
                    var first = tri[idx];
                    var second = tri[idx + 1];
                    var third = tri[idx + 2];

                    polygons.push([
                        one[first],
                        one[second],
                        one[third]
                    ]);
                }
            }
        }
        self._polygons.push(polygons);
        return;
    }
    var last = self._polygons[self._polygons.length - 1];
    var lastLen = last.length;
    while (lastLen--) {
        var mask = last[lastLen];
        var len = arguments.length;
        while (len--) {
            polygon = arguments[len];
            var ret = qc.GeometricTool.sutherlandHodgman(polygon, mask);
            polygons.push(ret);
        }
    }
    self._polygons.push(polygons);
};

/**
 * 移除最后一个裁切多边形
 * @param polygon
 */
SoftClipManager.prototype.popPolygon = function() {
    var self = this;
    if (self._polygons.length) {
        self._polygons.splice(self._polygons.length - 1, 1);
    }
    if (!self._polygons.length) {
        self.renderSession.spriteBatch.batchType = qc.BATCH_QUAD;
    }
};

/**
 * 得到当前变换矩阵下的裁切多边形
 * @param a
 * @param b
 * @param c
 * @param d
 * @param tx
 * @param ty
 */
SoftClipManager.prototype.getClipPolygon = function(a, b, c, d, tx, ty) {
    var self = this;
    var masks = [];
    var last = self._polygons[self._polygons.length - 1];
    var lastLen = last.length;

    var id = 1 / (a * d + c * -b);
    a *= id;
    b *= id;
    c *= id;
    d *= id;
    var offX = ty * c - tx * d;
    var offY = -ty * a + tx * b;
    var index = -1;
    while (++index < lastLen) {
        var polygon = last[index];
        var mask = [];
        var pLen = polygon.length;
        var pIndex = -1;
        while (++pIndex < pLen) {
            var point = polygon[pIndex];
            mask.push(new qc.Point(
                d * point.x - c * point.y + offX,
                a * point.y - b * point.x + offY));
        }
        masks.push(mask);
    }
    return masks;
};

/**
 * 绘制一个 sprite
 * @param renderSession
 * @param sprite
 * @param w1
 * @param h1
 * @param w0
 * @param h0
 * @param uvx0
 * @param uvy0
 * @param uvx1
 * @param uvy1
 * @param a
 * @param b
 * @param c
 * @param d
 * @param tx
 * @param ty
 * @param tint
 */
SoftClipManager.prototype.renderSprite = function(renderSession, sprite,
                                                  w1, h1, w0, h0,
                                                  uvx0, uvy0, uvx1, uvy1,
                                                  a, b, c, d, tx, ty,
                                                  tint) {
    var clips = this.getClipPolygon(a, b, c, d, tx, ty);
    if (clips.length === 0)
        return;
    var corner = [
        new qc.Point(w1, h1),
        new qc.Point(w0, h1),
        new qc.Point(w0, h0),
        new qc.Point(w1, h0)
    ];
    var rect = { x : w1, y : h1, width : w0 - w1, height : h0 - h1 };
    if (!rect.width || !rect.height) {
        return;
    }
    var calcUV = function(point, uvx0, uvx1, uvy0, uvy1, rect) {
        return {
            x : uvx0 + (point.x - rect.x) / rect.width * (uvx1 - uvx0),
            y : uvy0 + (point.y - rect.y) / rect.height * (uvy1 - uvy0)
        }
    };

    // 对每个裁切多边形进行裁切
    var clipLen = clips.length;
    while (clipLen--) {
        var clip = clips[clipLen];
        var result = qc.GeometricTool.sutherlandHodgman(clip, corner);
        var retLen = result.length;
        if (retLen < 3)
            continue;
        var uvs = [];
        var worldPos = [];
        var idx = -1;
        while (++idx < retLen) {
            uvs[idx] = calcUV(result[idx], uvx0, uvx1, uvy0, uvy1, rect);
            worldPos.push({
                x : a * result[idx].x + c * result[idx].y + tx,
                y : d * result[idx].y + b * result[idx].x + ty

            });
        }
        var tmp = qc.GeometricTool.Triangulate(worldPos);
        if (!tmp)
            continue;
        for (var idx = 0; idx < tmp.length; idx += 3) {
            var first = tmp[idx];
            var second = tmp[idx + 1];
            var third = tmp[idx + 2];

            this._addWebGLTriangle(renderSession.spriteBatch, sprite, tint,
                worldPos[first], worldPos[second], worldPos[third],
                uvs[first], uvs[second], uvs[third]
            )
        }
    }
};

/**
 * 添加一个三角形
 * @param spriteBatch
 * @param sprite
 * @param tint
 * @param p1
 * @param p2
 * @param p3
 * @param uv1
 * @param uv2
 * @param uv3
 * @private
 */
SoftClipManager.prototype._addWebGLTriangle = function(spriteBatch, sprite, tint, p1, p2, p3, uv1, uv2, uv3) {
    if(spriteBatch.currentBatchSize >= spriteBatch.triangleSize)
    {
        spriteBatch.flush();
        spriteBatch.currentBaseTexture = sprite.texture.baseTexture;
    }

    var colors = spriteBatch.colors;
    var positions = spriteBatch.positions;
    var index = spriteBatch.currentBatchSize * 3 * spriteBatch.vertSize;


    if(spriteBatch.renderSession.roundPixels)
    {
        // xy
        positions[index] = p1.x | 0;
        positions[index+1] = p1.y | 0;

        // xy
        positions[index+5] = p2.x | 0;
        positions[index+6] = p2.y | 0;

        // xy
        positions[index+10] = p3.x | 0;
        positions[index+11] = p3.y | 0;
    }
    else
    {
        // xy
        positions[index] = p1.x;
        positions[index+1] = p1.y;

        // xy
        positions[index+5] = p2.x;
        positions[index+6] = p2.y;

        // xy
        positions[index+10] = p3.x;
        positions[index+11] = p3.y;
    }

    // uv
    positions[index+2] = uv1.x;
    positions[index+3] = uv1.y;

    // uv
    positions[index+7] = uv2.x;
    positions[index+8] = uv2.y;

    // uv
    positions[index+12] = uv3.x;
    positions[index+13] = uv3.y;

    // color and alpha
    colors[index+4] = colors[index+9] = colors[index+14] = tint;

    // increment the batchsize
    spriteBatch.sprites[spriteBatch.currentBatchSize++] = sprite;

};