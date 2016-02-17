/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 *  action 系统相关定义
 */

// 曲线数值类型
qc.CURVE_TYPE_RELATIVE = 1;
qc.CURVE_TYPE_ABSOLUTE = 2;
qc.CURVE_TYPE_TWEEN_RELATIVE = 3;
qc.CURVE_TYPE_TWEEN_ABSOLUTE = 4;

// 属性宏定义
qc.PROP_POSITON = 1;
qc.PROP_ROTATION = 2;
qc.PROP_ALPHA = 3;
qc.PROP_SCALE = 4;
qc.PROP_COLOR_TINT = 5;
qc.PROP_VISIBLE = 6;
qc.PROP_SIZE = 7;
qc.PROP_SKEW = 8;
qc.PROP_TEXTURE = 9;
qc.PROP_ANIMATION = 10;
qc.PROP_COLOR = 11;
qc.PROP_TEXT = 12;
qc.PROP_PIVOT = 13;
qc.PROP_ANCHORED_POSITION = 14;
qc.PROP_TOGGLE_ON = 15;
qc.PROP_SCROLLBAR_VALUE = 16;
qc.PROP_SCROLLVIEW_POSITION = 17;
qc.PROP_PROGRESSBAR_VALUE = 18;
qc.PROP_SLIDER_VALUE = 19;
qc.PROP_SOUND = 20;
qc.PROP_DOM_INNERHTML = 21;
qc.PROP_TILEMAP_POSITION = 22;

qc.ActionProperties = {};
qc.ActionProperties[qc.PROP_POSITON] = {
        name: 'Position',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'x',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'y',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_ANCHORED_POSITION] = {
        name: 'AnchoredPosition',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'anchoredX',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'anchoredY',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_ROTATION] = {
        name: 'Rotation',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'rotation',
                type: 'angle',
            },
        ],
};
qc.ActionProperties[qc.PROP_ALPHA] = {
        name: 'Alpha',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'alpha',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_SCALE] = {
        name: 'Scale',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'scaleX',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'scaleY',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_COLOR_TINT] = {
        name: 'ColorTint',
        class: 'qc.ColorLinearProp',
        properties: [
            {
                attrib: 'colorTint',
                type: Serializer.COLOR,
                default: qc.Color.white,
            },
        ],
};
qc.ActionProperties[qc.PROP_VISIBLE] = {
        name: 'Visible',
        class: 'qc.KeyProp',
        forceUpdate: true,
        properties: [
            {
                attrib: 'visible',
                type: Serializer.BOOLEAN,
                default: true,
            },
        ],
};
qc.ActionProperties[qc.PROP_SIZE] = {
        name: 'Size',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'width',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'height',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_PIVOT] = {
        name: 'Pivot',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'pivotX',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'pivotY',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_SKEW] = {
        name: 'Skew',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'skewX',
                type: 'angle',
            },
            {
                attrib: 'skewY',
                type: 'angle',
            },
        ],
};
qc.ActionProperties[qc.PROP_TEXTURE] = {
        name: 'Texture',
        class: 'qc.TextureKeyProp',
        forceUpdate: true,
        properties: [
            {
                attrib: 'texture',
                type: Serializer.TEXTURE,
            },
        ],
};
qc.ActionProperties[qc.PROP_ANIMATION] = {
        name: 'Animation',
        class: 'qc.KeyProp',
        properties: [
            {
                attrib: 'defaultAnimation',
                type: Serializer.STRING,
            },
        ],
};
qc.ActionProperties[qc.PROP_COLOR] = {
        name: 'Color',
        class: 'qc.ColorLinearProp',
        properties: [
            {
                attrib: 'color',
                type: Serializer.COLOR,
                default: qc.Color.white,
            },
        ],
};
qc.ActionProperties[qc.PROP_TEXT] = {
        name: 'Text',
        class: 'qc.KeyProp',
        forceUpdate: true,
        properties: [
            {
                attrib: 'text',
                type: Serializer.STRING,
                default: '',
            },
        ],
};
qc.ActionProperties[qc.PROP_TOGGLE_ON] = {
        name: 'ToggleOn',
        class: 'qc.KeyProp',
        forceUpdate: true,
        properties: [
            {
                attrib: 'on',
                type: Serializer.BOOLEAN,
                default: true,
            },
        ],
};
qc.ActionProperties[qc.PROP_SCROLLBAR_VALUE] = {
        name: 'ScrollBarValue',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'value',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_SCROLLVIEW_POSITION] = {
        name: 'ScrollViewPosition',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'horizontalNormalizedPosition',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'verticalNormalizedPosition',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_PROGRESSBAR_VALUE] = {
        name: 'ProgressBarValue',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'value',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_SLIDER_VALUE] = {
        name: 'SliderValue',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'value',
                type: Serializer.NUMBER,
            },
        ],
};
qc.ActionProperties[qc.PROP_SOUND] = {
        name: 'Sound',
        class: 'qc.KeyProp',
        properties: [
            {
                attrib: 'audio',
                type: Serializer.AUDIO,
            },
            {
                attrib: 'isPlaying',
                type: Serializer.BOOLEAN,
                default: true,
            },
        ],
};
qc.ActionProperties[qc.PROP_DOM_INNERHTML] = {
        name: 'DomInnerHTML',
        class: 'qc.KeyProp',
        forceUpdate: true,
        properties: [
            {
                attrib: 'innerHTML',
                type: Serializer.STRING,
                default: '',
            },
        ],
};
qc.ActionProperties[qc.PROP_TILEMAP_POSITION] = {
        name: 'TilemapPosition',
        class: 'qc.CurveProp',
        curve: true,
        properties: [
            {
                attrib: 'scrollX',
                type: Serializer.NUMBER,
            },
            {
                attrib: 'scrollY',
                type: Serializer.NUMBER,
            },
        ],
};

// transition to action 的触发条件
qc.FinishTrigger = 1;
qc.EventTrigger = 2;

qc.propertyList = {
    'qc.Node' : [qc.PROP_POSITON, qc.PROP_ANCHORED_POSITION, qc.PROP_ROTATION, qc.PROP_ALPHA, qc.PROP_SCALE, qc.PROP_COLOR_TINT, qc.PROP_VISIBLE, qc.PROP_SIZE, qc.PROP_PIVOT],
    'qc.UIImage' : [qc.PROP_SKEW, qc.PROP_TEXTURE],
    'qc.Sprite' : [qc.PROP_TEXTURE, qc.PROP_ANIMATION],
    'qc.UIText' : [qc.PROP_COLOR, qc.PROP_TEXT],
    'qc.Button' : [qc.PROP_TEXTURE],
    'qc.Toggle' : [qc.PROP_TOGGLE_ON],
    'qc.ScrollBar' : [qc.PROP_TEXTURE, qc.PROP_SCROLLBAR_VALUE],
    'qc.ScrollView' : [qc.PROP_TEXTURE, qc.PROP_SCROLLVIEW_POSITION],
    'qc.ProgressBar' : [qc.PROP_TEXTURE, qc.PROP_PROGRESSBAR_VALUE],
    'qc.Slider' : [qc.PROP_TEXTURE, qc.PROP_SLIDER_VALUE],
    'qc.InputField' : [qc.PROP_TEXTURE, qc.PROP_TEXT],
    'qc.Sound' : [qc.PROP_SOUND],
    'qc.Dom' : [qc.PROP_DOM_INNERHTML],
    'qc.Graphics' : [],
    'qc.UIRoot' : [],
    'qc.Tilemap' : [qc.PROP_TILEMAP_POSITION],
}
