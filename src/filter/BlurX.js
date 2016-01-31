/**
* A horizontal blur filter by Mat Groves http://matgroves.com/ @Doormat23
*/
var BlurX = defineFilter('qc.Filter.BlurX', qc.Filter, function(game) {
    this.fragmentSrc = [

      "precision mediump float;",
      "varying vec2 vTextureCoord;",
      "varying vec4 vColor;",
      "uniform float blur;",
      "uniform sampler2D uSampler;",
      "uniform vec2 pixelSize;",

        "void main(void) {",

          "vec4 sum = vec4(0.0);",

          "sum += texture2D(uSampler, vec2(vTextureCoord.x - 4.0*blur*pixelSize.x, vTextureCoord.y)) * 0.05;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x - 3.0*blur*pixelSize.x, vTextureCoord.y)) * 0.09;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x - 2.0*blur*pixelSize.x, vTextureCoord.y)) * 0.12;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x - blur*pixelSize.x, vTextureCoord.y)) * 0.15;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y)) * 0.16;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x + blur*pixelSize.x, vTextureCoord.y)) * 0.15;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x + 2.0*blur*pixelSize.x, vTextureCoord.y)) * 0.12;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x + 3.0*blur*pixelSize.x, vTextureCoord.y)) * 0.09;",
          "sum += texture2D(uSampler, vec2(vTextureCoord.x + 4.0*blur*pixelSize.x, vTextureCoord.y)) * 0.05;",
          "gl_FragColor = sum;",

        "}"
    ];

    this.blur = 1;
},{
    blur : qc.Filter.F1
});

Object.defineProperty(BlurX.prototype, 'blur', {

    get: function() {
        return this._blur;
    },

    set: function(value) {
        this.dirty = true;
        this._blur = value;
    }

});