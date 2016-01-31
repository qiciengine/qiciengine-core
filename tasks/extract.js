/**
 * @author lijh
 * @copyright 2015 Qcplay All Rights Reserved.
 *
 * 从api文档中提取组件的属性及其描述信息，用于inspector面板中的悬浮显示
 */

module.exports = function (grunt) {
    grunt.registerTask('extract', 'Extract tips from api documents', function () {
        // 需要提取的文档列表
        var files = [
            'gameobject/CNode.md',
            'gameobject/CUIImage.md',
            'gameobject/CSprite.md',
            'gameobject/CUIText.md',
            'gameobject/CButton.md',
            'gameobject/CToggle.md',
            'gameobject/CScrollBar.md',
            'gameobject/CScrollView.md',
            'gameobject/CProgressBar.md',
            'gameobject/CSlider.md',
            'gameobject/CInputField.md',
            'gameobject/CSound.md',
            'gameobject/CDom.md',
            'gameobject/CUIRoot.md',
            'gameobject/CTilemap.md',
            'components/TransitionBehaviour.md',
            'components/ScaleAdapter.md',
            'components/ToggleGroup.md',
            'components/NodeMask.md',
            'components/Bounds.md',
            'components/TableLayout.md',
            'components/HorizontalLayout.md',
            'components/VerticalLayout.md',
            'components/LayoutElement.md',
            'components/AspectRatioFitter.md',
            'components/FilterGroup.md',
            'components/CacheAsBitmap.md',
            'components/Tween.md',
            'components/TweenPosition.md',
            'components/TweenRotation.md',
            'components/TweenAlpha.md',
            'components/TweenScale.md',
            'components/TweenColor.md',
            'components/TweenProperty.md',
            'components/DebugView.md',
            'officialplugins/particleSystem/CParticleSystem.md'
        ];

        var parseMdFile = function(path, language, ret) {
            var pureFileName = /.*\/(\w*)\.md/.exec(path)[1];

            var fullPath;
            if (language === 'zh')
                fullPath = '../qiciengine-documentation/zh/api/' + path;
            else
                fullPath = '../qiciengine-documentation/en/api/' + path;

            // 提取文档中定义的属性及其描述信息，以 ’| from | number | From alpha, 0-1 |'为例，
            // 将提取出 'from' 和 'From alpha, 0-1'
            var content = grunt.file.read(fullPath);
            var patten = /\| *\[?(\w*)\]?\(?.*\)? *\|.*\| *(.*) *\|/g;
            var match;
            while ((match = patten.exec(content)) !== null)
            {
                if (match[1].length === 0)
                    continue;

                var key = pureFileName + '.' + match[1];
                if (ret[key] === undefined)
                    ret[key] = {};

                // 过滤文本中的引用部分
                // 过滤前：'Layout constraint, see [Constant](#_4)'
                // 过滤后：'Layout constraint’
                var value = match[2].replace(/[,.，。][^,.，。]*\[.*\]\([#\w]+\).*/, '');

                // 过滤文本中的'__'
                value = value.replace(/__/g, '');

                // 将形如 [UIImage.imageType](image_imageType.md) 的文本替换为 UIImage.imageType
                value = value.replace(/\[([\w\.]+)\]\(.+\)/, "$1");

                ret[key][language] = value;
            }
        };

        var ret = {};
        files.forEach(function(path) {
            parseMdFile(path, 'zh', ret);
            parseMdFile(path, 'en', ret);
        });

        var s = 'qc.editor.InspectorTips = ' + JSON.stringify(ret, null, 4) + ';';
        grunt.file.write('build/InspectorTips.js', s);
    });
};
