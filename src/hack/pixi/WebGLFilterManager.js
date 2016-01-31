
// @hackpp PIXI.WebGLFilterManager 中 mask 和 filter 不兼容的问题

/**
 * Initialises the shader buffers.
 *
 * @method initShaderBuffers
 */
PIXI.WebGLFilterManager.prototype.initShaderBuffers = function()
{
    var gl = this.gl;

    // create some buffers
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    // bind and upload the vertexs..
    // keep a reference to the vertexFloatData..
    this.vertexArray = new PIXI.Float32Array([0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.STATIC_DRAW);

    // bind and upload the uv buffer
    this.uvArray = new PIXI.Float32Array(Filter.MAX_SAMPLE_COUNT * 8);
    //  [0.0, 0.0,
    //    1.0, 0.0,
    //    0.0, 1.0,
    //    1.0, 1.0]

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvArray, gl.STATIC_DRAW);

    this.colorArray = new PIXI.Float32Array([1.0, 0xFFFFFF,
        1.0, 0xFFFFFF,
        1.0, 0xFFFFFF,
        1.0, 0xFFFFFF]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorArray, gl.STATIC_DRAW);

    // bind and upload the index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 3, 2]), gl.STATIC_DRAW);

};

/**
 * Applies the filter and adds it to the current filter stack.
 *
 * @method pushFilter
 * @param filterBlock {Object} the filter that will be pushed to the current filter stack
 */
PIXI.WebGLFilterManager.prototype.pushFilter = function(filterBlock)
{
    var gl = this.gl;

    var projection = this.renderSession.projection;
    var offset = this.renderSession.offset;

    filterBlock._filterArea = filterBlock.target.filterArea || filterBlock.target.getBounds();

    // modify by chenqx
    filterBlock._previous_stencil_mgr = this.renderSession.stencilManager;
    this.renderSession.stencilManager = new PIXI.WebGLStencilManager();
    this.renderSession.stencilManager.setContext(gl);
    gl.disable(gl.STENCIL_TEST);
    // modify end

    // filter program
    // OPTIMISATION - the first filter is free if its a simple color change?
    this.filterStack.push(filterBlock);

    var filter = filterBlock.filterPasses[0];

    this.offsetX += filterBlock._filterArea.x;
    this.offsetY += filterBlock._filterArea.y;

    var texture = this.texturePool.pop();
    if(!texture)
    {
        texture = new PIXI.FilterTexture(this.gl, this.width, this.height);
    }
    else
    {
        texture.resize(this.width, this.height);
    }

    gl.bindTexture(gl.TEXTURE_2D,  texture.texture);

    var filterArea = filterBlock._filterArea;// filterBlock.target.getBounds();///filterBlock.target.filterArea;

    var padding = filter.padding;
    filterArea.x -= padding;
    filterArea.y -= padding;
    filterArea.width += padding * 2;
    filterArea.height += padding * 2;

    // cap filter to screen size..
    /**
    if(filterArea.x < 0)filterArea.x = 0;
    if(filterArea.width > this.width)filterArea.width = this.width;
    if(filterArea.y < 0)filterArea.y = 0;
    if(filterArea.height > this.height)filterArea.height = this.height;
    **/
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  filterArea.width, filterArea.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, texture.frameBuffer);

    // set view port
    gl.viewport(0, 0, filterArea.width, filterArea.height);

    projection.x = filterArea.width/2;
    projection.y = -filterArea.height/2;

    offset.x = -filterArea.x;
    offset.y = -filterArea.y;


    // update projection
    // now restore the regular shader..
    // this.renderSession.shaderManager.setShader(this.defaultShader);
    //gl.uniform2f(this.defaultShader.projectionVector, filterArea.width/2, -filterArea.height/2);
    //gl.uniform2f(this.defaultShader.offsetVector, -filterArea.x, -filterArea.y);

    gl.colorMask(true, true, true, true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    filterBlock._glFilterTexture = texture;

};

/**
 * Removes the last filter from the filter stack and doesn't return it.
 *
 * @method popFilter
 */
