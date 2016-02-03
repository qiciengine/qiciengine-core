/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * The GameObjectFactory is a quick way to create many common game objects.
 * 'game.add' is the default instance. You can use it like: 
 *     game.add.image()
 *     
 * @class qc.GameObjectFactory
 * @constructor
 * @internal
 */
var GameObjectFactory = qc.GameObjectFactory = function(game) {
    /**
     * @property {qc.Game} game - A reference to the currently running Game.
     * @protected
     */
    this.game = game;
};
GameObjectFactory.prototype.constructor = GameObjectFactory;

/*
* Clone a Node
*/
GameObjectFactory.prototype.clone = function(ob, parent) {
    if (!ob) return null;

    if (ob instanceof Prefab) {
        // Clone from a Prefab
        var a = this.game.serializer.restoreBundle(ob.json, parent);
        a._prefab = ob.uuid;
        return a;
    }

    // Clone from Node, serializer first and then restore.
    var context = {};
    var json = this.game.serializer.buildBundle(ob, context);
    json.dependences = this.game.serializer.combineDependence(context);
    var a = this.game.serializer.restoreBundle(json, parent ? parent : ob.parent);
    return a;
};

/**
 * Create a Node (Empty GameObject)
 *
 * @method qc.GameObjectFactory#node
 */
GameObjectFactory.prototype.node = function(parent, uuid) {
    var node = new Node(new Phaser.Group(this.game.phaser, null), parent, uuid);
    node.name = 'node';
    return node;
};

/**
 * Create a UIText
 *
 * @method qc.GameObjectFactory#text
 * @return {qc.UIText} The newly created text object.
 */
GameObjectFactory.prototype.text = function(parent, uuid) {
    return new UIText(this.game, parent, uuid);
};

/**
 * Create a UIImage
 *
 * @method qc.GameObjectFactory#image
 * @return {qc.UIImage} The newly created image object.
 */
GameObjectFactory.prototype.image = function(parent, uuid) {
    return new UIImage(this.game, parent, uuid);
};

/**
 * Create a Button
 *
 * @param parent
 * @returns {qc.Button} The newly created button object.
 */
GameObjectFactory.prototype.button = function(parent, uuid) {
    return new Button(this.game, parent, uuid);
};

/**
 * Create a Toggle
 *
 * @param parent
 * @returns {qc.Toggle}
 */
GameObjectFactory.prototype.toggle = function(parent, uuid) {
    return new Toggle(this.game, parent, uuid);
};

/**
 *  Create a Sprite
 *
 *  @method qc.GameObjectFactory#sprite
 *  @return {qc.Sprite}
 */
GameObjectFactory.prototype.sprite = function(parent, uuid) {
    return new Sprite(this.game, parent, uuid);
};

/**
 *  Create a Sound
 *
 *  @method qc.GameObjectFactory#Sound
 *  @return {qc.Sound}
 */
GameObjectFactory.prototype.sound = function(parent, uuid) {
    return new Sound(this.game, parent, uuid);
};

/**
 * Create a ScrollView
 * 
 * @method qc.GameObjectFactory#scrollView
 * @param parent {qc.Node}
 * @returns {qc.ScrollView}
 */
GameObjectFactory.prototype.scrollView = function(parent, uuid) {
    return new ScrollView(this.game, parent, uuid);
};

/**
 * Create a ScrollBar
 * 
 * @method qc.GameObjectFactory#scrollBar
 * @param parent {qc.Node} - The parent of ScrollBar
 * @param createSliders {boolean}
 * @returns {qc.ScrollBar}
 */
GameObjectFactory.prototype.scrollBar = function(parent, createSliders, uuid) {
    var scrollBar = new ScrollBar(this.game, parent, uuid);
    var restore = uuid !== undefined;
    if (restore) return scrollBar;

    scrollBar.width = 160;
    scrollBar.height = 20;
    scrollBar.size = 0.2;
    scrollBar.direction = qc.ScrollBar.LEFT_TO_RIGHT;
    if (createSliders) {
        var slidingArea = this.node(scrollBar);
        slidingArea.name = 'slidingArea';
        slidingArea.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        slidingArea.setStretch(0, 0, 0, 0);
        slidingArea.pivotX = slidingArea.pivotY = 0.5;

        var sliders = this.image(slidingArea);
        sliders.name = 'sliders';
        sliders.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        sliders.setStretch(0, 0, 0, 0);
        sliders.pivotX = sliders.pivotY = 0.5;
        scrollBar.sliders = sliders;
        scrollBar.interactive = true;
    }

    return scrollBar;
};

