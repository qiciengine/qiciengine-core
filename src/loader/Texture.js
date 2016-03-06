/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Describe a texture
 *
 * @class qc.Atlas
 * @constructor
 */
var Texture = qc.Texture = function(atlas, frame) {
    var self = this;
    self.atlas = atlas;
    self.frame = frame || 0;
};
Texture.prototype.constructor = Texture;

Object.defineProperties(Texture.prototype, {
    /**
     * @property {Array} padding - The Nine-Patch: [left, top, right, bottom]
     * @readonly
     */
    padding: {
        get: function() {
            return this.atlas.getPadding(this.frame);
        }
    },

    /**
     * @property {string} class - The class name 
     * @internal
     */
    class: {
        get : function() { return 'qc.Texture'; }
    }
});
