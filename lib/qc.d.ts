/**
 * @author weism
 * copyright 2016 Qcplay All Rights Reserved.
 */

declare module qc {
    /**
     * A Point object represents a location in a two-dimensional coordinate system, where x represents the horizontal axis and y represents the vertical axis.
     */
    export class Point {
        constructor(x?: number, y?: number);
        
        /**
         * The horizontal position of this Point.
         */
        x: number;
        /**
         * The vertical position of this Point.
         */
        y: number;
    }
    
    /**
     * A Line object
     */
    export class Line {
        constructor(x1: number, y1: number, x2: number, y2: number);
        
        /**
         * The start point of the line.
         */
        start: Point;
        /**
         * The end point of the line.
         */
        end: Point;
        /**
         * Read only. The length of the line in pixels.
         */
        length: number;
        /**
         * Read only. The angle of the line
         */
        angle: number;
        /**
         * Read only. The width of this bounds of this line.
         */
        width: number;
        /**
         * Read only. The height of this bounds of this line.
         */
        height: number;
    }
    
    /**
     * A Rectangle object
     */
    export class Rectangle {
        constructor(x: number, y: number, width: number, height: number);
        
        /**
         * The x coordinate of the top-left corner of the Rectangle.
         */
        x: number;
        /**
         * The y coordinate of the top-left corner of the Rectangle.
         */
        y: number;
        /**
         * The width of the Rectangle. Should always be either zero or a positive value.
         */
        width: number;
        /**
         * The height of the Rectangle. Should always be either zero or a positive value.
         */
        height: number;
        /**
         * The x coordinate to place the center of the Rectangle at.
         */
        centerX: number;
        /**
         * The y coordinate to place the center of the Rectangle at.
         */
        centerY: number;
    }
    
    /**
     * The Matrix class is now an object, which makes it a lot faster, here is a representation of it :
     *
     * | a | b | tx|
     * | c | d | ty|
     * | 0 | 0 | 1 |
     */
    export class Matrix {
        constructor();
        
        /**
         * a. Default:1
         */
        a: number;
        /**
         * b. Default:0
         */
        b: number;
        /**
         * c. Default:0
         */
        c: number;
        /**
         * d. Default:1
         */
        d: number;
        /**
         * tx. Default:0
         */
        tx: number;
        /**
         * ty. Default:0
         */
        ty: number;
    }
    
    /**
     * Circle
     */
    export class Circle {
        constructor(x?: number, y?: number, diameter?: number);
        
        /**
         * The x coordinate of the center of the circle.
         */
        x: number;
        /**
         * The y coordinate of the center of the circle.
         */
        y: number;
        /**
         * The diameter of the circle.
         */
        diameter: number;
        /**
         * The radius of the circle.
         */
        radius: number;
        
        /**
         * Returns the distance from the center of the Circle object to the given object
         * @params target
         */
        distance(target: ({x: number, y: number}), round?: boolean): number;
    }
    
    /**
     * Ellipse: A curve on a plane surrounding two focal points.
     */
    export class Ellipse {
        constructor(x?: number, y?: number, width?: number, height?: number);
        
        /**
         * The X coordinate of the upper-left corner of the framing rectangle of this ellipse.
         */
        x: number;
        /**
         * The Y coordinate of the upper-left corner of the framing rectangle of this ellipse.
         */
        y: number;
        /**
         * The overall width of this ellipse.
         */
        width: number;
        /**
         * The overall height of this ellipse.
         */
        height: number;
        
        /**
         * Return true if the given x/y coordinates are within this Ellipse object.
         * @params x: the x coordinate of the point
         * @params y: the y coordinate of the point
         */
        contains(x: number, y: number): boolean;
    }
    
    /**
     * Polygon
     */
    export class Polygon {
        constructor(...pts: Point[]);
        
        /**
         * The area of this Polygon.
         */
        area: number;
        /**
         * Is the Polygon closed or not?
         */
        closed: boolean;
        /**
         * An array of Points that make up this Polygon.
         */
        points: Point[];
        
        /**
         * Return true if the given x/y coordinates are within this polygon.
         * @params x: the x coordinate of the point
         * @params y: the y coordinate of the point
         */
        contains(x: number, y: number): boolean;
    }
    
    /**
     * BezierCurve is used for editor only.
     */
    export class BezierCurve {
    }
    
    /**
     * The Color class is used to encapsulate colors in the default RGB color space
     */
    export class Color {
        constructor(rgb: number|string|[number, number, number]|[number, number, number, number]);
        
        /**
         * The alpha value defines the transparency of a color and can be represented by a float value in the range 0.0 - 1.0
         */
        alpha: number;
        /**
         * The value of rgb, such as: [125, 255, 0]
         */
        rgb: [number, number, number];
        
        /**
         * Convert a Color to string.
         * @params patten: rgba, rgb, #rgb, #argb
         */
        toString(patten?: string): string;
        /**
         * Convert a Color to int.
         * @params alpha: default is false.
         */
        toNumber(alpha?: boolean): number;
    }
    
    /**
     * The states of the object
     */
    export enum UIState {
        /**
         * the normal state
         */
        NORMAL,
        /**
         * the object is pressed.
         */
        PRESSED,
        /**
         * the object is disable.
         */
        DISABLED
    }
    
    /**
     * Transition mode for a node.
     */
    export enum Transition {
        /**
         * No Transition.
         */
        NONE,
        /**
         * Use an color tint transition.
         */
        COLOR_TINT,
        /**
         * Use a sprite swap transition.
         */
        TEXTURE_SWAP,
        /**
         * Use an animation transition.
         */
        ANIMATION
    }
    
    /**
     * The class for atlas and animation.
     */
    export class Atlas {
        /**
         * Read only. The uuid of resource
         */
        uuid: string;
        /**
         * Read only. Unique asset key of the atlas file.
         */
        key: string;
        /**
         * Read only. URL of the atlas file.
         */
        url: string;
        /**
         * Read only. Meta data of the atlas file.
         */
        meta: Object;
        /**
         * Read only. Animation information of the atlas file.
         */
        animation: Object;
        /**
         * Read only. The reference of the atlas image.
         */
        img: HTMLImageElement;
        /**
         * Read only. The number of frames.
         */
        count: number;
        /**
         * Read only. The list of frames.
         */
        frames: any[];
        /**
         * Read only. The name list of frames.
         */
        frameNames: string[];
        
        /**
         * Get a FrameData object from the atlas.
         * @params frame: Frame name or index
         * @return: Frame data.
         */
        getFrame(frame: number|string): Object;
        /**
         * Get the qc.Texture object from an atlas.
         * @params frame: Frame name or index
         * @return: Frame data.
         */
        getTexture(frame: number|string): Texture;
        /**
         * Get Nine-Patch information from the atlas: [Left, Top, Right, Bottom]
         * @params frame: Frame name or index
         * @return: [left, top, right, bottom]
         */
        getPadding(frame: number|string): [number, number, number, number];  
    }
    
    /**
     * Describe a texture.
     */
    export class Texture {
        constructor(atlas: Atlas, frame?: string|number);
        
        /**
         * ReadOnly. The atlas of texture.
         */
        atlas: Atlas;
        /**
         * ReadOnly. The texture name or index in the atlas.
         */
        frame: string|number;
    }
    
    /**
     * The font resource.
     */
    export class Font {
        /**
         * Read Only. the unique id of resource
         */
        uuid: string;
        /**
         * Read Only. Spacing of X axis
         */
        xSpacing: number;
        /**
         * Read Only. Spacing of Y axis
         */
        ySpacing: number;
    }
    
    /**
     * The class of sound resource
     */
    export class SoundAsset {
        /**
         * Read Only. the unique id of resource
         */
        uuid: string;
    }
    
    /**
     * The class of text resource
     */
    export class TextAsset {
        /**
         * Read Only. the unique id of resource
         */
        uuid: string;
    }
   
    /**
     * Prefabricated resources. In the scene editor it will automatically create prefabricated resource when object is dragged into the specified directory of project. The prefabricated resource save the information of the object. When load this prefab resource, the qc.Prefab object is automatically created. Also we can clone many this prefab objects throught game.add.clone  
     */ 
    export class Prefab {
        /**
         * Read Only. the unique id of resource
         */
        uuid: string;
        /**
         * Read Only. The dependent resource list of prefab
         */
        dependences: any[];
    }
    
    /**
     * Excel tabular data
     */
    export class ExcelAsset {
        /**
         * Read Only. uuid of resource 
         */
        uuid: string;
        /**
         * Read Only. keyword of Resource
         */
        key: string;
        /**
         * Read Only. url of Resource
         */
        url: string;
        /**
         * Read Only. names of all sheets
         */
        sheetsName: string[];
        /**
         * Read Only. datas of all sheets
         */
        sheets: Object;
        /**
         * Read Only. meta data
         */
        meta: Object;
        
        /**
         * Fetch a table info from excel file.
         * @params name: table's name
         */
        findSheet(name: string): ExcelSheet;

        /**
         * In Excel, the date type is the number of seconds that you have experienced in 1900, and you need to use this interface to convert before use.
         * @params number: date value in excel
         */
        static parseToDate(number: number): Date;
    }
    
    /**
     * excel table data
     */
    export class ExcelSheet {
        /**
         * Read Only. Table column array
         */
        columns: Object[];
        /**
         * Read Only. Table row array
         */
        rows: Object[];
        
        /**
         * Add a sort index.
         * @params name: Alias name of index
         * @params columnName: The column order of sort index.
         */
        addSortIndex(name: string, ...columnName: string[]): ExcelSortSheetIndex;
        /**
         * Use the specified column name to create a hash index, after creation, data can be obtained directly by value.
         * @params name: Alias name of index
         * @params columnName: Alias name of hash key
         * @params unique: Check if the key is the only
         */
        addHashIndex(name: string, columnName: string, unique: boolean): ExcelHashSheetIndex;
        /**
         * Get a sort or hash index by name
         * @params name: Alias name of sheet
         */
        getIndex(name: string): ExcelSortSheetIndex|ExcelHashSheetIndex;
        /**
         * Get primary index of table, a sort index by default.
         */
        getPrimary(): ExcelSortSheetIndex;
        /**
         * Traversal to find the first to meet the conditions of the line, and return line num
         * @params func: The comparison function for finding
         */
        find(func: Function): number;
        /**
         * Traversal to find the last to meet the conditions of the line, and return line num
         * @params func: The comparison function for finding
         */
        findLast(func: Function): number;
        /**
         * Traversal to find all data that meet the conditions
         * @params func: The comparison function for finding
         */
        matches(func: Function): any[];
        /**
         * Translate a column of data into a date type. Because the value of the date type of Excel is the number of seconds that has experienced in January 1, 1900, while the value of JavaScript is the number of seconds that has experienced in January 1, 1970, it needs to be converted.
         * @params column: Column name
         */
        parseColumnToData(column: string): void;
    }
    
    /**
     * Excel sort index
     */
    export class ExcelSortSheetIndex {
        /**
         * Read Only. the column name array of table
         */
        columns: string[];
        /**
         * Read Only. the row data array of table
         */
        rows: Object[];
        
        /**
         * Find the first line to meet the conditions
         * @params cellValue: The column data to find a row
         */
        first(...cellValue: number[]): number;
        first(...cellValue: string[]): number;
        /**
         * Find the last one to meet the conditions of the line
         * @params cellValue: The column data to find a row
         */
        last(...cellValue: number[]): number;
        last(...cellValue: string[]): number;
        /**
         * Find the line range to meet the conditions
         * @params cellValue: The column data to find a row
         */
        matches(...cellValue: number[]): [number, number];
        matches(...cellValue: string[]): [number, number];
    }
    
    /**
     * Hash index of Excel table data
     */
    export class ExcelHashSheetIndex {
        /**
         * Read Only. Table column array
         */
        columns: string[];
        /**
         * Read Only. Table row array
         */
        rows: Object[];
        /**
         * Read Only. Table key array
         */
        keys: string[];
    }
    
    /**
     * SignalBinding
     */
    export class SignalBinding {
    }
    
    /**
     * A Signal is an event dispatch mechansim than supports broadcasting to multiple listeners.
     */
    export class Signal {
        constructor();
        
        /**
         * Add an event listener.
         * @params listener: The function to call when this Signal is dispatched.
         * @params listenerContext: The context under which the listener will be executed (i.e. the object that should represent the this variable).
         * @params priority: The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
         * @return: An Object representing the binding between the Signal and listener.
         */
        add(listener: Function, listenerContext?: Object, priority?: number): SignalBinding;
        /**
         * Check if a specific listener is attached.
         * @params listener: Signal handler function.
         * @params listenerContext: Context on which listener will be executed (object that should represent the this variable inside listener function).
         */
        has(listener: Function, listenerContext?: Object): boolean; 
        /**
         * Add a one-time listener - the listener is automatically removed after the first execution.
         * @params listener: The function to call when this Signal is dispatched.
         * @params listenerContext: The context under which the listener will be executed (i.e. the object that should represent the this variable).
         * @params priority: The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
         * @return: An Object representing the binding between the Signal and listener.
         */
        addOnce(listener: Function, listenerContext?: Object, priority?: number): SignalBinding;
        /**
         * Remove a single event listener.
         * @params listener: The function to call when this Signal is dispatched.
         * @params listenerContext: The context under which the listener will be executed (i.e. the object that should represent the this variable).
         */
        remove(listener: Function, listenerContext?: Object): void;
        /**
         * Remove all event listeners.
         */
        removeAll(): void;
        /**
         * Dispatch / broadcast the event to all listeners.
         */
        dispatch(...params): void;
    }
    