PIXI.WebGLFilterManager.prototype.popFilter = function()
{
    var gl = this.gl;
    var filterBlock = this.filterStack.pop();
    var filterArea = filterBlock._filterArea;
    var texture = filterBlock._glFilterTexture;
    var tempTexture = filterBlock._glFilterTexture;
    var projection = this.renderSession.projection;
    var offset = this.renderSession.offset;

    if(filterBlock.filterPasses.length > 1)
    {
        gl.viewport(0, 0, filterArea.width, filterArea.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        this.vertexArray[0] = 0;
        this.vertexArray[1] = filterArea.height;

        this.vertexArray[2] = filterArea.width;
        this.vertexArray[3] = filterArea.height;

        this.vertexArray[4] = 0;
        this.vertexArray[5] = 0;

        this.vertexArray[6] = filterArea.width;
        this.vertexArray[7] = 0;

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexArray);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        // now set the uvs..
        this.uvArray[0] = 0;
        this.uvArray[1] = 0;
        this.uvArray[2] = filterArea.width/this.width;
        this.uvArray[3] = 0;
        this.uvArray[4] = 0;
        this.uvArray[5] = filterArea.height/this.height;
        this.uvArray[6] = filterArea.width/this.width;
        this.uvArray[7] = filterArea.height/this.height;

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvArray);

        var inputTexture = texture;
        var outputTexture = this.texturePool.pop();
        if(!outputTexture)outputTexture = new PIXI.FilterTexture(this.gl, this.width, this.height);
        outputTexture.resize(this.width, this.height);

        // need to clear this FBO as it may have some left over elements from a previous filter.
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputTexture.frameBuffer );
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.BLEND);

        for (var i = 0; i < filterBlock.filterPasses.length-1; i++)
        {
            var filterPass = filterBlock.filterPasses[i];
            var extraAttribute = filterPass.extraAttribute;
            if (extraAttribute) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
                for (var idx = 0; idx < extraAttribute.length; ++idx) {
                    var filterTexture = filterPass.uniforms[extraAttribute[idx].texture].value;
                    if (!filterTexture)
                        continue;
                    var spriteUVS = filterTexture._uvs;
                    this.uvArray[8 * (idx + 1)] = spriteUVS.x3;
                    this.uvArray[8 * (idx + 1) + 1] = spriteUVS.y3;
                    this.uvArray[8 * (idx + 1) + 2] = spriteUVS.x2;
                    this.uvArray[8 * (idx + 1) + 3] = spriteUVS.y2;
                    this.uvArray[8 * (idx + 1) + 4] = spriteUVS.x0;
                    this.uvArray[8 * (idx + 1) + 5] = spriteUVS.y0;
                    this.uvArray[8 * (idx + 1) + 6] = spriteUVS.x1;
                    this.uvArray[8 * (idx + 1) + 7] = spriteUVS.y1;
                }
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvArray);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, outputTexture.frameBuffer );

            // set texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, inputTexture.texture);

            // draw texture..
            //filterPass.applyFilterPass(filterArea.width, filterArea.height);
            this.applyFilterPass(filterPass, filterArea, filterArea.width, filterArea.height, tempTexture);

            // swap the textures..
            var temp = inputTexture;
            inputTexture = outputTexture;
            if (temp === tempTexture) {
                outputTexture = this.texturePool.pop();
                if(!outputTexture)outputTexture = new PIXI.FilterTexture(this.gl, this.width, this.height);
            }
            else {
                outputTexture = temp;
            }
        }

        gl.enable(gl.BLEND);

        texture = inputTexture;
        this.texturePool.push(outputTexture);
    }

    var filter = filterBlock.filterPasses[filterBlock.filterPasses.length-1];

    this.offsetX -= filterArea.x;
    this.offsetY -= filterArea.y;

    var sizeX = this.width;
    var sizeY = this.height;

    var offsetX = 0;
    var offsetY = 0;

    var buffer = this.buffer;

    // time to render the filters texture to the previous scene
    if(this.filterStack.length === 0)
    {
        gl.colorMask(true, true, true, true);//this.transparent);
    }
    else
    {
        var currentFilter = this.filterStack[this.filterStack.length-1];
        filterArea = currentFilter._filterArea;

        sizeX = filterArea.width;
        sizeY = filterArea.height;

        offsetX = filterArea.x;
        offsetY = filterArea.y;

        buffer =  currentFilter._glFilterTexture.frameBuffer;
    }

    // TODO need to remove these global elements..
    projection.x = sizeX/2;
    projection.y = -sizeY/2;

    offset.x = offsetX;
    offset.y = offsetY;

    filterArea = filterBlock._filterArea;

    var x = filterArea.x-offsetX;
    var y = filterArea.y-offsetY;

    // update the buffers..
    // make sure to flip the y!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    this.vertexArray[0] = x;
    this.vertexArray[1] = y + filterArea.height;

    this.vertexArray[2] = x + filterArea.width;
    this.vertexArray[3] = y + filterArea.height;

    this.vertexArray[4] = x;
    this.vertexArray[5] = y;

    this.vertexArray[6] = x + filterArea.width;
    this.vertexArray[7] = y;

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    this.uvArray[0] = 0;
    this.uvArray[1] = 0;
    this.uvArray[2] = filterArea.width/this.width;
    this.uvArray[3] = 0;
    this.uvArray[4] = 0;
    this.uvArray[5] = filterArea.height/this.height;
    this.uvArray[6] = filterArea.width/this.width;
    this.uvArray[7] = filterArea.height/this.height;

    var extraAttribute = filter.extraAttribute;
    if (extraAttribute) {
        for (var idx = 0; idx < extraAttribute.length; ++idx) {
            var filterTexture = filter.uniforms[extraAttribute[idx].texture].value;
            if (!filterTexture)
                continue;
            var spriteUVS = filterTexture._uvs;
            this.uvArray[8 * (idx + 1)] = spriteUVS.x3;
            this.uvArray[8 * (idx + 1) + 1] = spriteUVS.y3;
            this.uvArray[8 * (idx + 1) + 2] = spriteUVS.x2;
            this.uvArray[8 * (idx + 1) + 3] = spriteUVS.y2;
            this.uvArray[8 * (idx + 1) + 4] = spriteUVS.x0;
            this.uvArray[8 * (idx + 1) + 5] = spriteUVS.y0;
            this.uvArray[8 * (idx + 1) + 6] = spriteUVS.x1;
            this.uvArray[8 * (idx + 1) + 7] = spriteUVS.y1;
        }
    }

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvArray);

    gl.viewport(0, 0, sizeX * this.renderSession.resolution, sizeY * this.renderSession.resolution);

    // bind the buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer );

    // set the blend mode!
    //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // set texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);

    // modify by chenqx
    if (this.renderSession.stencilManager) {
        this.renderSession.stencilManager.destroy();
    }
    this.renderSession.stencilManager = filterBlock._previous_stencil_mgr;
    filterBlock._previous_stencil_mgr = null;
    if (this.renderSession.stencilManager.count > 0) {
        gl.enable(gl.STENCIL_TEST);
    }
    else {
        gl.disable(gl.STENCIL_TEST);
    }
    // modify end

    // apply!
    this.applyFilterPass(filter, filterArea, sizeX, sizeY, tempTexture);

    // now restore the regular shader.. should happen automatically now..
    // this.renderSession.shaderManager.setShader(this.defaultShader);
    // gl.uniform2f(this.defaultShader.projectionVector, sizeX/2, -sizeY/2);
    // gl.uniform2f(this.defaultShader.offsetVector, -offsetX, -offsetY);
    if (texture !== tempTexture) {
        this.texturePool.push(tempTexture);
    }
    // return the texture to the pool
    this.texturePool.push(texture);
    filterBlock._glFilterTexture = null;
};