/**
 * Create a ProgressBar
 * 
 * @method qc.GameObjectFactory#progressBar
 * @param parent {qc.Node}
 * @param createSliders {boolean}
 * @returns {qc.progressBar}
 */
GameObjectFactory.prototype.progressBar = function(parent, createSliders, uuid) {
    var progressBar = new ProgressBar(this.game, parent, uuid);
    var restore = uuid !== undefined;
    if (restore) return progressBar;

    progressBar.width = 160;
    progressBar.height = 20;
    if (createSliders) {
        var progressArea = this.node(progressBar);
        progressArea.name = 'progressArea';
        progressArea.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        progressArea.setStretch(0, 0, 0, 0);
        progressArea.pivotX = progressArea.pivotY = 0.5;

        var sliders = this.image(progressArea);
        sliders.name = 'sliders';
        sliders.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        sliders.setStretch(0, 0, 0, 0);
        sliders.pivotX = sliders.pivotY = 0.5;
        progressBar.sliders = sliders;
    }

    return progressBar;
};

/**
 * Create a Slider
 * 
 * @method qc.GameObjectFactory#progressBar
 * @param parent {qc.Node}
 * @param createSliders {boolean}
 * @returns {qc.progressBar}
 */
GameObjectFactory.prototype.slider = function(parent, createSliders, uuid) {
    var slider = new Slider(this.game, parent, uuid);
    var restore = uuid !== undefined;
    if (restore) return slider;

    slider.interactive = true;
    slider.width = 160;
    slider.height = 20;
    if (createSliders) {
        var slidingArea = this.node(slider);
        slidingArea.name = 'slidingArea';
        slidingArea.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        slidingArea.setStretch(0, 0, 0, 0);
        slidingArea.pivotX = slidingArea.pivotY = 0.5;

        var sliders = this.image(slidingArea);
        sliders.name = 'sliders';
        sliders.setAnchor(new qc.Point(0.5, 0.5), new qc.Point(0.5, 0.5));
        sliders.setStretch(0, 0, 0, 0);
        sliders.pivotX = sliders.pivotY = 0.5;

        slider.sliders = sliders;
    }

    return slider;
};

/**
 * Create a InputField
 * @method qc.GameObjectFactory#inputField
 * @param parent
 * @param uuid
 */
GameObjectFactory.prototype.inputField = function(parent, uuid) {
    return new InputField(this.game, parent, uuid);
};

/**
 * Create a Dropdown
 * 
 * @method qc.GameObjectFactory#dropdown
 * @param parent
 * @param uuid
 * @returns {qc.Dropdown}
 */
GameObjectFactory.prototype.dropdown = function(parent, uuid) {
    return new qc.Dropdown(this.game, parent, uuid);  
};

/**
 * Createa Tilemap
 * 
 * @method qc.GameObjectFactory#tilemap
 * @param parent
 * @param uuid
 * @returns {qc.Tilemap}
 */
GameObjectFactory.prototype.tilemap = function(parent, uuid) {
    return new Tilemap(this.game, parent, uuid);
};

/**
 * Create a TileLayer
 * 
 * @param parent
 * @param uuid
 * @returns {qc.TileLayer}
 */
GameObjectFactory.prototype.tileLayer = function(parent, uuid) {
    return new TileLayer(this.game, parent, uuid);
};

/**
 * Creaet a ObjectLayer
 * 
 * @param parent
 * @param uuid
 * @returns {qc.ObjectLayer}
 */
GameObjectFactory.prototype.objectLayer = function(parent, uuid) {
    return new ObjectLayer(this.game, parent, uuid);
};

/**
 * Create a DOM
 * 
 * @param parent
 * @param uuid
 * @returns {qc.Dom}
 */
GameObjectFactory.prototype.dom = function(parent, uuid) {
    return new Dom(this.game, parent, uuid);
};

/**
 * Create a Graphics object.
 * 
 * @param parent
 * @param uuid
 * @returns {qc.Graphics}
 */
GameObjectFactory.prototype.graphics = function(parent, uuid) {
    return new Graphics(this.game, parent, uuid);
};
