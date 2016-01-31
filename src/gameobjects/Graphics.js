/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Graphics，集合图形绘制
 * @constructor
 * @internal
 */
var Graphics = qc.Graphics = function(game, parent, uuid) {
    var self = this;
    self.game = game;

    // 调用基类的初始
    qc.Node.call(this, new Phaser.Graphics(this.game.phaser), parent, uuid);
    self.name = 'graphics';
};
Graphics.prototype = Object.create(qc.Node.prototype);
Graphics.prototype.constructor = Graphics;

Object.defineProperties(Graphics.prototype, {
    /**
     * @property {string} class - 类的名字
     * @internal
     */
    class: {
        get : function() { return 'qc.Graphics'; }
    },

    /**
     * The alpha value used when filling the Graphics object.
     *
     * @property fillAlpha
     * @type Number
     */
    fillAlpha: {
        get: function() { return this.phaser.fillAlpha; },
        set: function(v) { this.phaser.fillAlpha = v; }
    },

    /**
     * The width (thickness) of any lines drawn.
     *
     * @property lineWidth
     * @type Number
     */
    lineWidth: {
        get: function() { return this.phaser.lineWidth; },
        set: function(v) { this.phaser.lineWidth = v; }
    },

    /**
     * The color of any lines drawn.
     *
     * @property lineColor
     * @type String
     * @default 0
     */
    lineColor: {
        get: function() { return this.phaser.lineColor; },
        set: function(v) { this.phaser.lineColor = v; }
    },

    /**
     * The blend mode to be applied to the graphic shape. Apply a value of qc.blendModes.NORMAL to reset the blend mode.
     *
     * @property blendMode
     * @type Number
     * @default PIXI.blendModes.NORMAL;
     */
    blendMode: {
        get: function() { return this.phaser.blendMode; },
        set: function(v) { this.phaser.blendMode = v; }
    },
    
    /**
     * The bounds' padding used for bounds calculation.
     *
     * @property boundsPadding
     * @type Number
     */
    boundsPadding: {
        get: function() { return this.phaser.boundsPadding; },
        set: function(v) {
            this.phaser.boundsPadding = v;
        }
    }
});

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
Graphics.prototype.getMeta = function() {
    var self = this;
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加Graphics需要序列化的内容
    return json;
};

/*
 * Draws a single {qc.Polygon} triangle from a {qc.Point} array
 *
 * @method qc.Graphics.prototype.drawTriangle
 * @param {Array<qc.Point>} points - An array of qc.Points that make up the three vertices of this triangle
 * @param {boolean} [cull=false] - Should we check if the triangle is back-facing
 */
Graphics.prototype.drawTriangle = function(points, cull) {
    return this.phaser.drawTriangle(points, cull);
};

/*
 * Draws {qc.Polygon} triangles
 *
 * @method qc.Graphics.prototype.drawTriangles
 * @param {Array<qc.Point>|Array<number>} vertices - An array of qc.Points or numbers that make up the vertices of the triangles
 * @param {Array<number>} {indices=null} - An array of numbers that describe what order to draw the vertices in
 * @param {boolean} [cull=false] - Should we check if the triangle is back-facing
 */
Graphics.prototype.drawTriangles = function(vertices, indices, cull) {
    return this.phaser.drawTriangles(vertices, indices, cull);
};

/**
 * Specifies the line style used for subsequent calls to Graphics methods such as the lineTo() method or the drawCircle() method.
 *
 * @method lineStyle
 * @param lineWidth {Number} width of the line to draw, will update the objects stored style
 * @param color {Number} color of the line to draw, will update the objects stored style
 * @param alpha {Number} alpha of the line to draw, will update the objects stored style
 * @return {Graphics}
 */
Graphics.prototype.lineStyle = function(lineWidth, color, alpha) {
    return this.phaser.lineStyle(lineWidth, color, alpha);
};

/**
 * Moves the current drawing position to x, y.
 *
 * @method moveTo
 * @param x {Number} the X coordinate to move to
 * @param y {Number} the Y coordinate to move to
 * @return {Graphics}
 */
Graphics.prototype.moveTo = function(x, y) {
    return this.phaser.moveTo(x, y);
};

/**
 * Draws a line using the current line style from the current drawing position to (x, y);
 * The current drawing position is then set to (x, y).
 *
 * @method lineTo
 * @param x {Number} the X coordinate to draw to
 * @param y {Number} the Y coordinate to draw to
 * @return {Graphics}
 */
Graphics.prototype.lineTo = function(x, y) {
    return this.phaser.lineTo(x, y);
};

/**
 * Calculate the points for a quadratic bezier curve and then draws it.
 * Based on: https://stackoverflow.com/questions/785097/how-do-i-implement-a-bezier-curve-in-c
 *
 * @method quadraticCurveTo
 * @param cpX {Number} Control point x
 * @param cpY {Number} Control point y
 * @param toX {Number} Destination point x
 * @param toY {Number} Destination point y
 * @return {Graphics}
 */
Graphics.prototype.quadraticCurveTo = function(cpX, cpY, toX, toY) {
    return this.quadraticCurveTo(cpX, cpY, toX, toY);
};

/**
 * Calculate the points for a bezier curve and then draws it.
 *
 * @method bezierCurveTo
 * @param cpX {Number} Control point x
 * @param cpY {Number} Control point y
 * @param cpX2 {Number} Second Control point x
 * @param cpY2 {Number} Second Control point y
 * @param toX {Number} Destination point x
 * @param toY {Number} Destination point y
 * @return {Graphics}
 */
Graphics.prototype.bezierCurveTo = function(cpX, cpY, cpX2, cpY2, toX, toY) {
    return this.phaser.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
};