PIXI.WebGLFilterManager.prototype.buildFilterTexture = function(renderSession, filterBlock, sprite) {
    var gl = renderSession.gl;
    var enabledStencilTest = gl.isEnabled(gl.STENCIL_TEST);
    if (enabledStencilTest) {
        gl.disable(gl.STENCIL_TEST);
    }
    var baseTexture = sprite.texture.baseTexture;
    if(!baseTexture._glTextures[gl.id]) {
        renderSession.renderer.updateTexture(baseTexture, gl);
    }
    var glTexture = baseTexture._glTextures[gl.id];
    var tempTexture = { texture : glTexture };
    var textureSize = new qc.Rectangle(0, 0, baseTexture.width, baseTexture.height);
    var spriteSize = sprite.texture.crop;
    var spriteUVS = sprite.texture._uvs;

    var outputTexture = this.texturePool.pop();
    if(!outputTexture) {
        outputTexture = new PIXI.FilterTexture(this.gl, textureSize.width, textureSize.height);
    }
    outputTexture.resize(textureSize.width, textureSize.height);

    // need to clear this FBO as it may have some left over elements from a previous filter.
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputTexture.frameBuffer);
    gl.viewport(0, 0, textureSize.width, textureSize.height);
    gl.colorMask(true, true, true, true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.BLEND);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    this.vertexArray[0] = spriteSize.x;
    this.vertexArray[1] = textureSize.height - spriteSize.y;

    this.vertexArray[2] = spriteSize.x + spriteSize.width;
    this.vertexArray[3] = textureSize.height - spriteSize.y;

    this.vertexArray[4] = spriteSize.x;
    this.vertexArray[5] = textureSize.height - spriteSize.y - spriteSize.height;

    this.vertexArray[6] = spriteSize.x + spriteSize.width;
    this.vertexArray[7] = textureSize.height - spriteSize.y - spriteSize.height;

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexArray);

    var filterPass = filterBlock.filterPasses[0];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    // now set the uvs..
    this.uvArray[0] = spriteUVS.x0;
    this.uvArray[1] = spriteUVS.y0;
    this.uvArray[2] = spriteUVS.x1;
    this.uvArray[3] = spriteUVS.y1;
    this.uvArray[4] = spriteUVS.x3;
    this.uvArray[5] = spriteUVS.y3;
    this.uvArray[6] = spriteUVS.x2;
    this.uvArray[7] = spriteUVS.y2;
    var extraAttribute = filterPass.extraAttribute;
    if (extraAttribute) {
        for (var idx = 0; idx < extraAttribute.length; ++idx) {
            var filterTexture = filterPass.uniforms[extraAttribute[idx].texture].value;
            if (!filterTexture)
                continue;
            var spriteUVS = filterTexture._uvs;
            this.uvArray[8 * (idx + 1)] = spriteUVS.x0;
            this.uvArray[8 * (idx + 1) + 1] = spriteUVS.y0;
            this.uvArray[8 * (idx + 1) + 2] = spriteUVS.x1;
            this.uvArray[8 * (idx + 1) + 3] = spriteUVS.y1;
            this.uvArray[8 * (idx + 1) + 4] = spriteUVS.x3;
            this.uvArray[8 * (idx + 1) + 5] = spriteUVS.y3;
            this.uvArray[8 * (idx + 1) + 6] = spriteUVS.x2;
            this.uvArray[8 * (idx + 1) + 7] = spriteUVS.y2;
        }
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvArray);

    // set texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tempTexture.texture);

    this.applyFilterPass(filterPass, new qc.Rectangle(0, 0, textureSize.width, textureSize.height), textureSize.width, textureSize.height, tempTexture, textureSize.width, textureSize.height);

    var inputTexture = null;

    for (var i = 1; i < filterBlock.filterPasses.length; i++)
    {
        var temp = inputTexture;
        inputTexture = outputTexture;
        outputTexture = temp;
        if (!outputTexture) {
            outputTexture = this.texturePool.pop();
            if(!outputTexture) {
                outputTexture = new PIXI.FilterTexture(this.gl, textureSize.width, textureSize.height);
            }
            outputTexture.resize(textureSize.width, textureSize.height);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._filterSelfUVArray);

        var filterPass = filterBlock.filterPasses[i];


        // now set the uvs..
        var extraAttribute = filterPass.extraAttribute;
        if (extraAttribute) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            for (var idx = 0; idx < extraAttribute.length; ++idx) {
                var filterTexture = filterPass.uniforms[extraAttribute[idx].texture].value;
                if (!filterTexture)
                    continue;
                var spriteUVS = filterTexture._uvs;
                this.uvArray[8 * (idx + 1)] = spriteUVS.x0;
                this.uvArray[8 * (idx + 1) + 1] = spriteUVS.y0;
                this.uvArray[8 * (idx + 1) + 2] = spriteUVS.x1;
                this.uvArray[8 * (idx + 1) + 3] = spriteUVS.y1;
                this.uvArray[8 * (idx + 1) + 4] = spriteUVS.x3;
                this.uvArray[8 * (idx + 1) + 5] = spriteUVS.y3;
                this.uvArray[8 * (idx + 1) + 6] = spriteUVS.x2;
                this.uvArray[8 * (idx + 1) + 7] = spriteUVS.y2;
            }
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvArray);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, outputTexture.frameBuffer );

        // set texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture.texture);

        // draw texture..
        this.applyFilterPass(filterPass, new qc.Rectangle(0, 0, textureSize.width, textureSize.height), textureSize.width, textureSize.height, tempTexture, textureSize.width, textureSize.height);
    }
    if (enabledStencilTest) {
        gl.enable(gl.STENCIL_TEST);
    }
    gl.enable(gl.BLEND);
    gl.viewport(0, 0, this.width * this.renderSession.resolution, this.height * this.renderSession.resolution);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);

    gl.colorMask(true, true, true, true);
    return outputTexture;
};

