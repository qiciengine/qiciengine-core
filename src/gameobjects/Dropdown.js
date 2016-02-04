/**
 * @author weism
 * copyright 2016 Qcplay All Rights Reserved.
 */

/**
 * A standard dropdown that presents a list of options when clicked, of which one can be chosen.
 * When a dropdown event occurs a callback is sent to any registered of onValueChanged.
 * 
 * @class qc.Dropdown
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var Dropdown = qc.Dropdown = function(game, parent, uuid) {
    // Inherit from UIImage
    var self = this;
    qc.UIImage.call(self, game, parent, uuid);

    /**
     * @property {qc.Signal} onStateChange - A event that is invoked when the dropdown is enable or disable.
     */
    self.onStateChange = new qc.Signal();

    /**
     * @property {qc.Signal} onValueChange - A event that is invoked when a user has clicked one of the options in the dropdown list.
     */
    self.onValueChange = new qc.Signal();

    /**
     * @property {qc.UIImage} captionImage - The Image component to hold the image of the currently selected option.
     */
    self.captionImage = null;

    /**
     * @property {qc.UIText} captionText - The Text component to hold the text of the currently selected option.
     */
    self.captionText = null;

    /**
     * @property {qc.Node} item - The Node component to hold the content of the the item.
     */
    self.item = null;

    /**
     * @property {Array} options - The list of possible options. A text string and an image can be specified for each option.
     */
    self.options = [];

    /**
     * @property {qc.Node} template - The Rect Transfrom of the template for the dropdown list.
     */
    self.template = null;

    // Init it
    var restore = uuid !== undefined;
    self.name = 'Dropdown';
    self.interactive = true;
    self._items = [];
    if (restore !== true) {
        self.captionText = game.add.text(self);
        self.captionText.name = 'Label';
        self.captionImage = game.add.image(self);
        self.captionImage.name = 'Image';
        
        // Create scrollview for options.
        self.template = game.add.scrollView(self);
        self.template.interactive = true;
        self.template.name = 'Template';
        var mask = self.template.addScript("qc.NodeMask");
        mask.checkInField = false;
        self.template.content = game.add.node(self.template);
        self.template.visible = false;
        self.template.content.name = 'Content';

        // Create option item
        var item = self.item = game.add.node(self.template.content);
        item.name = 'Item';
        item.interactive = true;
        var dropdownItem = item.addScript('qc.DropdownItem');
        dropdownItem.checkBackground = game.add.image(item);
        dropdownItem.checkBackground.name = 'Background';
        dropdownItem.checkMark = game.add.image(item);
        dropdownItem.checkMark.name = 'CheckMark';
        dropdownItem.text = game.add.text(item);
        dropdownItem.text.name = 'Text';
        dropdownItem.image = game.add.image(item);
        dropdownItem.image.name = 'Image';
        dropdownItem.image.visible = false;
    }

    // Change the state to 'PRESSED' when the mouse is pressed.
    self.addListener(self.onDown, function() {
        if (self.state !== qc.UIState.DISABLED) {
            self.state = qc.UIState.PRESSED;
        }
    });
    self.addListener(self.onUp, function() {
        if (self.state === qc.UIState.PRESSED) {
            self.state = qc.UIState.NORMAL;
        }
    });
    
    // Show/Hide the dropdown list when click
    self.addListener(self.onClick, function(e) {
        self.isFocused = !self.isFocused;
    });

    // Sync the dropdown list position.
    self.phaser.worldTransformChangedCallback = self._updatePosition;
    self.phaser.worldTransformChangedContext = self;
    self._updatePosition();
};
Dropdown.prototype = Object.create(qc.UIImage.prototype);
Dropdown.prototype.constructor = Dropdown;

Object.defineProperties(Dropdown.prototype, {
    /**
     * @property {string} class - The class name
     * @readonly
     * @internal
     */
    'class' : {
        get : function() { return 'qc.Dropdown' }
    },

    /**
     * @property {number} state - The state of the dropdown (enable or disable).
     */
    state : {
        get : function()  { return this._state || qc.UIState.NORMAL; },
        set : function(v) {
            if (this.state === v) return;
            this._state = v;
            this.onStateChange.dispatch();
        }
    },

    /**
     * @property {int} value - The index of the currently selected option. 0 is the first option, 1 is the second, and so on. 
     */
    value: {
        get: function() {
            return this.options.length > 0 ? this._value : -1;
        },
        set: function(v) {
            if (this._value === v || this.options.length === 0) return;
            if (typeof this._value === 'number') {
                var oldItem = this._items[this._value],
                    newItem = this._items[v];
                this._value = v;
                if (oldItem) oldItem.getScript('qc.DropdownItem').redraw();
                if (newItem) newItem.getScript('qc.DropdownItem').redraw();
                this._redraw();
            }
        }
    },
    
    /**
     * @property {boolean} isFocused  - If true, the options are being shown.
     */
    isFocused: {
        get: function() {
            return this._list && this._list.visible;
        },
        set: function(v) {
            if (v === this.isFocused) return;
            if (v) this.show(); 
            else this.hide();
        }
    }
});

