/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Resizes a RectTransform to fit a specified aspect ratio.
 * @class qc.AspectRatioFitter
 */
var AspectRatioFitter = defineBehaviour('qc.AspectRatioFitter', qc.Behaviour, function() {
    var self = this;
    self.mode = AspectRatioFitter.NONE;
    self.ratio = 1;

    self.runInEditor = true;
}, {
    mode : qc.Serializer.NUMBER,
    ratio : qc.Serializer.NUMBER
});
AspectRatioFitter.__menu = 'UI/AspectRatioFitter';

Object.defineProperties(AspectRatioFitter.prototype,{
    /**
     * @property {number} mode - mode to resize the node: 
     *   AspectRatioFitter.NONE
     *   AspectRatioFitter.WIDTH_CONTROLS_HEIGHT
     *   AspectRatioFitter.HEIGHT_CONTROLS_WIDTH
     *   AspectRatioFitter.FIT_IN_PARENT
     *   AspectRatioFitter.ENVELOPE_PARENT
     */
    mode : {
        get : function() { return this._mode || AspectRatioFitter.NONE; },
        set : function(v) {
            if (this.mode === v) return;
            this._mode = v;
            this._reset();
        }
    },

    /**
     * @property {number} ratio - ratio = width/height
     */
    ratio : {
        get : function() { return this._ratio || 1; },
        set : function(v) {
            if (v <= 0) v = 0.001;
            if (this.ratio === v) return;
            this._ratio = v;
            this._reset();
        }
    }
});

/**
 * Four modes to resize the node
 * @type {number}
 */
AspectRatioFitter.NONE = 0;
AspectRatioFitter.WIDTH_CONTROLS_HEIGHT = 1;
AspectRatioFitter.HEIGHT_CONTROLS_WIDTH = 2;
AspectRatioFitter.FIT_IN_PARENT = 3;
AspectRatioFitter.ENVELOPE_PARENT = 4;

/**
 * When the target node is initialized, resize it immediately
 */
AspectRatioFitter.prototype.awake = function() {
    var self = this;
    self._reset();

    // When the target node transform is changed, resize it.
    var node = self.gameObject;
    self.addListener(node.onRelayout, function() {
        self._reset();
    });
};
/**
 * Resize width and height of the target node by AspectRatioFitter mode.
 * @private
 */
AspectRatioFitter.prototype._reset = function() {
    var self = this;
    if (self.mode === AspectRatioFitter.NONE) return;
    var node = self.gameObject;

    if (self.mode === AspectRatioFitter.WIDTH_CONTROLS_HEIGHT) {
        node.height = node.width / self.ratio;
        return;
    }
    if (self.mode === AspectRatioFitter.HEIGHT_CONTROLS_WIDTH) {
        node.width = node.height * self.ratio;
        return;
    }

    // Resize by parent's rect
    var rect = node.parent.rect;
    node.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
    if (self.mode === AspectRatioFitter.FIT_IN_PARENT) {
        var w = rect.width;
        var h = w / self.ratio;
        if (h > rect.height) {
            h = rect.height;
            w = h * self.ratio;
        }
        node.setStretch((rect.width - w) / 2, (rect.width - w) / 2,
            (rect.height - h) / 2, (rect.height - h) / 2);
        return;
    }

    if (self.mode === AspectRatioFitter.ENVELOPE_PARENT) {
        var w = rect.width;
        var h = w / self.ratio;
        if (h < rect.height) {
            h = rect.height;
            w = h * self.ratio;
        }
        node.setStretch((rect.width - w) / 2, (rect.width - w) / 2,
            (rect.height - h) / 2, (rect.height - h) / 2);
        return;
    }
};