/**
 * Applies the filter to the specified area.
 *
 * @method applyFilterPass
 * @param filter {AbstractFilter} the filter that needs to be applied
 * @param filterArea {Texture} TODO - might need an update
 * @param width {Number} the horizontal range of the filter
 * @param height {Number} the vertical range of the filter
 */
PIXI.WebGLFilterManager.prototype.applyFilterPass = function(filter, filterArea, width, height, tempTexture, buffWidth, buffHeight)
{
    // use program
    var gl = this.gl;
    var shader = filter.shaders[gl.id];

    if(!shader)
    {
        shader = new PIXI.PixiShader(gl);

        shader.fragmentSrc = filter.fragmentSrc;
        if (filter.vertexSrc) {
            shader.vertexSrc = filter.vertexSrc;
        }
        shader.uniforms = filter.uniforms;
        if (filter.extraAttribute) {
            shader.extraAttribute = filter.extraAttribute;
        }
        shader.init();

        filter.shaders[gl.id] = shader;
    }

    // set the shader
    this.renderSession.shaderManager.setShader(shader);

//    gl.useProgram(shader.program);
    buffWidth = isNaN(buffWidth) ? this.width : buffWidth;
    buffHeight = isNaN(buffHeight) ? this.height : buffHeight;
    gl.uniform2f(shader.projectionVector, width/2, -height/2);
    gl.uniform2f(shader.offsetVector, 0,0);
    if (shader.pixelSize) {
        gl.uniform2f(shader.pixelSize, 1/buffWidth, 1/buffHeight);
    }

    if(filter.uniforms.dimensions)
    {
        filter.uniforms.dimensions.value[0] = buffWidth;//width;
        filter.uniforms.dimensions.value[1] = buffHeight;//height;
        filter.uniforms.dimensions.value[2] = this.vertexArray[0];
        filter.uniforms.dimensions.value[3] = this.vertexArray[5];//filterArea.height;
    }
    shader.syncUniforms();

    // modify by chenqx
    if (shader.uSourceSampler && tempTexture) {
        var currTextureCount = shader.textureCount++;
        gl.activeTexture(gl['TEXTURE' + currTextureCount]);
        gl.bindTexture(gl.TEXTURE_2D, tempTexture.texture);
        gl.uniform1i(shader.uSourceSampler, currTextureCount);
    }
    // modify end

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    var oneTextureLen = 32;
    var extraAttribute = filter.extraAttribute;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
    if (extraAttribute) {
        for (var idx = 0; idx < extraAttribute.length; ++idx) {
            gl.vertexAttribPointer(shader[extraAttribute[idx].name], 2, gl.FLOAT, false, 0, (idx + 1) * 32);
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(shader.colorAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // draw the filter...
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0 );

    this.renderSession.drawCount++;
};