/*
 * The arcTo() method creates an arc/curve between two tangents on the canvas.
 *
 * "borrowed" from https://code.google.com/p/fxcanvas/ - thanks google!
 *
 * @method arcTo
 * @param x1 {Number} The x-coordinate of the beginning of the arc
 * @param y1 {Number} The y-coordinate of the beginning of the arc
 * @param x2 {Number} The x-coordinate of the end of the arc
 * @param y2 {Number} The y-coordinate of the end of the arc
 * @param radius {Number} The radius of the arc
 * @return {Graphics}
 */
Graphics.prototype.arcTo = function(x1, y1, x2, y2, radius) {
    return this.phaser.arcTo(x1, y1, x2, y2, radius);
};

/**
 * The arc method creates an arc/curve (used to create circles, or parts of circles).
 *
 * @method arc
 * @param cx {Number} The x-coordinate of the center of the circle
 * @param cy {Number} The y-coordinate of the center of the circle
 * @param radius {Number} The radius of the circle
 * @param startAngle {Number} The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
 * @param endAngle {Number} The ending angle, in radians
 * @param anticlockwise {Boolean} Optional. Specifies whether the drawing should be counterclockwise or clockwise. False is default, and indicates clockwise, while true indicates counter-clockwise.
 * @return {Graphics}
 */
Graphics.prototype.arc = function(cx, cy, radius, startAngle, endAngle, anticlockwise) {
    return this.phaser.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
};

/**
 * Specifies a simple one-color fill that subsequent calls to other Graphics methods
 * (such as lineTo() or drawCircle()) use when drawing.
 *
 * @method beginFill
 * @param color {Number} the color of the fill
 * @param alpha {Number} the alpha of the fill
 * @return {Graphics}
 */
Graphics.prototype.beginFill = function(color, alpha) {
    return this.phaser.beginFill(color, alpha);
};

/**
 * Applies a fill to the lines and shapes that were added since the last call to the beginFill() method.
 *
 * @method endFill
 * @return {Graphics}
 */
Graphics.prototype.endFill = function() {
    return this.phaser.endFill();
};

/**
 * @method drawRect
 *
 * @param x {Number} The X coord of the top-left of the rectangle
 * @param y {Number} The Y coord of the top-left of the rectangle
 * @param width {Number} The width of the rectangle
 * @param height {Number} The height of the rectangle
 * @return {Graphics}
 */
Graphics.prototype.drawRect = function(x, y, width, height) {
    return this.phaser.drawRect(x, y, width, height);
};

/**
 * @method drawRoundedRect
 *
 * @param x {Number} The X coord of the top-left of the rectangle
 * @param y {Number} The Y coord of the top-left of the rectangle
 * @param width {Number} The width of the rectangle
 * @param height {Number} The height of the rectangle
 * @param radius {Number} Radius of the rectangle corners
 */
Graphics.prototype.drawRoundedRect = function(x, y, width, height, radius) {
    return this.phaser.drawRoundedRect(x, y, width, height, radius);
};

/*
 * Draws a circle.
 *
 * @method Phaser.Graphics.prototype.drawCircle
 * @param {Number} x - The X coordinate of the center of the circle.
 * @param {Number} y - The Y coordinate of the center of the circle.
 * @param {Number} diameter - The diameter of the circle.
 * @return {Graphics} This Graphics object.
 */
Graphics.prototype.drawCircle = function(x, y, diameter) {
    return this.phaser.drawCircle(x, y, diameter);
};

/**
 * Draws an ellipse.
 *
 * @method drawEllipse
 * @param x {Number} The X coordinate of the center of the ellipse
 * @param y {Number} The Y coordinate of the center of the ellipse
 * @param width {Number} The half width of the ellipse
 * @param height {Number} The half height of the ellipse
 * @return {Graphics}
 */
Graphics.prototype.drawEllipse = function(x, y, width, height) {
    return this.phaser.drawEllipse(x, y, width, height);
};

/**
 * Draws a polygon using the given path.
 *
 * @method drawPolygon
 * @param path {Array} The path data used to construct the polygon. If you've got a qc.Polygon object then pass `polygon.points` here.
 * @return {Graphics}
 */
Graphics.prototype.drawPolygon = function(path) {
    return this.phaser.drawPolygon(path);
};

/**
 * Clears the graphics that were drawn to this Graphics object, and resets fill and line style settings.
 *
 * @method clear
 * @return {Graphics}
 */
Graphics.prototype.clear = function() {
    return this.phaser.clear();
};

/**
 * Useful function that returns a texture of the graphics object that can then be used to create sprites
 * This can be quite useful if your geometry is complicated and needs to be reused multiple times.
 *
 * @method generateTexture
 * @param resolution {Number} The resolution of the texture being generated
 * @param scaleMode {Number} Should be one of the PIXI.scaleMode consts
 * @return {Texture} a texture of the graphics object
 */
Graphics.prototype.generateTexture = function(resolution, scaleMode) {
    return this.phaser.generateTexture(resolution, scaleMode);
};

/**
 * Tests if a point is inside this graphics object
 *
 * @param point {Point} the point to test
 * @return {boolean} the result of the test
 */
Graphics.prototype.containsPoint = function(point) {
    return this.phaser.containsPoint(point);
};

/**
 * Draws the given shape to this Graphics object. Can be any of Circle, Rectangle, Ellipse, Line or Polygon.
 *
 * @method drawShape
 * @param {Circle|Rectangle|Ellipse|Line|Polygon} shape The Shape object to draw.
 * @return {GraphicsData} The generated GraphicsData object.
 */
Graphics.prototype.drawShape = function(shape) {
    return this.phaser.drawShape(shape);
};