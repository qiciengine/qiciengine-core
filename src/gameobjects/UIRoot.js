/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * UIRoot is always at the left-top of screen.
 * The component 'qc.ScaleAdapter' is attached by default, in order to scale with device resolution.
 *
 * @class qc.UIRoot
 * @extends qc.Node
 * @param {Phaser.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var UIRoot = qc.UIRoot = function(game, uuid) {
    // Inherit from qc.Node
    qc.Node.call(this, new Phaser.Group(game.phaser, null), null, uuid);
    this.name = "UIRoot";

    // Attach the component 'qc.ScaleAdapter' by default.
    var restore = uuid !== undefined;
    if (!restore) {
        var s = this.addScript('qc.ScaleAdapter');
        s.referenceResolution = new qc.Point(640, 960);
        s.manualType = qc.ScaleAdapter.EXPAND;
        s.fullTarget = true;
    }

    // Set transform
    this.setAnchor(new qc.Point(0, 0), new qc.Point(0, 0));
    this.pivotX = 0;
    this.pivotY = 0;
    var worldScale = this.getWorldScale();
    this.setTransformToWorld(0, 0, worldScale.x, worldScale.y,
        this.getWorldRotation());
};
UIRoot.prototype = Object.create(qc.Node.prototype);
UIRoot.prototype.constructor = UIRoot;

Object.defineProperties(UIRoot.prototype, {
    /**
     * @property {string} class - The class name
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.UIRoot' }
    }
});

/**
 * The core postUpdate - as called by World.
 * @method qc.UIRoot#postUpdate
 * @protected
 */
UIRoot.prototype.postUpdate = function() {
    // Because the world size = screen size & camera is fixed, so UIRoot is always at the origin
    this.x = 0;
    this.y = 0;
};