    /**
     * Extens the class of Math. This class represents a singleton object that can be accessed directly as game.math.
     */
    export class Math {
        /**
         * Two number are fuzzyEqual if their difference is less than epsilon.
         * @params a: value
         * @params b: value
         * @params epsilon: small value 
         * @return: true if (abs(a-b) < epsilon)
         */
        fuzzyEqual(a: number, b: number, epsilon: number): boolean;
        /**
         * a is fuzzyLessThan b if it is less than b + epsilon
         * @params a: value
         * @params b: value
         * @params epsilon: small value 
         * @return: true if (a < b+epsilon)
         */
        fuzzyLessThan(a: number, b: number, epsilon: number): boolean;
        /**
         * a is fuzzyGreaterThan b if it is more than b - epsilon.
         * @params a: value
         * @params b: value
         * @params epsilon: small value 
         * @return: true if (a > b+epsilon)
         */
        fuzzyGreaterThan(a: number, b: number, epsilon: number): boolean;
        /**
         * ceiling(val-epsilon)
         * @params val: value
         * @params epsilon: small value
         * @return: ceiling(val-epsilon);
         */
        fuzzyCeil(val: number, epsilon: number): number;
        /**
         * floor(val-epsilon)
         * @params val: value
         * @params epsilon: small value
         * @return: floor(val-epsilon);
         */
        fuzzyFloor(val: number, epsilon: number): number;
        /**
         * Averages all values passed to the function and returns the result.
         * @params vals: The numbers to average
         * @return: The average of all given values.
         */
        average(...vals: number[]): number;
        /**
         * n mod 1
         * @params n: value
         * @return: n mode 1
         */
        shear(n: number): number;
        /**
         * Snap a value to nearest grid slice, using rounding.
         * @params input: The value to snap.
         * @params gap: The interval gap of the grid.
         * @params start: Optional starting offset for gap.
         * @return: 
         */
        snapTo(input: number, gap: number, start: number): number;
        /**
         * Snap a value to nearest grid slice, using floor.
         * @params input: The value to snap.
         * @params gap: The interval gap of the grid.
         * @params start: Optional starting offset for gap.
         * @return: 
         */
        snapToFloor(input: number, gap: number, start: number): number;
        /**
         * Snap a value to nearest grid slice, using ceil.
         * @params input: The value to snap.
         * @params gap: The interval gap of the grid.
         * @params start: Optional starting offset for gap.
         * @return: 
         */
        snapToCeil(input: number, gap: number, start: number): number;
        /**
         * Round to some place comparative to a base, default is 10 for decimal place. The place is represented by the power applied to base to get that place.
         * @params value: The value to round.
         * @params place: The place to round to.
         * @params base: The base to round in... default is 10 for decimal.
         */
        roundTo(value: number, place?: number, base?: number): number;
        /**
         * Floor to some place comparative to a base, default is 10 for decimal place. The place is represented by the power applied to base to get that place.
         * @params value: The value to floor.
         * @params place: The place to floor to.
         * @params base: The base to floor in... default is 10 for decimal.
         */
        floorTo(value: number, place?: number, base?: number): number;
        /**
         * Ceil to some place comparative to a base, default is 10 for decimal place. The place is represented by the power applied to base to get that place.
         * @params value: The value to ceil.
         * @params place: The place to ceil to.
         * @params base: The base to ceil in... default is 10 for decimal.
         */
        ceilTo(value: number, place?: number, base?: number): number;
        /**
         * Find the angle of a segment from (x1, y1) -> (x2, y2).
         * @params x1:
         * @params y1:
         * @params x2:
         * @params y2:
         * @return: The angle, in radians.
         */
        angleBetween(x1: number, y1: number, x2: number, y2: number): number;
        /**
         * Find the angle of a segment from (x1, y1) -> (x2, y2). Note that the difference between this method and Math.angleBetween is that this assumes the y coordinate travels down the screen.
         * @params x1:
         * @params y1:
         * @params x2:
         * @params y2:
         * @return: The angle, in radians.
         */
        angleBetweenY(x1: number, y1: number, x2: number, y2: number): number;
        /**
         * Normalizes an angle to the [0,2pi) range.
         * @params angleRad: The angle to normalize, in radians.
         * @return: Returns the angle, fit within the [0,2pi] range, in radians.
         */
        normalizeAngle(angleRad: number): number;
        /**
         * Reverses an angle.
         * @params angleRad: The angle to reverse, in radians.
         * @return: Returns the reverse angle, in radians.
         */
        reverseAngle(angleRad: number): number;
        /**
         * Adds the given amount to the value, but never let the value go over the specified maximum.
         * @params value: The value to add the amount to.
         * @params amount: The amount to add to the value.
         * @params max: The maximum the value is allowed to be.
         * @return: The new value.
         */
        maxAdd(value: number, amount: number, max: number): number;
        /**
         * Subtracts the given amount from the value, but never let the value go below the specified minimum.
         * @params value: The base value.
         * @params amount: The amount to subtract from the base value.
         * @params min: The minimum the value is allowed to be.
         * @return: The new value.
         */
        minSub(value: number, amount: number, min: number): number;
        /**
         * Ensures that the value always stays between min and max, by wrapping the value around. If max is not larger than min the result is 0.
         * @params value: The value to wrap.
         * @params min: The minimum the value is allowed to be.
         * @params max: The maximum the value is allowed to be, should be larger than min.
         * @return: The wrapped value.
         */
        wrap(value: number, min: number, max: number): number;
        /**
         * Adds value to amount and ensures that the result always stays between 0 and max, by wrapping the value around.
         * @params value: The value to add the amount to.
         * @params amount: The amount to add to the value.
         * @params max: The maximum the value is allowed to be.
         * @return: The wrapped value.
         */
        wrapValue(value: number, amount: number, max: number): number;
        /**
         * Keeps an angle value between -180 and +180; or -PI and PI if radians.
         * @params angle: The angle value to wrap
         * @params radians: Set to true if the angle is given in radians, otherwise degrees is expected.
         * @return: The new angle value; will be the same as the input angle if it was within bounds.
         */
        wrapAngle(angle: number, radians: boolean): number;
        /**
         * Returns true if the number given is odd.
         * @params value: The number to check.
         * @return: True if the given number is odd. False if the given number is even.
         */
        isOdd(value: number): boolean;
        /**
         * Returns true if the number given is even.
         * @params value: The number to check.
         * @return: True if the given number is even. False if the given number is odd.
         */
        isEven(value: number): boolean;
        /**
         * Variation of Math.min that can be passed either an array of numbers or the numbers as parameters.
         * @params vals: An array of value
         * @return: The lowest value from those given.
         */
        min(...vals: number[]): number;
        min(vals: number[]): number;
        /**
         * Variation of Math.max that can be passed either an array of numbers or the numbers as parameters.
         * @params vals: An array of value
         * @return: The largest value from those given.
         */
        max(...vals: number[]): number;
        max(vals: number[]): number;
        /**
         * Calculates a linear (interpolation) value over t.
         * @params p0: Start value
         * @params p1: End value
         * @params t: The percentage of interpolation, between 0 and 1.
         * @return: The interpolated value
         */
        linear(p0: number, p1: number, t: number): number;
        /**
         * Calculates a factorial value .
         * @params n: the value to factorial
         * @return:
         */
        factorial(n: number): number;
        /**
         * Fetch a random entry from the given array. Will return null if there are no array items that fall within the specified range or if there is no item for the randomly choosen index.
         * @params objects: An array of objects.
         * @params startIndex: Optional offset off the front of the array. Default value is 0, or the beginning of the array.
         * @params length: Optional restriction on the number of values you want to randomly select from.
         * @return: The random object that was selected.
         */
        getRandom(objects: any[], startIndex: number, length: number): any;
        /**
         * Returns the euclidian distance between the two given set of coordinates.
         * @params x1
         * @params y1
         * @params x2
         * @params y2
         * @return: The distance between the two sets of coordinates. 
         */
        distance(x1: number, y1: number, x2: number, y2: number): number;
        /**
         * Force a value within the boundaries by clamping x to the range [a, b].
         * @params x
         * @params min
         * @params max
         * @return:
         */
        clamp(x: number, min: number, max: number): number;
        /**
         * Checks if two values are within the given tolerance of each other.
         * @params a: The first number to check
         * @params b: The second number to check
         * @params tolerance: The tolerance. Anything equal to or less than this is considered within the range.
         * @return: True if a is <= tolerance of b.
         */
        within(a: number, b: number, tolerance: number): boolean;
        /**
         * A value representing the sign of the value: -1 for negative, +1 for positive, 0 if value is 0.
         * @params val
         * @return: An integer in {-1, 0, 1}
         */
        sign(val: number): number;
        /**
         * Convert degrees to radians.
         * @params degrees: Angle in degrees.
         * @return: Angle in radians.
         */
        degToRad(degrees: number): number;
        /**
         * Convert radians to degrees .
         * @params degrees: Angle in radians
         * @return: Angle in degrees
         */
        radToDeg(degrees: number): number;
        /**
         * Returns a random real number between min and max
         * @params min: min value
         * @params max: max value
         * @return: A random real number between min and max.
         */
        random(min: number, max: number): number;
        /**
         * A standard Fisher-Yates Array shuffle implementation.
         * @params array: The array to shuffle
         * @return: The shuffled array.
         */
        shuffle(array:any[]): any[];
        /**
         * Get a unique string
         * @return: A unique string
         */
        uuid(): string;
        /**
         * Returns next global id.
         * @return: next global id
         */
        id(): number;
        /**
         * Invert matrix
         * @params out: out matrix
         * @params a: in matrix
         * @return: invert matrix of a
         */
        invert(out: number[], a: number[]): number[];
        /**
         * Matrix multiply.
         * @params out: out matrix
         * @params a: input matrix a
         * @params b: input matrix b
         * @return: Matrix multiply by a and b.
         */
        multiply(out: number[], a: number[], b: number[]): number[];
        /**
         * Calculate value of smooth damping.
         * @params current: Current value
         * @params target: Target value
         * @params currentVelocity: Current velocity
         * @params smoothTime: Smooth time
         * @params maxSpeed: Max speed
         * @params deltaTime: Delta time between two frames
         * @return: [pos, velocity]
         */
        smoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number): [number, number];
    }
  
    /**
     * This is the heart of the game, which provides a large part of fast functional access channel. The instance of qc.Game is automatically constructed by editor.
     */
    export class Game {
        constructor(width: number, height: number, parent: string, state: Object, transparent?: boolean, editor?: boolean, debug?: boolean, physicsConfig?: Object);
        constructor(config: Object);
        
        /**
         * Read only. Log Management
         */
        log: Log;
        /**
         * Read only. Debug Management
         */
        debug: Debug;
        /**
         * Read Only. Device Information
         */
        device: Device;
        /**
         * Read only. Objects Factory
         */
        add: GameObjectFactory;
        /**
         * Read only. Input Management
         */
        input: Input;
        /**
         * Read only. Math Library
         */
        math: Math;
        /**
         * Read only.Time
         */
        time: Time;
        /**
         * Read only.Sound Manager
         */
        sound: SoundManager;
        /**
         * Read only.Assets Management
         */
        assets: Assets;
        /**
         * Read only. Game World
         */
        world: World;
        /**
         * Read only. Scenes Management
         */
        scene: SceneManager;
        /**
         * Read only. Local Storage Management
         */
        storage: Storage;
        /**
         * The width of game world. Unit:px
         */
        width: number;
        /**
         * The height of game world. Unit:px
         */
        height: number;
        /**
         * true: the game background is transparent.
         */
        transparent: boolean;
        /**
         * Draw all image textures anti-aliased or not.
         */
        antialias: boolean;
        /**
         * Read only. true: the game is running.
         */
        isRunning: boolean;
        /**
         * true: the game is paused.
         */
        paused: boolean;
        /**
         * Configuration information of the game.
         */
        config: Object;
        /**
         * Physics config information of the game.
         */
        physicsConfig: Object;
        /**
         * When the game is started, this event is triggered.
         */
        onStart: Signal;
        /**
         * When the game is paused, this event is triggered.
         */
        onPause: Signal;
        /**
         * When resuming the game, this event is triggered.
         */
        onResume: Signal;
        /**
         * When the game loses the focus, this event is triggered.
         */
        onBlur: Signal;
        /**
         * When the game receives the focus, this event is triggered.
         */
        onFocus: Signal;
        
        /**
         * Shut down the game and recycle assets. Gennerally there is no need to call. After the brower refreshes or shuts down, all assets can be automatically recycled by browser.
         */
        shutdown(): void;
    }
  
    /**
     * The module is responsible for game logging. User can use game.log to refer to this module.
     */
    export class Log {
        /**
         * Whether to enable trace
         */
        enableTrace: boolean;
        
        /**
         * Output normal log, switched by enableTrace variable.
         */
        trace(content:string, ...params): void;
        /**
         * Output important log
         */
        important(content:string,...params): void;
        /**
         * Output error log, and print callstack.
         */
        error(content:string,...params): void;
    }
  
    /**
     * The module for debug. This class represents a singleton object that can be accessed directly as game.debug.
     * By default, Debug is enable in editor and disable when published.
     */
    export class Debug {
        /**
         * The local game reference.
         */
        game: Game;
        /**
         * Is the debug enable? If true, Log enableTrace is true too.
         */
        on: boolean;
    }
    
    /**
     * Detects device support capabilities.
     * This class represents a singleton object that can be accessed directly as game.device.
     */
    export class Device {
        /**
         * the browser
         */
        static UNKNOW: number;
        static CHROME: number;
        static ARORA: number;
        static EPIPHANY: number;
        static FIREFOX: number;
        static IE: number;
        static TRIDENT: number;
        static MOBILE_SAFARI: number;
        static MIDORI: number;
        static OPERA: number;
        static SAFARI: number;
        static WEBAPP: number;
        static SILK: number;
        static UCBROWSER: number;
        
        /**
         * The device's orientation
         */
        static AUTO: number;
        static PORTRAIT: number;
        static LANDSCAPE: number;
        
        /**
         * The local game reference.
         */
        game: Game;
        /**
         * Read only. Is running on a desktop?
         */
        desktop: boolean;
        /**
         * Read only. Is running on iOS?
         */
        iOS: boolean;
        /**
         * Read only. Is running on android?
         */
        android: boolean;
        /**
         * Read only. Is webGL available?
         */
        webGL: boolean;
        /**
         * Read only. Does the device support the Vibration API?
         */
        vibration: boolean;
        /**
         * Read only. Can be: Device.CHOME, Device.ARORA, Device.EPIPHANY, Device.FIREFO, Device.TRIDENT, Device.IE, Device.MOBILE_SAFARI, Device.MODORI, Device.OPERA, Device.SAFARI, Device.SILK, Device.UCBROWSER, Device.UNKNOW
         */
        browser: number;
        /**
         * Read only. The device's resolution.
         */
        resolution: number;
        /**
         * Read only. Does the browser support the Full Screen API?
         */
        fullscreen: boolean;
        /**
         * Is the game running in editor mode.
         */
        editor: boolean;
        /**
         * The device's orientation. Value: Device.AUTO、Device.PORTRAIT(Width < Height)、Device.LANDSCAPE(Width > Height)
         */
        orientation: number;
        /**
         * When the orientation changed, this event is triggered.
         */
        onOrientationChange: Signal;
    }
  
    /**
     * The GameObjectFactory is a quick way to create many common game objects. game.add is the default instance, you can use it like: game.add.image();
     */
    export class GameObjectFactory {
        /**
         * Clones the object original and returns the clone. This function makes a copy of an object in a similar way to the Duplicate command in the editor.
         * @params node: The object to clone.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        clone(node: Node|Prefab, parent?: Node): Node;
        /**
         * Create a new Button.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        button(parent?: Node): Button;
        /**
         * Create a new Dropdown.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        dropdown(parent?: Node): Dropdown;
        /**
         * Create a new UIImage.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        image(parent?: Node): UIImage;
        /**
         * Create a new InputField.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        inputField(parent?: Node): InputField;
        /**
         * Create a Node.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        node(parent?: Node): Node;
        /**
         * Create a ProgressBar.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */ 
        progressBar(parent?: Node): ProgressBar;
        /**
         * Create a ScrollBar.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */ 	
        scrollBar(parent?: Node): ScrollBar;
        /**
         * Create a ScrollView.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        scrollView(parent?: Node): ScrollView;
        /**
         * Create a Slider.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */    
        slider(parent?: Node): Slider;
        /**
         * Create a Sound.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        sound(parent?: Node): Sound;
        /**
         * Create a Sprite.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        sprite(parent?: Node): Sprite;
        /**
         * Create a UIText.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */    
        text(parent?: Node): UIText;  
        /**
         * Create a Toggle.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */	      
        toggle(parent?: Node): Toggle;
        /**
         * Create a DOM.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */	
        dom(parent?: Node): Dom;
        /**
         * Create a Tilemap.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */
        tilemap(parent?: Node): Tilemap;
        /**
         * Create a TileLayer.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */	
        tileLayer(parent?: Node): TileLayer;
        /**
         * Create a ObjectLayer.
         * @params parent: Optional node to add the object to. If not specified it will be added to the World.
         * @return
         */	
        objectLayer(parent?: Node): ObjectLayer;
    }
    
    /**
     * Base class for all entities in scenes.
     */
    export class Node {
        /**
         * The node's name.
         */
        name: string;
        /**
         * Makes the object target not be destroyed automatically when loading a new scene.
         */
        ignoreDestroy: boolean;
        /**
         * The node's alpha: 0 - 1
         */
        alpha: number;
        /**
         * The visible state of the node. Non-visible nodes and all of their children are not rendered.
         */
        visible:boolean;
        /**
         * Read only. Indicates if the node is globally visible.
         */
        worldVisible: boolean;
        /**
         * The parent of the node.
         */
        parent: Node;
        /**
         * Read only. The list of the node' children.
         */
        children: Node[];
        /**
         * The tint applied to the node.
         */
        colorTint: Color;
        /**
         * Read only. The list of the components that this node attacks. 
         */ 
        scripts: Behaviour[];
        /**
         * X position of the transform relative to the parent transform.
         */
        x: number;
        /**
         * Y position of the transform relative to the parent transform.
         */
        y: number;
        /**
         * The x position of the pivot of this RectTransform relative to the anchor reference point.
         */
        anchoredX: number;
        /**
         * The y position of the pivot of this RectTransform relative to the anchor reference point.
         */
        anchoredY: number;
        /**
         * The scale.x of the transform relative to the parent.
         */
        scaleX: number;
        /**
         * The scale.y of the transform relative to the parent.
         */
        scaleY: number;
        /**
         * The x normalized position in this RectTransform that it rotates around.
         */
        pivotX: number;
        /**
         * The y normalized position in this RectTransform that it rotates around.
         */
        pivotY: number;
        /**
         * The rotation of the transform relative to the parent transform's rotation.
         */
        rotation: number;
        /**
         * The width of node.
         */
        width: number;
        /**
         * The height of node.
         */
        height: number;
        /**
         * Read only. The normalized position in the parent RectTransform that the lower left corner is anchored to. Call setAnchor to set minAnchor.
         */
        minAnchor: Point;
        /**
         * Read only. The normalized position in the parent RectTransform that the upper right corner is anchored to. Call setAnchor to set maxAnchor.
         */
        maxAnchor: Point;
        /**
         * Distance left relative to the parent transform.
         */
        left: number;
        /**
         * Distance right relative to the parent transform.
         */
        right: number;
        /**
         * Distance top relative to the parent transform.
         */
        top: number;
        /**
         * Distance bottom relative to the parent transform.
         */
        bottom: number;
        /**
         * The calculated rectangle in the local space of the Transform.
         */
        rect: Rectangle;
        /**
         * Current transform of the object based on world (parent) factors
         */
        worldTransform: Matrix;
        /**
         * Retrieves the local bounds of the node as a rectangle object
         */
        localBounds: Rectangle;
        /**
         * When transform changed, this event is triggered.
         */
        onRelayout: Signal;
        /**
         * Can pick up mouse / touch events?
         */
        interactive: boolean;
        /**
         * This is the defined area that will pick up mouse / touch events. It is null by default.
         */
        hitArea: any;
        /**
         * When pointer pressed, this event is triggered.
         */
        onDown: Signal;
        /**
         * When pointer released, this event is triggered.
         */
        onUp: Signal;
        /**
         * When the node is click, this event is triggered.
         */
        onClick: Signal;
        /**
         * When starting a drag operation, onDragStart is called.
         */
        onDragStart: Signal;
        /**
         * When dragging, onDrag is called.
         */
        onDrag: Signal;
        /**
         * When ending a drag operation, onDragEnd is called.
         */
        onDragEnd: Signal;
        /**
         * When dropped, onDragDrop is called.
         */
        onDragDrop: Signal;
        /**
         * When mouse wheels, onWheel is called.
         */
        onWheel: Signal;
        /**
         * When mouse enters, onEnter is called.
         */
        onEnter: Signal;
        /**
         * When mouse exits, onExit is called.
         */
        onExit: Signal;
        
        /**
         * Adds a component class named className to the node.
         * Use this function to change behaviour of objects on the fly.
         * Be careful, call qc.Behaviour#destroy to destroy the component.
         * @params script: The className of the script.
         */
        addScript(script: string): Behaviour;
        /**
         * Returns the component if the node has one attached, null if it doesn't.
         * @params script: The className of the script.
         */
        getScript(script: string): Behaviour;
        /**
         * Returns all components in the node.
         * @params script: The className of the script.
         */
        getScripts(script: string): Behaviour[];
        /**
         * Is the child of node?
         * @params node: The parent node.
         */
        isDescendantOf(node: Node): boolean;
        /**
         * Adds a child to the container.
         * @params child: The node to add to the container
         */
        addChild(child: Node): Node;
        /**
         * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
         * @params child: The Node to add to the container
         * @params index: The index to place the child in
         */
        addChildAt(child:Node, index:number): Node;
        /**
         * Swaps the position of 2 Nodes within this container.
         * @params child1: The child Node.
         * @params child2: The child Node.
         */
        swapChildren(child1: Node, child2: Node): void;
        /**
         * Returns the index position of a child Node instance.
         * @params child: The Node instance to identify
         */
        getChildIndex(child: Node): number;
        /**
         * Changes the position of an existing child in the Node.
         * @params child: The child Node instance for which you want to change the index number.
         * @params index: The resulting index number for the child Node.
         */
        setChildIndex(child: Node, index: number): void;
        /**
         * Returns the child at the specified index.
         * @params index: The index to get the child from
         */
        getChildAt(index: number): Node;
        /**
         * Removes a child from the container.
         * @params child: The Node to remove
         */
        removeChild(child: Node): Node;
        /**
         * Removes a child from the specified index position.
         * @params index: The index to remove the child from
         */
        removeChildAt(index: number): Node;
        /**
         * Removes all children from this node.
         */
        removeChildren(): void;
        /**
         * Remove this node. The node will be removed from scene in next frame.
         */
        destroy(): void;
        /**
         * Finds a game object by name and returns it.
         * @params path: The node's name. If path contains a '/' character it will traverse the hierarchy like a path name.
         */
        find(path: string): Node;
        /**
         * Listen event hook, it will be removed automatically when object destroy.
         * @params signal: Event signal object
         * @params listener: event callback
         * @params context: owner of listener
         * @params priority: priority of listener
         * @return: Listener ID, used for remove listener manually.
         */
        addListener(signal: Signal, listener: Function, context?: Object, priority?: number): number;
        /**
         * Listen event hook once, it will be removed automatically when event trigged once.
         * @params signal: Event signal object
         * @params listener: event callback
         * @params context: owner of listener
         * @params priority: priority of listener
         * @return: Listener ID, used for remove listener manually.
         */
        addListenerOnce(signal: Signal, listener: Function, context?:Object, priority?: number): void;
        /**
         * Remove listener manually.
         * @params id: Listener ID
         */
        removeListener(id: number): void;
        /**
         * Snapshot node, return qc.Atlas object.
         * @params key: Atlas key.
         * @params srcBounds: Source's bound for snapshot, current node's bound by default.
         * @params dstWidth: Target's width, value is srcBounds.width by default.
         * @params dstHeight: Target's height, value is srcBounds.height by default.
         * @params resolution: World's resolution by default.
         */
        snapshotAsAtlas(key: string, srcBounds?: Rectangle, dstWidth?: number, dstHeight?: number, resolution?: number): Atlas;
        /**
         * Snapshot node, return a dom Image object.
         * @params srcBounds: Source's bound for snapshot, current node's bound by default.
         * @params dstWidth: Target's width, value is srcBounds.width by default.
         * @params dstHeight: Target's height, value is srcBounds.height by default.
         * @params resolution: World's resolution by default.
         * @params loadedCallback: Callback after image loaded.
         */
        snapshotAsImage(srcBounds?: Rectangle, dstWidth?: number, dstHeight?: number, resolution?: number, loadedCallback?: Function);
        /**
         * Get the world position of node.
         */
        getWorldPosition(): Point;
        /**
         * Get the world scale of node.
         */
        getWorldScale(): Point;
        /**
         * Get the world rotation of node.
         * If skew in axis x is not same as skew in axis y, return 0. Rotation and skew property can only have a valid value.
         */
        getWorldRotation(): number;
        /**
         * Change the node's parent and hold position.
         * @params parent: New parent Node.
         * @params index: The resulting index number for the child Node.
         */
        switchParent(parent: Node, index: number): void;
        /**
         * Convert local position to world position.
         * @params localPoint: The local position relative to the parent.
         */
        toGlobal(localPoint: Point): Point;
        /**
         * Convert world position to local position.
         * @params globalPoint: The world position
         */
        toLocal(globalPoint: Point): Point;
        /**
         * Whether a world point is within the scope of the rectangle
         * @params globalPoint
         */
        rectContains(globalPoint: Point): boolean;
        /**
         * Gets the bounding box of the node in the specified node coordinate system
         * @params target: the target node
         */
        getBoxIn(target: Node): Rectangle;
        /**
         * Gets the bounding box of the node's coordinates in the world 
         */
        getWorldBox(): Rectangle;
        /**
         * Gets the four corners of the node in the world
         */
        getWorldCorners(): [Point, Point, Point, Point];  
    }
    
    /**
     * A game has only one world. The world is an abstract place in which all game objects live. A world is created the same size as your Stage.
     */
    export class World extends Node {
        /**
         * The X position corresponding to the center point of the world.
         */
        centerX: number;
        /**
         * The Y position corresponding to the center point of the world.
         */
        centerY: number;
        /**
         * The box of world
         */
        bounds: Rectangle;
        /**
         * When size change, this event is trigged.
         */
        onSizeChange: Signal;
    }
    
    /**
     * It is the root node of UI, inherit from qc.Node. All UI elements should be under this node. UIRoot keep the size same as world.
     *
     * Generally we add qc.ScaleAdapter for UIRoot, in order to scale with device resolution.
     */
    export class UIRoot extends Node {
    }
    
    /**
     * Displays a Texture2D.
     * 
     * Note that: the difference between UIImage and CSprite is, CSprite can be used for animation(such as frame animation, DragonBoned animation), UIImage is used for image display.
     */
    export class UIImage extends Node {
        /**
         * How the Image is draw
         */
        static IMAGE_TYPE_SIMPLE: number;
        static IMAGE_TYPE_SLICED: number;
        static IMAGE_TYPE_TILED: number;
        
        /**
         * The texture altas used for UIImage.
         */
        texture: Texture;
        /**
         * The frame's name in the texture atlas.
         */
        frame: string;
        /**
         * Read only. The frame's size.
         */
        nativeSize: Rectangle;
        /**
         * How the Image is draw: UIImage.IMAGE_TYPE_SIMPLE, UIImage.IMAGE_TYPE_SLICED, UIImage.IMAGE_TYPE_TILED.
         */
        imageType: number;
    }
    
    /**
     * The default Graphic to draw font data to screen.
     */
    export class UIText extends Node {
        /**
         * Font type
         */
        static SYSTEMFONT: number;
        static WEBFONT: number;
        static BITMAPFONT: number;
        
        /**
         * Horizontal alignment
         */
        static LEFT: number;
        static CENTER: number;
        static RIGHT: number;
        
        /**
         * Vertical alignment
         */
        static TOP: number;
        static MIDDLE: number;
        static BOTTOM: number;
        
        /**
         * Should the text be allowed to auto resized.
         */
        autoSize: boolean;
        /**
         * The FontType used by the text: UIText.SYSTEMFONT, UIText.WEBFONT, UIText.BITMAPFONT
         */
        fontFamily: number;
        /**
         * Horizontal alignment for text: UIText.LEFT, UIText.CENTER, UIText.RIGHT
         */
        alignH: number;
        /**
         * Vertical alignment for text: UIText.TOP, UIText.MIDDLE, UIText.BOTTOM
         */
        alignV: number;
        /**
         * When fontFamily is SYSTEMFONT, font is string type; fontFamily is other type，font is qcFont
         */
        font: string|Font;
        /**
         * Bold style applied to your texts.
         */
        bold: boolean;
        /**
         * The size that the Font should render at.
         */
        fontSize: number;
        /**
         * Base color of the font.
         */
        color: Color;
        /**
         * The string value this text will display.
         */
        text: string;
        /**
         * Line spacing, specified as a factor of font line height. A value of 1 will produce normal line spacing.
         */
        lineSpacing: number;
        /**
         * Is the text can be wrap?
         */
        wrap: boolean;
        /**
         * Text flows freely outside the element.
         */
        overflow: boolean;
        /**
         * Is the effect of gradient enabled?
         */
        gradient: boolean;
        /**
         * Start gradient color
         */
        startColor: Color;
        /**
         * End gradient color
         */
        endColor: Color;
        /**
         * Stroke color
         */
        stroke: Color;
        /**
         * Stroke width
         */
        strokeThickness: number;
        /**
         * Is the effect of shadow enable?
         */
        enableShadow: boolean;
        /**
         * The shadow's color.
         */
        shadowColor: Color;
        /**
         * The shadow's blur.
         */
        shadowBlur: number;
        /**
         * How far is the shadow from the text.
         */
        shadowOffsetX: number;
        /**
         * How far is the shadow from the text.
         */
        shadowOffsetY: number;
        /**
         * Is the effect of glow enable?
         */
        enableGlow: boolean;
        /**
         * The glow's color.
         */
        glowColor: Color;
        /**
         * The glow's blur.
         */
        glowBlur: number;
        /**
         * text real size
         */
        nativeSize: Rectangle;
    }
    
    /**
     * Represents a Sprite object for use in 2D gameplay. Sprites are 2D graphic objects used for characters, props, projectiles and other elments of 2D gameplay. The graphics are obtained from bitmap images.
     * 
     * The FrameAnimation and DragonBone are supported.
     */
    export class Sprite extends Node {
        /**
         * The type of Animation
         */
        static NONE_ANIMATION: number;
        static FRAME_ANIMATION: number;
        static DRAGON_BONES: number;
        static FRAME_SAMPLES: number;
        
        /**
         * Read only. The list of animation names.
         */
        animationNameList: string[];
        /**
         * Read only. The type of Animation: Sprite.NONE_ANIMATION, Sprite.FRAME_ANIMATION, Sprite.DRAGON_BONES, Sprite.FRAME_SAMPLES
         */
        animationType: number;
        /**
         * The default animation' name. It will automatic play when awake.
         */
        defaultAnimation: string;
        /**
         * current armature node
         */
        armature: any;
        /**
         * The frame' name in the texture atlas.
         */
        frame: string;
        /**
         * Read only. Is the sprite playing an animation?
         */
        isPlaying: boolean;
        /**
         * Read only. Is the animation is finished?
         */
        isComplete: boolean;
        /**
         * Read only. Last animation name played.
         */
        lastAnimationName: string;
        /**
         * The texture's real size.
         */
        nativeSize: Rectangle;
        /**
         * Pause / Resume playing animation.
         */
        paused: boolean;
        /**
         * The texture atlas.
         */
        texture: Texture;
        /**
         * When start playing animation, this event is trigged.
         */
        onStart: Signal;
        /**
         * When end playing animation, this event is trigged.
         */
        onFinished: Signal;
        /**
         * When play aimation in loop, this event is trigged when single loop is finished.
         */
        onLoopFinished: Signal;
        /**
         * When texture change, this event is trigged.
         */
        onTextureChanged: Signal;
        
        /**
         * Animation information, include:
         * 
         * {
         *    frameRate : 24,   // play speed
         *    loop : 1,         // 0 : infinite
         *    duration : duration time
         * }
         * @param animationName: the animation name.
         */
        getAnimationInfo(animationName: string): Object;
        /**
         * Play an animation.
         * @params name: Animation name
         * @params speed: play speed. 1 : no acceleration
         * @params loop: Whether to play in loop.
         */
        playAnimation(name: string, speed?: number, loop?: boolean): void;
        /**
         * Stop current animation.
         */
        stop(): void;
    }
    
    /**
     * A standard button that can be clicked in order to trigger an event.
     */
    export class Button extends UIImage {
        /**
         * The state of button: UIState.NORMAL(normal state), UIState.PRESSED(button pressed), UIState.DISABLED(button is disable)
         */
        state: UIState;
        /**
         * The reference text node.
         */
        text: UIText;
        /**
         * Is the button support native event of browser.
         */
        supportNativeEvent: boolean;
        /**
         * When button's state changed, this event is triggered.
         */
        onStateChange: Signal;
        /**
         * When value changed, this event is triggered.
         */
        onValueChange: Signal; 
        /**
         * When button is clicked, this event is triggered.
         */
        onNativeClick: Signal;
    }
    
    /**
     * Turn a simple label into an interactable input field.
     */
    export class InputField extends UIImage {
        /**
         * the type of the input text content 
         */
        static STANDARD: number;
        static INT: number;
        static NUMBER: number;
        static TEL: number;
        static EMAIL: number;
        static PASSWORD: number;
        
        /**
         * The state for this object: UIState.NORMAL(normal state), UIState.PRESSED(node is pressed), UIState.DISABLED(node is disable)
         */
        state: UIState;
        /**
         * The LineType used by the InputField: InputField.SINGLE_LINE(single line), InputField.MULTI_LINE(multiline)
         */
        lineType: number;
        /**
         * Specifies the type of the input text content.InputField.STANDARD(Allows all input), InputField.INT(Allow whole numbers), InputField.NUMBER(Allows decimal numbers), InputField.TEL(Allows phone), InputField.EMAIL(The input is used for typing in an email address), InputField.PASSWORD(Allows all input and hides the typed characters by showing them as asterisks characters.)
         */
        contentType: number;
        /**
         * The current value of the input field.
         */
        text: string;
        /**
         * The placeholder text
         */
        placeholderText: string;
        /**
         * How many characters the input field is limited to. -1 = infinite.
         */
        characterLimit: number;
        /**
         * Text flows freely outside the element. Default: true.
         */
        overflow: boolean;
        /**
         * ture:is editing
         */
        isFocused: boolean;
        /**
         * The reference of input text node.
         */
        textComponent: Node;
        /**
         * The reference of placeholder text node.
         */
        placeholder: Node;
        /**
         * When value changed, this event is triggered.
         */
        onValueChange:Signal;
        /**
         * When inputfield's state changed, this event is triggered.
         */
        onStateChange: Signal;
        /**
         * Focus on click event by self.
         */
        onNativeClick: Signal;
    }
    
    /**
     * Represents a progress bar control.
     */
    export class ProgressBar extends UIImage {
        /**
         * the styles of the progressbar
         */
        static STYLE_HORIZONTAL: number;
        static STYLE_VERTICAL: number;
        static STYLE_CIRCLE: number;
        
        /**
         * Show mode
         */
        static SHOW_PROCESSED: number;
        static SHOW_REMAINED: number;
        
        /**
         * The manner in which progress should be indicated on the progress bar: ProgressBar.STYLE_HORIZONTAL(From left to right), ProgressBar.STYLE_VERTICAL(From up to bottom), ProgressBar.STYLE_CIRCLE(Circle progressbar)
         */
        style: number;
        /**
         * The referebce to the slider Node.
         */
        sliders: Slider;
        /**
         * Whether the ProgressBar shows actual values or generic, continuous progress feedback.
         */
        indeterminable: boolean;
        /**
         * The minimum allowed value of the progressBar.
         */
        minValue: number;
        /**
         * The maximum allowed value of the progressBar.
         */
        maxValue: number;
        /**
         * Read only. = maxValue - minValue
         */
        length: number;
        /**
         * The current value of the progressBar.
         */
        value: number;
        /**
         * When indeterminable=true, loopTime works.
         */
        loopTime: number;
        /**
         * Then number of steps from 0 to max when play in loop. It is only effect when indeterminable variable is true.
         */
        numberOfStep: number;
        /**
         * The size of each step
         */
        stepSize: number;
        /**
         * The size of the slider. Value is percent. 1: full area
         */
        fixedSize: number;
        /**
         * Whether to cut slider
         */
        clipSliders: boolean;
        /**
         * Show mode. You can take the following two values: ProgressBar.SHOW_PROCESSED(show processed part), and ProgressBar.SHOW_REMAINED(show left part)
         */
        showMode:number;
        /**
         * Whether to show reverse
         */
        reverse: boolean;
        /**
         * The start radian. It is only effect when style is STYLE_CIRCLE.
         */
        startRadian: number;
        /**
         * The end radian. It is only effect when style is STYLE_CIRCLE.
         */
        endRadian: number;
        /**
         * The start angle. It is only effect when style is STYLE_CIRCLE.
         */
        startAngle: number;
        /**
         * The end angle. It is only effect when style is STYLE_CIRCLE.
         */
        endAngle: number;
        /**
         * Read only. current radian
         */
        showRadian: number;
        /**
         * When the value of progressBar changes, this event is triggered.
         */
        onValueChange: Signal;
    }
    
    /**
     * A standard scrollbar with a variable sized handle that can be dragged between 0 and 1.
     */
    export class ScrollBar extends UIImage {
        /**
         * The reference to slider Node.
         */
        sliders: Slider;
        /**
         * The direction of the scrollbar from minimum to maximum value.
         */
        direction: number;
        /**
         * The current value of the scrollbar, between 0 and 1.
         */
        value: number;
        /**
         * The size of the scrollbar handle where 1 means it fills the entire scrollbar.
         */
        size: number;
        /**
         * The number of steps to use for the value. A value of 0 disables use of steps.
         */
        numberOfStep: number;
        /**
         * The Step size.
         */
        stepSize: number;
        /**
         * The size of slider is fixed.
         */
        fixSlidersSize: boolean;
        /**
         * Whether hide the scrollbar automatically when the slider size is equal to slide area.
         */
        autoHide: boolean;
        /**
         * When the value is changed, this event is triggered.
         */
        onValueChange:Signal;
    }
    
    /**
     * A standard slider that can be moved between a minimum and maximum value.
     */
    export class Slider extends ProgressBar {
        /**
         * Whether to allow the slider to pursue the click position
         */
        canPursue: boolean;
        /**
         * The manner in which progress should be indicated on the progress bar: Slider.STYLE_HORIZONTAL(From left to right), Slider.STYLE_VERTICAL(From up to bottom), Slider.STYLE_CIRCLE(Circle progressbar)
         */
        style: number;
        /**
         * State of the slider.
         */
        state: UIState;
    }
    
    /**
     * Make a child RectTransform scroll. 
     */ 
    export class ScrollView extends Node {
        /**
         * movement type
         */
        static MOVEMENT_UNRESTRICTED: number;
        static MOVEMENT_ELASTIC: number;
        static MOVEMENT_CLAMPED: number;
        
        /** 
         * Should horizontal scrolling be enabled? 
         */
        canHorizontal: boolean;
        /**
         * Should vertical scrolling be enabled?
         */
        canVertical: boolean;
        /**
         * The behavior to use when the content moves beyond the scroll rect: 
         * ScrollView.MOVEMENT_UNRESTRICTED(Unrestricted movement. The content can move forever.), 
         * ScrollView.MOVEMENT_ELASTIC(Elastic movement. The content is allowed to temporarily move beyond the container, but is pulled back elastically.), 
         * ScrollView.MOVEMENT_CLAMPED(Clamped movement. The content can not be moved beyond its container.)
         */
        movementType: number;
        /**
         * The amount of elasticity to use when the content moves beyond the scroll rect.
         */
        elasticity: number;
        /**
         * Should movement inertia be enabled?
         */
        inertia: boolean;
        /**
         * The rate at which movement slows down.
         */
        decelerationRate: number;
        /**
         * The sensitivity to scroll wheel and track pad scroll events.
         */
        scrollSensitivity: number;
        /**
         * Whether the scroll event is passed to the upper.
         */
        propagationScroll: boolean;
        /**
         * The content that can be scrolled. It should be a child of this scrollView.
         */
        content: Node;
        /**
         * Optional Scrollbar object linked to the horizontal scrolling of the ScrollView.
         */
        horizontalScrollBar: ScrollBar;
        /**
         * The horizontal scroll position between 0 and 1.
         */
        horizontalNormalizedPosition: number;
        /**
         * Optional Scrollbar object linked to the vertical scrolling of the ScrollView.
         */
        verticalScrollBar: ScrollBar;
        /**
         * The vertical scroll position between 0 and 1.
         */
        verticalNormalizedPosition: number;
        /**
         * When scrolling, this event is triggered.
         */
        onValueChange: Signal;
        
        /**
         * Set the scroll position.
         * @params value: The scroll position
         * @params axis: 0: horiontal; 1: vertical
         */
        setNormalizedPosition(value:number, axis:number);
    }
  
    /**
     * A representation of audio.
     */
    export class Sound extends Node {
        /**
         * The asset of audio clip.
         */
        audio: SoundAsset;
        /**
         * When the sound stop, destroy it.
         */
        destroyWhenStop: boolean;
        /**
         * Is the audio clip looping?
         */
        loop: boolean;
        /**
         * Un- / Mutes the Audio.
         */
        mute: boolean;
        /**
         * If set to be true, the sound will automatically start playing on awake.
         */
        playOnAwake: boolean;
        /**
         * The volume of the audio (0.0 to 1.0).
         */
        volume: number;
        /**
         * Whether is playing
         */
        isPlaying: boolean;
        /**
         * Whether is paused
         */
        isPaused: boolean;
        
        /**
         * Pauses playing the clip.
         */
        pause(): void;
        /**
         * Plays the clip.
         */
        play(): void;
        /**
         * Play sound in fadein mode.
         * @params duration: fadein time in ms
         */
        fadeIn(duration: number): void;
        /**
         * Resumes playing the clip.
         */
        resume(): void;
        /**
         * Stops playing the clip.
         */
        stop(): void;
        /**
         * Add a marker, play from the marker.
         * @params start: Start time in second
         * @params duration: Duration time in second
         * @params volume: The volume the sound will play back at, between 0 (silent) and 1 (full volume).
         */
        addMarker(start, duration, volume): void;
        /**
         * Remove marker.
         */
        removeMarker(): void;
    }
  
    /**
     * A standard toggle that has an on / off state.
     */
    export class Toggle extends Node {
        /**
         * The reference of background image.
         */
        background: UIImage;
        /**
         * The reference of checking mark image.
         */
        checkMark: UIImage;
        /**
         * The reference of text node.
         */
        text: UIText;
        /**
         * Is the toggle on.
         */
        on: boolean;
        /**
         * The state of toggle: UIState.NORMAL, UIState.PRESSED, UIState.DISABLED
         */
        state: UIState;
        /**
         * When on is changed, this event is triggered.
         */
        onValueChange: Signal;
        /**
         * When state is changed, this event is triggered.
         */
        onStateChange: Signal;
    }
    
    /**
     * A standard dropdown that presents a list of options when clicked, of which one can be chosen.
     * When a dropdown event occurs a callback is sent to any registered listeners of onValueChanged.
     */
    export class Dropdown extends UIImage {
        /**
         * The state of dropdown: UIState.NORMAL(normal state), UIState.PRESSED(button pressed), UIState.DISABLED(button is disable)
         */
        state: UIState;
        /**
         * The Image component to hold the image of the currently selected option.
         */
        captionImage: UIImage;
        /**
         * The Text component to hold the text of the currently selected option.
         */
        captionText: UIText;
        /**
         * The component to hold the text or the image of the item.
         */
        item: Node;
        /**
         * The list of possible options. A text string and an image can be specified for each option.
         */
        options: any[];
        /**
         * The Transform of the template for the dropdown list.
         */
        template: Node;
        /**
         * The index of the currently selected option. 0 is the first option, 1 is the second, and so on.
         */
        value: number;
        /**
         * When dropdown's state changed, this event is triggered.
         */
        onStateChange: Signal;
        /**
         * When a user has clicked one of the options in the dropdown list, this event is triggered.
         */
        onValueChange: Signal;
        
        /**
         * Add multiple options to the options of the Dropdown.
         * @params options: A list of option to add.
         */
        addOptions(options: any[]): void;
        /**
         * Clear the list of options in the Dropdown.
         */
        clearOptions(): void;
        /**
         * Show the dropdown list.
         */
        show(): void;
        /**
         * Hide the dropdown list.
         */
        hide(): void;
    }
  
    /**
     * Dom node, is a div. Because it does not need render each frame, it is very efficient.
     */
    export class Dom extends Node {
        /**
         * The pos of node
         */
        static BACK: number;
        static FRONT: number;
        
        /**
         * div element
         */
        div: HTMLDivElement;
        /**
         * The pos of node. There are two values: qc.Dom.BACK(back layer); qc.Dom.FRONT(top layer)
         */
        pos: number;
        /**
         * innerHTML property of div
         */
        innerHTML: string;
        /**
         * CSS class
         */
        className: string;
        /**
         * Is innerHTML information needs to be saved, the default value is true
         */
        serializable: boolean;
        /**
         * Corresponding to style.overflow, possible values: auto, hidden, visible, scroll
         */
        overflow: string;
        /**
         * Corresponding to style.zIndex, element with greater zIndex is always in front of another element with lower zIndex. Can not be set to zero.
         */
        zIndex: number;
        /**
         * When father or self's visual property change, the event will be fired.
         */
        onVisibleChange: Signal;
    }
    
    /**
     * The tilemap file is made by Tiled Map Editor. Tile Layer Format is csv, saved as .txt file. After setting tilemap, need to call Tilemap.generateLayers() to generate TileLayer.
     */
    export class Tilemap extends Node {
        /**
         *  Read only. native size(not scale)
         */
        nativeSize: Rectangle;
        /**
         * The layer array
         */
        layers: any[];
        /**
         * The tileset array
         */
        tilesets: any[];
        /**
         * The scroll distance in axis x
         */
        scrollX: number;
        /**
         * The scroll distance in axis y
         */
        scrollY: number;
        /**
         * The width of tile
         */
        tileWidth: number;
        /**
         * The height of tile
         */
        tileHeight: number;
        /**
         * The cell count in axis x
         */
        mapWidth: number;
        /**
         * The cell count in axis y
         */
        mapHeight: number;
        /**
         * Tilemap data
         */
        data: TextAsset;
    }
    
    /**
     * The tile layer of tile map. After setting tilemap, need to call Tilemap.generateLayers() to generate the tile layer.
     */
    export class TileLayer extends Node {
        /**
         * tile map
         */
        tilemap: Tilemap;
        /**
         * The layer index of tile layer
         */
        layerIndex: number;
        /**
         * Scroll ratio in axis x.
         */
        scrollXRatio: number;
        /**
         * Scroll ratio in axis y.
         */
        scrollYRatio: number;
        
        /**
         * Get tile by pos.
         * @params x: pos in axis x
         * @params y: pos in axis y
         * @return: TODO: 返回值具体是什么类型？
         */
        getTile(x: number, y: number): any;
        /**
         * Get tile index by pos. When result <= 0, indicates there is no tile; result is Infinity, indicates that data is still loading, or data is missing.
         * @params x: pos in axis x
         * @params y: pos in axis y
         */
        getTileIndex(x: number, y: number): number;
    }
    
    /**
     * The object layer o f tile map.
     */
    export class ObjectLayer extends Node {
        /**
         * tile map
         */
        tilemap: Tilemap;
        /**
         * The layer index of object layer
         */
        layerIndex: number;
        /**
         * Scroll ratio in axis x.
         */
        scrollXRatio: number;
        /**
         * Scroll ratio in axis y.
         */
        scrollYRatio: number;
    }
    
    /**
     * The module is responsible for input handle. User can use game.input.module to refer to this module. For now developers do not need to understand this module.
     */
    export class BaseInputModule {  
    }
    
    /**
     * This module is responsible for keyboard event handle. User can use game.input.keyboard to refer this module. Common interface have been wrapped in qc.Input.
     */
    export class Keyboard {
        /**
         * Keyboard Code
         */
        static A: number;
        static B: number;
        static C: number;
        static D: number;
        static E: number;
        static F: number;
        static G: number;
        static H: number;
        static I: number;
        static J: number;
        static K: number;
        static L: number;
        static M: number;
        static N: number;
        static O: number;
        static P: number;
        static Q: number;
        static R: number;
        static S: number;
        static T: number;
        static U: number;
        static V: number;
        static W: number;
        static X: number;
        static Y: number;
        static Z: number;
        static ZERO: number;
        static ONE: number;
        static TWO: number;
        static THREE: number;
        static FOUR: number;
        static FIVE: number;
        static SIX: number;
        static SEVEN: number;
        static EIGHT: number;
        static NINE: number;
        static NUMPAD_0: number;
        static NUMPAD_1: number;
        static NUMPAD_2: number;
        static NUMPAD_3: number;
        static NUMPAD_4: number;
        static NUMPAD_5: number;
        static NUMPAD_6: number;
        static NUMPAD_7: number;
        static NUMPAD_8: number;
        static NUMPAD_9: number;
        static NUMPAD_MULTIPLY: number;
        static NUMPAD_ADD: number;
        static NUMPAD_ENTER: number;
        static NUMPAD_SUBTRACT: number;
        static NUMPAD_DECIMAL: number;
        static NUMPAD_DIVIDE: number;
        static F1: number;
        static F2: number;
        static F3: number;
        static F4: number;
        static F5: number;
        static F6: number;
        static F7: number;
        static F8: number;
        static F9: number;
        static F10: number;
        static F11: number;
        static F12: number;
        static F13: number;
        static F14: number;
        static F15: number;
        static COLON: number;
        static EQUALS: number;
        static UNDERSCORE: number;
        static QUESTION_MARK: number;
        static TILDE: number;
        static OPEN_BRACKET: number;
        static BACKWARD_SLASH: number;
        static CLOSED_BRACKET: number;
        static QUOTES: number;
        static BACKSPACE: number;
        static TAB: number;
        static CLEAR: number;
        static ENTER: number;
        static SHIFT: number;
        static CONTROL: number;
        static ALT: number;
        static META: number;
        static META_RWIN: number;
        static META_RMAC: number;
        static CAPS_LOCK: number;
        static ESC: number;
        static SPACEBAR: number;
        static PAGE_UP: number;
        static PAGE_DOWN: number;
        static END: number;
        static HOME: number;
        static LEFT: number;
        static UP: number;
        static RIGHT: number;
        static DOWN: number;
        static INSERT: number;
        static DELETE: number;
        static HELP: number;
        static NUM_LOCK: number;
        static PLUS: number;
        static MINUS: number;
        
        /**
         * Interval time for checking repeat hit, 100ms by default
         */
        repeatInterval: number;
        /**
         * Whether trigger keyboard event
         */
        enable: boolean;
        /**
         * Read only. The count of key pressed
         */
        keyCount: number;
        /**
         * Read only. The ids of key pressed
         */
        keyCodes: number[];
        /**
         * When key is pressed, the event is trigged. Event parameter is keyCode
         */
        onKeyDown: Signal;
        /**
         * When key pop up, the event is trigged. Event parameter is keyCode
         */
        onKeyUp: Signal;
        /**
         * When key keep pressed, the event is trigged. Event parameter is keyCode
         */
        onKeyRepeat: Signal;
        
        /**
         * Check whether a specified key is pressed.
         * @params keyCode: 
         */
        isKeyDown(keyCode: number): boolean;
        /**
         * Check whether any key is pressed
         */
        isAnyKey(): boolean;
        /**
         * Check whether any key is pressed in current frame. Note that it return ture only while key is pressed in current frame, if key is still pressed in next frame, it will return false.
         */
        isAnyKeyDown(): boolean;
    }
    
    /**
     * This module is responsible for mouse event handle. User can use game.input.mouse to refer this module. Common interface have been wrapped in qc.Input.
     */
    export class Mouse {
        /**
         * Mouse ID
         */
        static NONE: number;
        static BUTTON_LEFT: number;
        static BUTTON_MIDDLE: number;
        static BUTTON_RIGHT: number;
        static BUTTON_BACK: number;
        static BUTTON_FORWORD: number;
        
        /**
         * Whether trigger mouse event
         */
        enable: boolean;
        /**
         * Delta distance that mouse scroll in two frame, value like {deltaX: number, deltaY: number}
         */
        mouseWheel: Object;
        /**
         * The count of mouse pressed
         */
        mouseCount: number;
        /**
         * All ids of mouse pressed
         */
        mouseIds: number[];
        /**
         * When mouse is pressed, this event is trigged, Event parameter is (button, worldX, worldY)
         */
        onMouseDown: Signal;
        /**
         * When mouse pop up, this event is trigged, Event parameter is (button, worldX, worldY)
         */
        onMouseUp: Signal;
        /**
         * When mouse move, this event is trigged, Event parameter is (button, worldX, worldY)
         */
        onMouseMove: Signal;
        /**
         * When mouse is pressed and moved, this event is trigged, Event parameter is (button, worldX, worldY)
         */
        onMousePressMove: Signal;
        /**
         * When mouse wheel scroll, this event is trigged, Event parameter is (wheelDelta, wheelDeltaX, wheelDeltaY)
         */
        onMouseWheel: Signal;
        
        /**
         * Check whether any mouse is pressed.
         */
        isAnyMouse(): boolean;
        /**
         * Check whether any mouse is pressed in current frame. Note that it return ture only while mouse is pressed in current frame, if mouse is still pressed in next frame, it will return false.
         */
        isAnyMouseDown(): boolean;
        /**
         * Check whether a specified mouse button is pressed.
         * @params id: mouse id
         */
        isMouseDown(id: number): boolean;
        /**
         * Get mouse by id
         * @params id: mouse id
         */
        getMouseById(id: number): Pointer;
    }
    
    /**
     * This module is responsible for touch event handle. User can use game.input.touch to refer this module. Common interface have been wrapped in qc.Input.
     */
    export class Touch {
        /**
         * Touch ID
         */
        static MAIN: number;
        
        /**
         * Whether trigger touch event
         */
        enable: boolean;
        /**
         * Read only. The count of touch pressed
         */
        touchCount: number;
        /**
         * Read only. The ids of touch pressed
         */
        touchIds: number[];
        
        /**
         * Check whether any touch is pressed
         */
        isAnyTouch(): boolean;
        /**
         * Check whether a specified touch start
         * @params id: touch id
         */
        isTouchStart(id: number): boolean;
        /**
         * Get touch by id
         * @params id: touch id
         */
        getTouchById(id: number): Pointer;
        /**
         * Get touch by device id
         * @params id: device id
         */
        getTouchByDeviceId(id: number): Pointer;
    }
    
    /**
     * The class contains information about point event by mouse and touch trigged.
     */
    export class Pointer {
        /**
         * Read only. game instance
         */
        game: Game;
        /**
         * The press time, unit: ms
         */
        downTime: number;
        /**
         * Read only. ID of pointer
         */
        id: number;
        /**
         * Read only. device id
         */
        deviceId: number;
        /**
         * Read only. x value in world coordinate
         */
        x: number;
        /**
         * Read only. y value in world coordinate
         */
        y: number;
        /**
         * Read only. x value in world coordinate when event start
         */
        startX: number;
        /**
         * Read only. y value in world coordinate when event start
         */
        startY: number;
        /**
         * Read only. when event is trigged by mouse, it is true
         */
        isMouse: boolean;
        /**
         * Read only. Whether is just down
         */
        isJustDown: boolean;
        /**
         * Read only. Whether just up
         */
        isJustUp: boolean;
        /**
         * Read only. Whether is down
         */
        isDown: boolean;
        /**
         * Read only. Whether is downing
         */
        isDowning: boolean;
        /**
         * Read only. Whether is uping
         */
        isUpping: boolean;
        /**
         * Read only. Delta moved distance in axis x
         */
        deltaX: number;
        /**
         * Read only. Delta moved distance in axis y
         */
        deltaY: number;
        /**
         * Read only. Total moved distance in axis x
         */
        distanceX: number;
        /**
         * Read only. Total moved distance in axis y
         */
        distanceY: number;
        /**
         * Read only. Whether is a effect event
         */
        effect: boolean;
        /**
         * Read only. Event id, device id by default
         */
        eventId: number;
    }
    
    /**
     * Used for record information of key event.
     */
    export class Key {
        /**
         * Read only. game instance
         */
        game: Game;
        /**
         * Key code, see qc.Keyboard
         */
        keyCode: number;
        /**
         * Whether key is pressed in current frame
         */
        isJustDown: boolean;
        /**
         * Whether key pop up in current frame
         */
        isJustUp: boolean;
        /**
         * Whether key is pressed
         */
        isDown: boolean;
        
        /**
         * Set state of key.
         * @params isDown: true : key is pressed
         */
        setState(isDown: boolean): boolean;
        /**
         * Check whether trigger repeat hit.
         * @params repeatInterval: Interval time
         */
        checkRepeat(repeatInterval: number): boolean;
    }
    
    /**
     * Basic input event.
     */
    export class BaseInputEvent {
        /**
         * Event source
         */
        source: Key|Pointer|Object;
        /**
         * Whether event is effective
         */
        effect: boolean;
    }
    
    /**
     * The mouse wheel event.
     */
    export class WheelEvent extends BaseInputEvent {
        /**
         * Read only. Delta scroll distance in axis x
         */
        deltaX: number;
        /**
         * Read only. Delta scroll distance in axis y
         */
        deltaY: number;
    }
    
    /**
     * Cursor move event.
     */
    export class CursorMoveEvent extends BaseInputEvent {
        /**
         * Read only. x value of cursor
         */
        x: number;
        /**
         * Read only. y value of cursor
         */
        y: number;
    }
    
    /**
     * It is a class indicates pointer event.
     */
    export class PointerEvent extends BaseInputEvent {
    }
    
    /**
     * Event of drag start.
     */
    export class DragStartEvent extends PointerEvent {
        /**
         * Whether drag is started
         */
        started: boolean;
    }
    
    /**
     * Event of drag end.
     */
    export class DragEndEvent extends PointerEvent {
        /**
         * the result of drag end
         */
        result: any;
    }
    
    /**
     * Event of drag.
     */
    export class DragEvent extends PointerEvent {
    }
    
    /**
     * Event of drag drop.
     */
    export class DropEvent extends PointerEvent {
        /**
         * current dragging node
         */
        dragging: Node;
        /**
         * result of drag end
         */
        result: any;
    }
  
    /**
     * Input manager is responsible for manage keyboard、mouse、touch event. User can use game.input to refer this module. Note that this module only manage basic event, such as mouse scroll、mouse click、touch click、keyboard event. Advanced event is supported by qc.BaseInputModule
     */
    export class Input {
        /**
         * Read only. game instance
         */
        game: Game;
        /**
         * Keyboard object that monitor keyboard event.
         */
        keyboard: Keyboard;
        /**
         * Mouse object that minitor mouse event.
         */
        mouse: Mouse;
        /**
         * Touch object that minitor touch event
         */
        touch: Touch;
        /**
         * Advanced event handler
         */
        module: BaseInputModule;
        /**
         * Current position of cursor in world coordinate
         */
        cursorPosition: Point;
        /**
         * Delta distance scrolled in axis x in current frame
         */
        wheelDeltaX: number;
        /**
         * Delta distance scrolled in axis y in current frame
         */
        wheelDeltaY: number;
        /**
         * The count of key pressed in current frame
         */
        keyCount: number;
        /**
         * The codes of key pressed in current frame
         */
        keyCodes: number[];
        /**
         * The count of mouse pressed in current frame
         */
        mouseCount: number;
        /**
         * The ids of mouse pressed in current frame
         */
        mouseIds: number[];
        /**
         * The count of touch pressed in current frame
         */
        touchCount: number;
        /**
         * The ids of touch pressed in current frame
         */
        touchIds: number[];
        /**
         * The count of pointer in current frame, include mouse and touch
         */
        pointerCount: number;
        /**
         * The ids of pointer in current frame, include mouse and touch
         */
        pointers: number[];
        /**
         * true by default, no event when is false
         */
        enable: boolean;
        /**
         * Whether is in editing
         */
        inputting: boolean;
        /**
         * When key is pressed, the event is trigged. Event parameter is (keyCode，charCode)
         */
        onKeyDown: Signal;
        /**
         * When key pop up, the event is trigged. Event parameter is (keyCode，charCode)
         */
        onKeyUp: Signal;
        /**
         * When key keep pressed, the event is trigged repeatly. Event parameter is (keyCode)
         */
        onKeyRepeat: Signal;
        /**
         * When mouse moved, the event is trigged. Event parameter is (pos_x, pos_y)
         */
        onCursorMove: Signal;
        /**
         * When mouse wheel scroll, the event is trigged. Event parameter is (deltaX, deltaY)
         */
        onWheel: Signal;
        /**
         * When mouse or touch pressed, the event is trigged. Event parameter is (id，pos_x，pos_y)
         */
        onPointerDown: Signal;
        /**
         * When mouse or touch poop up, the event is trigged. Event parameter is (id，pos_x，pos_y)
         */
        onPointerUp: Signal;
        /**
         * When mouse or touch moved, the event is trigged. Event parameter is (id，pos_x，pos_y)
         */
        onPointerMove: Signal;
        
        /**
         * Check whether a specified key is pressed.
         * @params keyCode: see qc.Keyboard
         */
        isKeyDown(keyCode: number): boolean;
        /**
         * Check whether any key is pressed in current frame. Note that it return ture only while key is pressed in current frame, if key is still pressed in next frame, it will return false.
         */
        isAnyKeyDown(): boolean;
        /**
         * Check whether any key is pressed
         */
        isAnyKey(): boolean;
        /**
         * Check whether Alt key is pressed
         */
        isAltDown(): boolean;
        /**
         * Check whether Control key is pressed
         */
        isControlDown(): boolean;
        /**
         * Check whether Shift key is pressed
         */
        isShiftDown(): boolean;
        /**
         * Check whether Meta key is pressed
         */
        isMetaDown(): boolean;
        /**
         * Check whether a specified mouse button is pressed.
         * @params id: see qc.Mouse
         */
        isMouseDown(id: number): boolean;
        /**
         * Check whether any mouse is pressed in current frame. Note that it return ture only while mouse is pressed in current frame, if mouse is still pressed in next frame, it will return false.
         */
        isAnyMouseDown(): boolean;
        /**
         * Check whether any mouse is pressed.
         */
        isAnyMouse(): boolean;
        /**
         * Check whether a specified touch start
         * @params id: see qc.Touch
         */
        isTouchStart(id: number): boolean;
        /**
         * Check whether any touch is pressed in current frame
         */
        isAnyTouchStart(): boolean;
        /**
         * Check whether any touch is pressed
         */
        isAnyTouch(): boolean;
        /**
         * Mouse is down or touch start?
         * @param id: device id(mouse or touch)
         */
        isPointerStart(id: number): boolean;
        /**
         * Any mouse is down or touch start in current frame?
         */
        isAnyPointerStart(): boolean;
        /**
         * touch.isAnyTouch() || mouse.isAnyMouse()
         */
        isAnyPointer(): boolean;
        /**
         * Check whether curse is existed.
         */
        hasCursor(): boolean;
        /**
         * Check whether specified id is mouse
         * @params id: Device Id
         */
        isMouse(id: number): boolean;
        /**
         * Get pointer by id.
         */
        getPointer(id: number): Pointer;
    }
    
    /**
     * This is the core internal game clock.
     * It manages the elapsed time and calculation of elapsed values, used for game object motion and tweens.
     * This class represents a singleton object that can be accessed directly as game.time.
     */
    export class Time {
        /**
         * The local game reference.
         */
        game: Game;
        /**
         * The desired frame rate of the game.
         */
        frameRate: number;
        /**
         * Read only. The Date.now() value
         */
        now: number;
        /**
         * Read only. The number of milliseconds that have elapsed since the game was started. Affected by timeScale
         */
        scaledTime: number;
        /**
         * Read only. The number of milliseconds that have elapsed since the game was started.
         */
        fixedTime: number;
        /**
         * Scaling factor to make the game move smoothly in slow motion. 1.0=normal speed; 2.0=half speed.
         */
        timeScale: number;
        /**
         * Elapsed time since the last time update, in milliseconds.
         */
        deltaTime: number;
    }
  
    /**
     * A Timer is a way to create small re-usable (or disposable) objects that wait for a specific moment in time, and then run the specified callbacks.
     * This class represents a singleton object that can be accessed directly as game.timer.
     * Be careful: The timer is affected by game.time.timeScale
     */
    export class Timer {
        /**
         * Create a new timer event.
         * @params delay: The number of milliseconds that should elapse before the callback is invoked.
         * @params cb: The callback that will be called when the Timer event occurs.
         * @params context: The context in which the callback will be called.
         * @params params: Additional arguments that will be supplied to the callback.
         */
        add(delay:number, cb:Function, context?:Object, ...params): TimerEvent;
        /**
         * Adds a new looped Event
         * @params delay: The number of milliseconds that should elapse before the callback is invoked.
         * @params cb: The callback that will be called when the Timer event occurs.
         * @params context: The context in which the callback will be called.
         * @params params: Additional arguments that will be supplied to the callback.
         */
        loop(delay:number, cb:Function, context?:Object, ...params): TimerEvent;
        /**
         * Removes a pending TimerEvent from the queue.
         * @params e: The event to remove from the queue.
         */
        remove(e: TimerEvent): void;
    }
    
    /**
     * Describe a timer
     */
    export class TimerEvent {
    }
    
    /**
     * Stores and accesses player preferences between game sessions.
     * This class represents a singleton object that can be accessed directly as game.storage.
     * Be careful, all datas will be clear when Clean browser cache.
     */
    export class Storage {
        /**
         * Restores all datas. When this module constructed, this function is automatic called.
         */
        restore(): void;
        /**
         * Save all datas.
         */
        save(): void;
        /**
         * Save an item.
         * @params key: the unique key of item
         * @params value: the value of item
         */
        set(key: string, value: any): void;
        /**
         * The unique key of the item to query.
         * @params key: The unique key of the item to query.
         */
        get(key: string): any;
        /**
         * Delete a item.
         * @params key: The unique key of the item to delete.
         */
        del(key: string);
    }
    
    /**
     * Used for manage game sound, can use game.sound to refer to. Create a qc.Sound object by game.add.sound
     */
    export class SoundManager {
        /**
         * Whether is mute
         */
        mute: boolean;
        /**
         * Get or set sound volume
         */
        volume: number;
    }
  
    /**
     * This module handles loading all external content such as Images, Sounds, Texture Atlases and data files.This class represents a singleton object that can be accessed directly as game.assets.
     */
    export class Assets {
        /**
         * Local reference to game.
         */
        game: Game
        /**
         * Read only. True if the Loader is in the process of loading the queue.
         */
        isLoading: boolean;
        /**
         * Read only. True if all assets in the queue have finished loading.
         */
        hasLoaded: boolean;
        /**
         * If you want to append a URL before the path of any asset you can set this here.
         */
        baseURL: string;
        /**
         * Read only. True if the Loader is in the process of unpacking the queue.
         */
        parsing: boolean;
        /**
         * Read only. The number of assets that have finished loading.
         */
        loaded: number;
        /**
         * Read only. The number of all assets in the queue.
         */
        total: number;
        /**
         * Maximum retry times when load assets failed, default value is 1.
         */
        maxRetryTimes: number;
        
        /**
         * synchronous load resource.
         * @params url: Url of resource.
         * @params key: Key of resource
         * @params callback: Callback after resource load successful
         */
        load(url: string, callback?: Function): void;
        load(key: string, url: string, callback?: Function): void;
        /**
         * Asynchronous load resource in batch.
         * @params items: The array of resource info
         * @params callback: Callback after resource load successful
         */
        loadBatch(items: Array<{key?: string; url: string}>, callback?: Function): void;
        /**
         * Find the specified resource.
         * @params keyOrUrl: Key or Url of resource 
         */
        find(keyOrUrl: string): any;
        /**
         * Release resource from memory.
         * @params asset: Key or Url of resource; the asset object
         */
        unload(asset: any): void;
        /**
         * Clear all the assets.
         */
        clear(): void;
        /**
         * Asynchronous load a texture from website.
         * @params url: Url of resource.
         * @params key: Key of resource
         * @params IMG: The image DOM.
         * @params callback: Callback after resource load successful
         */
        loadTexture(url: string, callback?: Function): void;
        loadTexture(IMG: HTMLImageElement, callback?: Function): void;
        loadTexture(key: string, url: string, callback?: Function): void;
        loadTexture(key: string, IMG: HTMLImageElement, callback: Function): void;
    }
    
    /**
     * Asset utility.
     */
    export class AssetUtil {
        /**
         * Send GET request.
         * @params url: The address of request
         * @params onload: The callback of succeed. Prototype is : onload(data)
         * @params onerror: The callback of fail. Prototype is : onerror(XMLHTTPREQUEST xhr)
         */
        static get(url: string, onload: Function, onerror?: Function): void;
        /**
         * Send POST request.
         * @params url: The address of request
         * @params data: The data need to post
         * @params onload: The callback of succeed. Prototype is : onload(data)
         * @params onerror: The callback of fail. Prototype is : onerror(XMLHTTPREQUEST xhr)
         */
        static post(url: string, data: string, onload: Function, onerror?: Function): void;        
        /**
         * Get a XMLHTTPREQUEST object, then impletment custom network operation.
         */
        static getXHR(): XMLHttpRequest;
    }
  
    /**
     * Downloads or loads the scene.
     * This class represents a singleton object that can be accessed directly as game.scene.
     */
    export class SceneManager {
        /**
         * The local game reference.
         */
        game: Game;
        /**
         * The entry scene's name.
         */
        entry: string;
        /**
         * The scene list of the game.
         */
        list: string[];
        /**
         * Is the scene in loading?
         */
        loading: boolean;
        /**
         * The current running scene.
         */
        current: string;
        /**
         * When the scene starts loading, this event is triggered.
         */
        onStartLoad: Signal;
        /**
         * When the scene loads complete, this event is triggered.
         */
        onEndLoad: Signal;
        
        /**
         * Downloads a scene asset.
         * @params scene: The scene to download.
         * @params callback: The callback of download successful.
         */
        download(scene: string, callback?: Function): void;
        /**
         * Loads a scene. If the scene has not been downloaded, the function will download first.
         * @params scene: The scene to load.
         * @params clear: Whether to clear up all cached assets. Default:false.
         * @params preload: The callback of preload.
         * @params create: The callback of initialization process.
         */
        load(scene: string, clear?: boolean, preload?: Function, create?: Function): void;
    }
  
    /**
     * Define the types of field
     */
    export class Serializer {
        static AUTO: number;
        static INT: number;
        static INTS: number;
        static NUMBER: number;
        static NUMBERS: number;
        static BOOLEAN: number;
        static BOOLEANS: number;
        static STRING: number;
        static STRINGS: number;
        static MAPPING: number;
        static TEXTURE: number;
        static TEXTURES: number;
        static AUDIO: number;
        static AUDIOS: number;
        static COLOR: number;
        static COLORS: number;
        static PREFAB: number;
        static PREFABS: number;
        static NODE: number;
        static NODES: number;
        static SCRIPT: number;
        static SCRIPTS: number;
        static GEOM: number;
        static GEOMS: number;
        static POINT: number;
        static POINTS: number;
        static RECTANGLE: number;
        static RECTANGLES: number;
        static CIRCLE: number;
        static CIRCLES: number;
        static ELLIPSE: number;
        static ELLIPSES: number;
        static FONT: number;
        static FONTS: number;
        static FILTER: number;
        static FILTERS: number;
        static TEXTASSET: number;
        static TEXTASSETS: number;
        static EXCELASSET: number;
        static EXCELASSETS: number;
    }
    
    /**
     * des
     */
    export class Des {
        /**
         * encrypt a string using des.
         */
        static encrypt(key: string, message: string): string;
        /**
         * decrypt a string using des.
         */
        static decrypt(key: string, message: string): string;
    }

    /**
     * Base class for everything attached to GameObjects.
     * 
     * Note that your code will never directly create a Behaviour. Instead, you write script code, and attach the script to a GameObject(Node).
     */
    export abstract class Behaviour {
        constructor(gameObject: Node);
        
        /**
         * Read only. Local reference to game.
         */
        game: Game;
        /**
         * The Node for attatching this behaviour.
         */
        gameObject: Node;
        /**
         * The name of the node.
         */
        name: string;
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        enable: boolean;
        /**
         * Default false. If true the bahaviours are updated in editor.
         */
        runInEditor: boolean;
        
        /**
         * see Node#getScript
         */
        getScript(script: string): Behaviour;
        /**
         * see Node#getScripts
         */
        getScripts(script: string): Behaviour[];
        /**
         * Destroy the behaviour. When destroyed, the function 'onDestroy' will be called.
         */
        destroy();
        /**
         * Listen event hook, it will be removed automatically when object destroy.
         * @params signal: Event signal object
         * @params listener: event callback
         * @params context: owner of listener
         * @params priority: priority of listener
         */
        addListener(signal: Signal, listener: Function, context?: Object, priority?: number): void;   
    }
    
    /**
     * Define a Behaviour class.
     */
    export function defineBehaviour(clazz: string, inheritFrom: any, init: Function, serializable: Object): Behaviour;
    
    /**
     * Register a Behaviour class.
     * @params className: The full classname with namespace
     * @params clazz: The class object
     */
    export function registerBehaviour(className: string, clazz: Function): void;
    
    /**
     * Adaptive resolution component.
     */
    export class ScaleAdapter extends Behaviour {
        /**
         * Scale Type
         */
        static NONE: number;
        static MANUAL_HEIGHT: number;
        static MANUAL_WIDTH: number;
        static EXPAND: number;
        static SHRIKN: number;
        static FILL: number;
        
        /**
         * target object
         */
        target: Node;
        /**
         * Reference resolution
         */
        referenceResolution: Point;
        /**
         * Scale type
         * NONE: Not scale
         * MANUAL_HEIGHT: Scale base on height. the height of area is referenceResolution.y
         * MANUAL_WIDTH: Scale base on width. the height of area is referenceResolution.x
         * EXPAND: Scale to make it exactly place in the target area
         * SHRIKN: Scale to make it surround the target area
         * FILL: Scale width and height individually, make target resolution is equal to referenceResolution
         */
        manualType: number;
        /**
         * Whether to fill full area
         */
        fullTarget: boolean;
    }
    
    /**
     * Resizes a RectTransform to fit a specified aspect ratio.
     */
    export class AspectRatioFitter extends Behaviour {
        /**
         * The mode to use to enforce the aspect ratio
         */
        static NONE: number;
        static WIDTH_CONTROLS_HEIGHT: number;
        static HEIGHT_CONTROLS_WIDTH: number;
        static FIT_IN_PARENT: number;
        static ENVELOPE_PARENT: number;
        
        /**
         * The mode to use to enforce the aspect ratio
         * NONE: The aspect ratio is not enforced.
         * WIDTH_CONTROLS_HEIGHT: Changes the height of the rectangle to match the aspect ratio.
         * HEIGHT_CONTROLS_WIDTH: Changes the width of the rectangle to match the aspect ratio.
         * FIT_IN_PARENT: Sizes the rectangle such that it's fully contained within the parent rectangle.
         * ENVELOPE_PARENT: Sizes the rectangle such that the parent rectangle is fully contained within.
         */
        mode: number;
        /**
         * The aspect ratio
         */
        ratio: number;
    }
    
    /**
     * A component for table layout.
     */
    export class TableLayout extends Bounds {
        /**
         * Not limit row and column,automally adjust row and column by size
         */
        static CONSTRAINT_FLEXIBLE: number;
        /**
         * Fixed column count
         */
        static CONSTRAINT_FIX_COLUMN_COUNT: number;
        /**
         * Fixed row count
         */
        static CONSTRAINT_FIX_ROW_COUNT: number;
        /**
         * Keep cell size to layout.
         */
        static STYLE_WRAP_ELEMENT: number;
        /**
         * Keep self's RectTransform to layout, will change the size of cell.
         */
        static STYLE_RESIZE_ELEMENT: number;
        /**
         * Horizontal direction
         */
        static AXIS_HORIZONTAL: number;
        /**
         * Vertical direction
         */
        static AXIS_VERTICAL: number;
        /**
         * Top left corner
         */
        static CORNER_TOP_LEFT: number;
        /**
         * Top right cornet
         */
        static CORNER_TOP_RIGHT: number;
        /**
         * Bottom right cornet
         */
        static CORNER_BOTTOM_RIGHT: number;
        /**
         * Bottom left cornet
         */
        static CORNER_BOTTOM_LEFT: number;
        /**
         * Horizontal left
         */
        static ALIGN_LEFT: number;
        /**
         * Horizontal center
         */
        static ALIGN_CENTER: number;
        /**
         * Horizontal right
         */
        static ALIGN_RIGHT: number;
        /**
         * Vertical top
         */
        static ALIGN_TOP: number;
        /**
         * Vertical center
         */
        static ALIGN_MIDDLE: number;
        /**
         * Vertical bottom
         */
        static ALIGN_BOTTOM: number;
        /**
         * Top left
         */
        static ALIGN_TOP_LEFT: number;
        /**
         * Top center
         */
        static ALIGN_TOP_CENTER: number;
        /**
         * Top right
         */
        static ALIGN_TOP_RIGHT: number;
        /**
         * Middle left
         */
        static ALIGN_MIDDLE_LEFT: number;
        /**
         * Middle center
         */
        static ALIGN_MIDDLE_CENTER: number;
        /**
         * Middle right
         */
        static ALIGN_MIDDLE_RIGHT: number;
        /**
         * Bottom left
         */
        static ALIGN_BOTTOM_LEFT: number;
        /**
         * Bottom center
         */
        static ALIGN_BOTTOM_CENTER: number;
        /**
         * Bottom right
         */
        static ALIGN_BOTTOM_RIGHT: number;
        
        /**
         * Layout constraint
         */
        constraint: number;
        /**
         * Layout start corner, left top by default
         */
        startCorner: number;
        /**
         * Layout start direction, horizontal by default
         */
        startAxis: number;
        /**
         * Size calculate mode. see Bounds's sizeProvider
         */
        contentSizeProvider: number;
        /**
         * Current layout style. TableLayout.STYLE_WRAP_ELEMENT、TableLayout.STYLE_RESIZE_ELEMENT.
         */
        style: number;
        /**
         * Spacing in x axis
         */
        spacingX: number;
        /**
         * Spacing in y axis
         */
        spacingY: number;
        /**
         * Width of cell
         */
        cellWidth: number;
        /**
         * Height of cell
         */
        cellHeight: number;
        /**
         * Alignment mode of content, effective only while style is TableLayout.STYLE_RESIZE_ELEMENT.
         */
        contentAlignment: number;
        /**
         * Alignment mode of cell
         */
        cellAlignment: number;
        /**
         * Read Only. current column count
         */
        columnsCount: number;
        /**
         * Read Only. current row count
         */
        rowsCount: number;
        /**
         * Whether ignore the adjustment on the x-axis direction.
         */
        ignoreX: boolean;
        /**
         * Whether ignore the adjustment on the y-axis direction.
         */
        ignoreY: boolean;
        /**
         * Whether relayout per frame automatically.
         */
        autoUpdate: boolean;
        
        /**
         * Get style of a cell.
         * @params column: Column num
         * @params row: Row num
         */
        getCellStyle(column: number, row: number): ({ 
            align: number,
            timestamp: number,
            paddingLeft: number,
            paddingRight: number,
            paddingTop: number,
            paddingBottom: number,
            cellWidth: number,
            cellHeight: number
        });
        /**
         * Set style of a cell.
         * @params column: Column num
         * @params row: Row num
         * @params align: Layout alignment mode
         * @params paddingXXX: The around padding of cell
         * @params cellWidth: Width of cell
         * @params cellHeight: Height of cell
         */
        setCellStyle(column: number, row: number, align: number, paddingTop: number, paddingRight: number, paddingBottom: number, paddingLeft: number, cellWidth: number, cellHeight: number): void;
        /**
         * Clear style of a cell
         * @params column: Column num
         * @params row: Row num
         */
        clearCellStyle(column: number, row: number): void;
        /**
         * Relayout the container.
         */
        relayout(): void;
        /**
         * Get box size of cell
         * @params node: Node
         * @params force: Whether to recalculate forcely
         */
        getCellRect(node: Node, force?: boolean): Rectangle;
        /**
         * Get layout of a cell
         * @params node: Node
         */
        getCellLayout(node: Node): {
            ignoreLayout: boolean,
            minWidth: number,
            minHeight: number,
            preferredWidth: number,
            preferredHeight: number,
            flexibleWidth: number,
            flexibleHeight: number
        };
    }
    
    /**
     * Layout child layout elements side by side.
     * 
     * The HorizontalLayoutGroup component is used to layout child layout elements side by side according to their respective minimum, preferred, and flexible widths.
     */
    export class HorizontalLayout extends TableLayout {
        /**
         * Spacing value
         */
        spacing: number;
        /**
         * Whether to stretch width forcely
         */
        childForceExpandWidth: number;
        /**
         * Whether to stretch height forcely
         */
        childForceExpandHeight: number;
    }
    
    /**
     * Layout child layout elements below each other.
     * 
     * The VerticalLayoutGroup component is used to layout child layout elements below each other according to their respective minimum, preferred, and flexible heights.
     */
    export class VerticalLayout extends TableLayout {
        /**
         * Spacing value
         */
        spacing: number;
        /**
         * Whether to stretch width forcely
         */
        childForceExpandWidth: number;
        /**
         * Whether to stretch height forcely
         */
        childForceExpandHeight: number;
    }
    
    /**
     * Add this component to a GameObject to make it into a layout element or override values on an existing layout element.
     */
    export class LayoutElement extends Bounds {
        /**
         * Whether to allow to ignore layout
         */
        ignoreLayout: boolean;
        /**
         * Minimum width
         */
        minWidth: number;
        /**
         * Minimum height
         */
        minHeight: number;
        /**
         * Preferred width
         */
        preferredWidth: number;
        /**
         * Preferred height
         */
        preferredHeight: number;
        /**
         * Flexible width
         */
        flexibleWidth: number;
        /**
         * Flexible height
         */
        flexibleHeight: number;
        /**
         * Has minimum width set
         */
        hasMinWidth: boolean;
        /**
         * Has minimum height set
         */
        hasMinHeight: boolean;
        /**
         * Has preferred width set
         */
        hasPreferredWidth: boolean;
        /**
         * Has preferred height set
         */
        hasPreferredHeight: boolean;
        /**
         * Has flexible width set
         */
        hasFlexibleWidth: boolean;
        /**
         * Has flexible height set
         */
        hasFlexibleHeight: boolean;
        
        /**
         * Get the layout of a cell
         * @params node: Node
         */
        getLayoutElement(node: Node): ({
            ignoreLayout: boolean,
            minWidth: number,
            minHeight: number,
            preferredWidth: number,
            preferredHeight: number,
            flexibleWidth: number,
            flexibleHeight: number
        });
    }
    
    /**
     * Represents an axis aligned bounding box.
     */
    export class Bounds extends Behaviour {
        /**
         * Use the actual display range as the border
         */
        static USE_BOUNDS: number;
        /**
         * Use rectTransform as border, unUnaffected by rotation、scale and so on
         */
        static USE_RECTTRANSFORM: number;
        
        /**
         * The way for size calculate. There are two values:Bounds.USE_BOUNDS(Use the actual display range as the border)、Bounds.USE_RECTTRANSFORM(Use rectTransform as border, unUnaffected by rotation、scale and so on)
         */
        sizeProvider: number;
        /**
         * The top margin relative to the parent
         */
        marginTop: number;
        /**
         * The bottom margin relative to the parent
         */
        marginBottom: number;
        /**
         * The left margin relative to the parent
         */
        marginLeft: number;
        /**
         * The right margin relative to the parent
         */
        marginRight: number;
        /**
         * The top margin relative to the child
         */
        paddingTop: number;
        /**
         * The bottom margin relative to the child
         */
        paddingBottom: number;
        /**
         * The left margin relative to the child
         */
        paddingLeft: number;
        /**
         * The right margin relative to the child
         */
        paddingRight: number;
        
        /**
         * Get the boundary information of a node in its own coordinate system.
         * @params node: Node object
         * @params sizeProvider: The way for size calculate. There are two values:Bounds.USE_BOUNDS(Use the actual display range as the border)、Bounds.USE_RECTTRANSFORM(Use rectTransform as border, unUnaffected by rotation、scale and so on)
         * @params force: Whether refresh immediately
         * @params deep: 0:only self, -1:all child nodes, 2:recursive 2 layer in nodes
         */
        getBounds(node: Node, sizeProvider: number, force?: boolean, deep?: number): Rectangle;
        /**
         * Get the boundary info of a node in the specified object's coordinate system
         * @params node: Node object
         * @params sizeProvider: The way for size calculate. There are two values:Bounds.USE_BOUNDS(Use the actual display range as the border)、Bounds.USE_RECTTRANSFORM(Use rectTransform as border, unUnaffected by rotation、scale and so on)
         * @params force: Whether refresh immediately
         * @params deep: 0:only self, -1:all child nodes, 2:recursive 2 layer in nodes
         * @params target: target node
         */
        getBox(node: Node, sizeProvider: number, force?: boolean, deep?: number, target?: Node): Rectangle;
    }
    
    /**
     * see: http://docs.qiciengine.com/manual/Filter/index.html
     */
    export class FilterGroup extends Behaviour {
    }
    
    /**
     * A component for masking children elements.
     */
    export class NodeMask extends Behaviour {
        /**
         * cut the display rectangle of the current node
         */
        static MODE_DEFAULT: number;
        /**
         * cut the display content of the current node
         */
        static MODE_PIXEL: number;
        /**
         * cut with custom graphics
         */
        static MODE_GRAPHICS: number;
        
        /**
         * Whether to detect whether the child node is in the range
         */
        checkInField: boolean;
        /**
         * mask mode.(NodeMask.MODE_DEFAULT:cut the display rectangle of the current node、NodeMask.MODE_PIXEL：cut the display content of the current node、NodeMask.MODE_GRAPHICS：cut with custom graphics）
         */
        mode: number;
        /**
         * custom graphics
         */
        customGraphics: any;
    }
    
    /**
     * A component that represents a group of Toggles.
     * 
     * When using a group reference the group from a Toggle. Only one member of a group can be active at a time.
     */
    export class ToggleGroup extends Behaviour {
        /**
         * Currently active toggle
         */
        toggle: Toggle; 
        /**
         * Is it allowed that no toggle is switched on
         */
        allowSwitchOff: boolean;
        /**
         * List of managed toggles
         */
        toggles: Toggle[];

        /**
         *  When current toggle changed, this event will be fired.
         */
        onValueChange: Signal;
    }
    
    /**
     * A component for state change: normal、pressed、disable
     */
    export class TransitionBehaviour extends Behaviour {
        /**
         * The target node to apply transition.
         */
        target: Node;
        /**
         * Transition mode: Transition.Node(No Transition), Transition.COLOR_TINT(Use an color tint transition), Transition.TEXTURE_SWAP(Use a sprite swap transition), Transition.ANIMATION(Use an animation transition)
         */
        transition: Transition;
        /**
         * transition=Transition.COLOR_TINT && The color when disable
         */
        disabledColor: Color;
        /**
         * transition=Transition.TEXTURE_SWAP && The Texture when disable
         */
        disabledTexture: Texture;
        /**
         * transition=Transition.COLOR_TINT && The normal color
         */
        normalColor: Color;
        /**
         * transition=Transition.TEXTURE_SWAP && The normal texture
         */
        normalTexture: Texture;
        /**
         * transition=Transition.COLOR_TINT && The color when pressed
         */
        pressedColor: Color;
        /**
         * transition=Transition.TEXTURE_SWAP && The texture when pressed
         */
        pressedTexture: Texture;
    }
    
    /**
     * Base class for all tweening operations.
     */
    export class Tween extends Behaviour {
        /**
         * Play Once
         */
        static STYLE_ONCE: number;
        /**
         * Loop the tween
         */
        static STYLE_LOOP: number;
        /**
         * Pingpong the tween
         */
        static STYLE_PINGPONG: number;
        
        /**
         * If set to be true, the tween will automatically start playing on awake.
         */
        playOnAwake: boolean;
        /**
         * The flag of tween.
         */
        flag: string;
        /**
         * Does it play once? Does it loop? Value: Tween.STYLE_ONCE(Play Once)、Tween.STYLE_LOOP(Loop the tween)、Tween.STYLE_PINGPONG(Pingpong the tween)
         */
        style: number;
        /**
         * Curve of tween.
         */
        curve: BezierCurve;
        /**
         * How long will the tweener wait before starting the tween? Unit: second.
         */
        delay: number;
        /**
         * How long is the duration of the tween? Unit: second.
         */
        duration: number;
        /**
         * Used by buttons and tween sequences. Group of '0' means not in a sequence.
         */
        tweenGroup: number;
        /**
         * When the animation starts, this event is triggered.
         */
        onStart: Signal;
        /**
         * When the animation finishes, this event is triggered.
         */
        onFinished: Signal;
        /**
         * When the animation finishes a loop, this event is triggered.
         */
        onLoopFinished: Signal;
        
        /**
         * Play the tween forward.
         * @params reset: Reset position to beginning. Default: false
         */
        playForward(reset?: boolean): void;
        /**
         * Play the tweens with same 'tweenGroup' forward.
         * @params reset: Reset position to beginning. Default: false
         */
        playGroupForward(reset?: boolean): void;
        /**
         * Play the tween in reverse.
         * @params reset: Reset position to beginning. Default: false
         */
        playReverse(reset?: boolean): void;
        /**
         * Play the tweens with same 'tweenGroup' in reverse.
         * @params reset: Reset position to beginning. Default: false
         */
        playGroupReverse(reset?: boolean): void;
    }
    
    /**
     * Tween the object's alpha.
     */
    export class TweenAlpha extends Tween {
        /**
         * From alpha, 0-1
         */
        from: number;
        /**
         * To alpha, 0-1
         */
        to: number;
    }
    
    /**
     * Tween the object's position.
     */
    export class TweenPosition extends Tween {
        /**
         * move x position only
         */
        static ONLY_X: number;
        /**
         * move y position only
         */
        static ONLY_Y: number;
        /**
         * move x and y
         */
        static BOTH: number;
        
        /**
         * From position(x and y, but not anchoredX or anchoredY).
         */
        from: Point;
        /**
         * To Position(x and y, but not anchoredX or anchoredY).
         */
        to: Point;
        /**
         * TweenPosition.ONLY_X(move x position only)、TweenPosition.ONLY_Y(move y position only)、TweenPosition.BOTH(move x and y)
         */
        moveAxis: number;
    }

    /**
     * Tween the object's color.
     */
    export class TweenColor extends Tween {
        /**
         * From color
         */
        from: Color;
        /**
         * To color
         */
        to: Color;
    }
    
    /**
     * Tween the object's position, the start and end position are determined by two game objects.
     */
    export class TweenTransform extends Tween {
        /**
         * Game object which determines the start position.
         */
        from: Node;
        /**
         * Game object which determines the end position.
         */
        to: Node;
    }
    
    /**
     * Tween the object's rotation.
     */
    export class TweenRotation extends Tween {
        /**
         * From radian.
         */
        from: number;
        /**
         * To radian.
         */
        to: number;
    }
    
    /**
     * Tween the object's local scale.
     */
    export class TweenScale extends Tween {
        /**
         * From scale.
         */
        from: Point;
        /**
         * To scale.
         */
        to: Point;
    }
    
    /**
     * Tween a property of the object.
     */
    export class TweenProperty extends Tween {
        /**
         * Property of the object.
         */
        property: string;
        /**
         * From value.
         */
        from: number;
        /**
         * To value.
         */
        to: number;
    }
    
    /**
     * This bahaviour can be attacked to UIText/DOM and show debug information, such as FrameRate.
     */
    export class DebugView extends Behaviour {
        /**
         * The debug mode is enable if true.
         * see: http://docs.qiciengine.com/manual/Debug/index.html
         */
        debugOn: boolean;
    }
    
    /**
     * Enhance rendering efficiency, especially in the canvas mode. This component will cache the node to a picture, then each time take the picture for rendering directly. This logical component can only cache a single self node, and it can also cache all child nodes.
     * 
     * Note that when the content changes, you need to set the dirty property to flush the cache.
     * 
     * see: http://docs.qiciengine.com/manual/BuildinComponents/CacheAsBitmap.html
     */
    export class CacheAsBitmap extends Behaviour {
        /**
         * The cache type
         */
        static CACHE_FOR_SCREEN: number;
        static CACHE_FOR_SELF: number;
        /**
         * The bound type
         */
        static BOUNDS_SELF: number;
        static BOUNDS_ALL: number;
        
        /**
         * The cache type, there are two possible values: CacheAsBitmap.CACHE_FOR_SCREEN, CacheAsBitmap.CACHE_FOR_SELF
         */
        cacheType: number;
        /**
         * The bound type, there are two possible values: CacheAsBitmap.BOUNDS_SELF(only cache self)、CacheAsBitmap.BOUNDS_ALL(cache self and child)
         */
        boundsType: number;
        /**
         * Whether to limit the size of the cache, false by default
         */
        boundsInScreen: boolean;
        /**
         * Whether need to refresh cache
         */
        dirty: boolean;
    }
    
    /**
     * For qc.Dropdown. Only Text or Texture is supported.
     */
    export class DropdownItem extends Behaviour {
        /**
         * The node for showing background.
         */
        checkBackground: Node;
        /**
         * When the item is selected, this node is visible. 
         */
        checkMark: Node;
        /**
         * When the option is text type, this node visible. 
         */
        text: UIText;
        /**
         * When the option is image type, this node visible. 
         */
        image: UIImage;
        /**
         * The index of dropdown items.
         */
        index: number;
    }
    
    /**
     * qc.Action is abstract of Action Clip file. It is responsible for controlling Action Clip.
     */
    export class Action {
        /**
         * local reference to the game.
         */
        game: Game;
        /**
         * Action's target object who play this action.
         */
        targetObject: Node;
        /**
         * Whether targetObject is locked.
         */
        targetLocked: boolean;
        /**
         * Frame amount per second.
         */
        samples: number;
        /**
         * The duration of single loop.
         */
        duration: number;
        /**
         * Whether action is loop.
         */
        loop: boolean;
        /**
         * When action finished, this event is triggered.
         */
        onFinished: Signal;
        /**
         * When a single loop is finished, this event is triggered.
         */
        onLoopFinished: Signal;
        
        /**
         * Set specific data for specific property of action. The method generally is used to set from and to value of property whose curveType is TweenAbsolute or TweenRelative.
         * @params path: The path of hierarchy. The targetObject's path is '/'. If targetObject has a child named 'childSprite', then childSprite's path is '/childSprite'
         * @params propertyId: Constant define of action property.
         * @params attrib: The detail attrib of propertyId.
         * @params data: The data for Action's property
         */
        setData(path: string, propertyId: number, attrib: string, data: Object): void;
    }
    
    /**
     * ActionManager
     */
    export class Animator extends Behaviour {
        /**
         * All actions information.
         */
        animators: Object;
        
        /**
         * Get the action information
         * @params nameOrIndex: action's name or index.
         */
        getAction(nameOrIndex: string|number): any;
        /**
         * Play the action
         * @params nameOrIndex: action's name or index.
         * @params targetObject: the Node to play
         * @params fromBegin: play from beginning?
         */
        play(nameOrIndex: string|number, targetObject?: Node, fromBegin?: boolean): void;
        /**
         * Stop playing the action
         * @params nameOrIndex: action's name or index.
         */
        stop(nameOrIndex: string|number): void;
    }
    
    /**
     * Action Property
     */
    export var PROP_POSITION: number;
    export var PROP_ROTATION: number;
    export var PROP_ALPHA: number;
    export var PROP_SCALE: number;
    export var PROP_COLOR_TINT: number;
    export var PROP_VISIBLE: number;
    export var PROP_SIZE: number;
    export var PROP_SKEW: number;
    export var PROP_TEXTURE: number;
    export var PROP_ANIMATION: number;
    export var PROP_COLOR: number;
    export var PROP_TEXT: number;
    export var PROP_PIVOT: number;
    export var PROP_ANCHORED_POSITION: number;
    export var PROP_TOGGLE_ON: number;
    export var PROP_SCROLLBAR_VALUE: number;
    export var PROP_SCROLLVIEW_POSITION: number;
    export var PROP_PROGRESSBAR_VALUE: number;
    export var PROP_SLIDER_VALUE: number;
    export var PROP_SOUND: number;
    export var PROP_DOM_INNERHTML: number;
    export var PROP_TILEMAP_POSITION: number;
}
