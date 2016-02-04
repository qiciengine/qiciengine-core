/**
 * @author weism
 * copyright 2016 Qcplay All Rights Reserved.
 */

/**
 * For qc.Dropdown. Only Text or Texture is supported.
 * @class qc.DropdownItem
 */
var DropdownItem = defineBehaviour('qc.DropdownItem', qc.Behaviour, function() {
    var self = this;

    /**
     * @property {qc.Dropdown} dropdown - The Dropdown reference.
     * @protected
     */
    self.dropdown = null;
},{
    checkBackground: qc.Serializer.NODE,
    checkMark: qc.Serializer.NODE,
    text: qc.Serializer.NODE,
    image: qc.Serializer.NODE
});
DropdownItem.__menu = 'UI/DropdownItem';

Object.defineProperties(DropdownItem.prototype, {
    /**
     * @property {int} index - The index of dropdown items.
     */
    index: {
        get: function() { return this._index; },
        set: function(v) {
            if (this._index === v) return;
            this._index = v;
            this.redraw();
        }
    }
});

/**
 * When the mouse is pressed down, change the background texture
 */
DropdownItem.prototype.onDown = function() {
    if (this.checkBackground) this.checkBackground.visible = true;
};

/**
 * When the mouse is pressed down, reset the background texture
 */
DropdownItem.prototype.onUp = function() {
    if (this.checkBackground) this.checkBackground.visible = false;
};

/**
 * Select the item if click
 */
DropdownItem.prototype.onClick = function() {
    var self = this;
    if (self.index === self.dropdown.value) return;

    // Select this
    self.dropdown.value = self.index;
    self.dropdown.hide();
};

/**
 * Redraw the item.
 * @internal
 */
DropdownItem.prototype.redraw = function() {
    var self = this,
        o = self.gameObject,
        v = self.dropdown.options[self.index];
    
    if (typeof v === 'string') {
        if (self.image) self.image.visible = false;
        self.text.visible = true;
        self.text.text = v;
    }
    else {
        if (self.text) self.text.visible = false;
        self.image.visible = true;
        self.image.texture = v;
    }
    
    if (self.checkMark) {
        self.checkMark.visible = self.index === self.dropdown.value;
    }
    o.anchoredY = self.index * o.height;
    if (self.checkBackground) self.checkBackground.visible = false;
};