/**
 * @override
 * @private
 */
Dropdown.prototype._dispatchAwake = function() {
    var self = this;
    Node.prototype._dispatchAwake.call(self);
    if (!self._value) self._value = 0;
    self._redraw();
};

/**
 * Add multiple options to the options of the Dropdown based on a list of string/texture objects.
 * @method qc.Dropdown#addOptions
 * @param options
 */
Dropdown.prototype.addOptions = function(options) {
    var self = this;
    self.options.concat(options);
    if (self.isFocused) {
        // re-show dropdown list
        self.show();
    }
};

/**
 * Clear the list of options in the Dropdown.
 * @method qc.Dropdown#clearOptions
 */
Dropdown.prototype.clearOptions = function() {
    var self = this;
    self.options = [];
    if (self.isFocused) {
        self.hide();
    }
};

/**
 * Show the dropdown list.
 * @method qc.Dropdown#show
 */
Dropdown.prototype.show = function() {
    var self = this,
        list = self._list;
    self.hide();

    // Create mask node first
    self._maskNode = self.game.add.node(self.game.world);
    self._maskNode.interactive = true;
    self._maskNode.name = 'mask';
    self._maskNode.addListener(self._maskNode.onClick, function() {
        self.hide();
    });
    
    // Create the items
    self._items = [];
    self.item.visible = false;
    list = self._list = self.game.add.clone(self.template, self.game.world);
    var path = '', t = self.item.parent;
    while (t !== self.template) {
        path = path === '' ? t.name : t.name + '/' + path;
        t = t.parent;
    }
    var parent = path === '' ? list : list.find(path);
    for (var i = 0; i < self.options.length; i++) {
        var item = self.game.add.clone(self.item, parent);
        item.visible = true;
        var dropdownItem = item.getScript('qc.DropdownItem');
        dropdownItem.dropdown = self;
        dropdownItem.index = i;
        self._items.push(item);
    }

    // Show it
    list.visible = true;
    self._updatePosition();
};

/**
 * Hide the dropdown list.
 * @method qc.Dropdown#show
 */
Dropdown.prototype.hide = function() {
    var self = this,
        list = self._list;
    if (list) {
        // Destroy the old list
        list.destroy();
        delete self._list;
    }
    if (self._maskNode) {
        self._maskNode.destroy();
        delete self._maskNode;
    }
};

/**
 * The fields to be serialized.
 * @overide
 * @internal
 */
Dropdown.prototype.getMeta = function() {
    var self = this;
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(self);

    json.captionImage = s.NODE;
    json.captionText = s.NODE;
    json.template = s.NODE;
    json.item = s.NODE;
    json.maskNode = s.NODE;
    json.state = s.NUMBER;
    json._value = s.NUMBER;
    json.options = {
        get: function(ob, context) {
            var v = [];
            for (var i = 0; i < self.options.length; i++) {
                var item = self.options[i];
                if (!item) {
                    v.push(undefined);
                    continue;
                }
                if (typeof item === 'string') {
                    v.push(item);
                    continue;
                }
                
                // The item is a texture.
                v.push(self.game.serializer._saveTextureItem(item, context));
            }
            return v;
        },
        set: function(context, v) {
            v.forEach(function(item) {
                if (!item || typeof item === 'string') {
                    self.options.push(item);
                    return;
                }

                // The item is a texture.
                self.options.push(self.game.serializer._restoreTextureItem(item));
            });
        }
    };
    return json;
};

/**
 * Redraw the dropdown
 * @private
 */
Dropdown.prototype._redraw = function() {
    var self = this;
    if (self.options.length === 0 || self.value < 0 || self.value >= self.options.length) {
        if (self.captionImage) self.captionImage.visible = false;
        if (self.captionText) self.captionText.visible = false;
        return;
    }
    
    var v = self.options[self.value];
    if (typeof v === 'string') {
        if (self.captionImage) self.captionImage.visible = false;
        if (self.captionText) {
            self.captionText.visible = true;
            self.captionText.text = v;
        }
    }
    else if (v) {
        if (self.captionText) self.captionText.visible = false;
        if (self.captionImage) {
            self.captionImage.visible = true;
            self.captionImage.texture = v;
        }
    }
};

/**
 * Sync the position of the dropdown list.
 * @private
 */
Dropdown.prototype._updatePosition = function() {
    var self = this,
        list = self._list;
    if (!list) return;

    self.template.visible = true;
    var pos = self.template.getWorldPosition();
    list.x = pos.x, list.y = pos.y;
    var scale = self.template.getWorldScale();
    list.scaleX = scale.x, list.scaleY = scale.y;
    list.rotation = self.template.getWorldRotation();
    
    var pScale = self.template.parent.getWorldScale();
    list.width = self.template.width * pScale.x;
    list.height = self.template.height * pScale.y;
    
    // Resize maskNode and fill the screen.
    self._maskNode.x = self._maskNode.y = 0;
    self._maskNode.width = self.game.world.width;
    self._maskNode.height = self.game.world.height;
    self.template.visible = false;
};
