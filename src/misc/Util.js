/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 工具库
 */
qc.Util = {

    /**
     * 根据类的名字查找类对象
     * @param name
     */
    findClass : function(name) {
        var arr = name.split('.');
        var curr = window;
        for (var i = 0; i < arr.length - 1; i++) {
            if (!curr[arr[i]])
                // 没有找到
                return;
            curr = curr[arr[i]];
        }

        return curr[arr[arr.length - 1]];
    },

    /**
     * 浅克隆一个object
     */
    clone : function(target) {
        if (null === target || "object" !== typeof target) return target;
        var obj = new target.constructor();
        for (var attr in target) {
            // 为这个对象添加新的属性
            if (target.hasOwnProperty(attr))
                obj[attr] = target[attr];
        }
        return obj;
    },

    /**
     * 判断是否是一个Array
     */
    isArray : Array.isArray || function(a) { return toString.call(a) === '[object Array]'; },

    /**
     * 删除html元素
     * @param html
     */
    removeHTML: (function() {
        var removingHTML;
        return function(html) {
            if (html && html.parentNode) {
                if (removingHTML === html) {
                    return;
                }
                removingHTML = html;
                html.parentNode.removeChild(html);
                removingHTML = null;
            }
        };
    })(),

    /**
     * 将node元素的Transform更新到html元素上
     * @param node 需要拷贝其Transform信息的节点
     * @param html 需要设置其Transform信息的html元素
     */
    updateTransform: function(node, html){
        var game = node.game;        
        var scaleFactor = game.phaser.scale.scaleFactorInversed;
        var style = html.style;
        var rect = node.rect;
        var worldTransform = node.worldTransform;
        var transformOrigin = (-rect.x).toFixed(5) + 'px ' + (-rect.y).toFixed(5) + 'px';
        var transform = 'matrix(' +
                        (worldTransform.a * scaleFactor.x).toFixed(5) + ',' +
                        (worldTransform.b * scaleFactor.x).toFixed(5) + ',' +
                        (worldTransform.c * scaleFactor.y).toFixed(5) + ',' +
                        (worldTransform.d * scaleFactor.y).toFixed(5) + ',' +
                        (worldTransform.tx * scaleFactor.x).toFixed(0) + ',' +
                        (worldTransform.ty * scaleFactor.y).toFixed(0) +
                        ')';

        style.left = (rect.x).toFixed(5) + 'px';
        style.top = (rect.y).toFixed(5) + 'px';
        style.width = (rect.width).toFixed(5) + 'px';
        style.height = (rect.height).toFixed(5) + 'px';

        style.webkitTransform = transform;
        style.mozTransform = transform;
        style.msTransform = transform;
        style.oTransform = transform;
        style.transform = transform;

        style.webkitTransformOrigin = transformOrigin;
        style.mozTransformOrigin = transformOrigin;
        style.msTransformOrigin = transformOrigin;
        style.oTransformOrigin = transformOrigin;
        style.transformOrigin = transformOrigin;
    },

    /**
     * 格式化字符串
     * 使用方式形如：qc.Util.formatString('hello {0}', 'world')
     */
     formatString : function(format) {
        var args = arguments;

        if (args.length <= 1)
            return qc.Util.formatValue(format).replace(/^\'|\'$/g, '');

        return format.replace(/\{(\d+)\}/g,
            function(m, i) {
                return qc.Util.formatValue(args[parseInt(i) + 1]).replace(/^\'|\'$/g, '');
            }
        );
     },

    // 报错弹出提示
    popupError : function(errorMessage) {
        if (window.parent && window.parent.G && window.parent.G.notification)
        {
            var G = window.parent.G;
            // 在编辑器中
            var str = qc.Util.formatString(G._('Exception notification'), errorMessage);
            G.notification.error(str)
        }
        else
        {
            var str = 'Error: ' + errorMessage;
            if (typeof(qici) !== 'undefined' && qici.config)
            {
                var gameInstance = qici.config.gameInstance;
                var game = window[gameInstance];
                if (game)
                {
                    game.log.error(str);

                    if (game.debug.on)
                        // 开发模式，弹出提示框
                        alert(str);
                }
            }
            else
                console.trace(str);
        }
    },

    // 格式化变量
    formatValue : function(value, depth, context) {
        if (typeof(depth) !== 'number')
            depth = 0;
        context = context || [];

        var formatPrimitive = function (value) {
            if (value === undefined)
                return 'undefined';
            if (value === null)
                return 'null';
            var type = typeof value;
            var objectType = Object.prototype.toString.call(value);
            if (type === 'string') {
                var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                            .replace(/'/g, "\\'")
                            .replace(/\\"/g, '"') + '\'';
                return simple;
            }
            if (type === 'number') {
                if (value === 0 && 1 / value < 0)
                    return '-0';
                return '' + value;
            }
            if (type === 'boolean')
                return '' + value;
            if (type === 'symbol')
                return value.toString();
            if (type === 'function') {
                var name = value.name ? ':' + value.name : '';
                return '[Function' + name + ']';
            }
            if (objectType === '[object RegExp]')
                return '[RegExp: ' + RegExp.prototype.toString.call(value) + ']';
            if (objectType === '[object Error]')
                return '[Error: ' + value.message + ']';
            if (objectType === '[object Date]')
                return '[Date: ' + Date.prototype.toString.call(value) + ']';
        }
        var primitive = formatPrimitive(value);
        if (primitive) {
            return primitive;
        }

        var keys = Object.keys(value);
        if (keys.length === 0)
        {
            var raw = value;
             try {
                raw = value.valueOf();
             } catch (e) {
             }

            primitive = formatPrimitive(raw);
            if (primitive) {
                return primitive;
            }
        }

        var formatArray = function(value, recurseTimes, keys, ctx) {
            var output = [];
            for (var i = 0, l = value.length; i < l; ++i) {
                if (Object.prototype.hasOwnProperty.call(value, String(i))) {
                    output.push(formatProperty(ctx, value, recurseTimes, String(i), true));
                } else {
                    output.push('');
                }
            }
            keys.forEach(function(key) {
                if (typeof key === 'symbol' || !key.match(/^\d+$/)) {
                    output.push(formatProperty(ctx, value, recurseTimes, key, true));
                }
            });
            return output;
        }

        var formatObject = function (value, recurseTimes, keys, ctx) {
            return keys.map(function(key) {
                return formatProperty(ctx, value, recurseTimes, key, false);
            });
        }

        var braces, formatter;
        if (Array.isArray(value)) {
            braces = ['[', ']'];
            formatter = formatArray;
        }
        else {
            braces = ['{', '}'];
            formatter = formatObject;
        }

        if (keys.length === 0) {
            return braces[0] + '' + braces[1];
        }

        var formatProperty = function(ctx, value, recurseTimes, key, array) {
            var name, str, desc;
            desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
            if (desc.get) {
                if (desc.set) {
                    str = '[Getter/Setter]';
                } else {
                    str = '[Getter]';
                }
            } else {
                if (desc.set) {
                    str = '[Setter]';
                }
            }
            if (!str) {
                if (ctx.indexOf(desc.value) < 0) {
                    if (recurseTimes === null) {
                        str = qc.Util.formatValue(desc.value, null, ctx);
                    } else {
                        str = qc.Util.formatValue(desc.value, recurseTimes - 1, ctx);
                    }
                    if (str.indexOf('\n') > -1) {
                        if (array) {
                            str = str.split('\n').map(function(line) {
                                return '  ' + line;
                            }).join('\n').substr(2);
                        } else {
                            str = '\n' + str.split('\n').map(function(line) {
                                return '   ' + line;
                            }).join('\n');
                        }
                    }
                } else {
                    str = '[Circular]';
                }
            }
            if (array && key.match(/^\d+$/)) {
                return str;
            }
            name = JSON.stringify('' + key);
            if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                name = name.substr(1, name.length - 2);
            } else {
                name = name.replace(/'/g, "\\'")
                        .replace(/\\"/g, '"')
                        .replace(/(^"|"$)/g, "'")
                        .replace(/\\\\/g, '\\');
            }

            return name + ': ' + str;
        }

        if (depth < 0)
        {
            var str = 'Object';
            if (Array.isArray(value))
                str = 'Array';
            else
            {
                if (value.class && typeof(value.class) === 'string')
                    str = value.class;
                if (value.name && typeof(value.class) === 'string')
                    str = str + '(' + value.name + ')';
            }
            return '[' + str + ']';
        }

        context.push(value);
        var output = formatter(value, depth, keys, context);
        context.pop();

        var reduceToSingleString = function(output, braces) {
            var length = output.reduce(function(prev, cur) {
                return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
            }, 0);

            if (length > 60) {
                return braces[0] +
                   (braces[0].length === 1 ? '' : '\n ') +
                   ' ' +
                   output.join(',\n  ') +
                   ' ' +
                   braces[1];
            }

            return braces[0] + ' ' + output.join(', ') + ' ' + braces[1];
        }

        return reduceToSingleString(output, braces);
    },

    // 插入有序列表
    insertSortedList : function(sortedList, value, lessFunc, notDelete) {
        var _searchInsertIndex = function(array, value, less) {
            var low = 0;
            var high = array.length - 1;
            if (high < 0) {
                return -1;
            }
            var middle = 0;
            while (low < high) {
                middle = Math.floor((low + high) / 2);
                less(array[middle], value) ? (low = middle + 1) : (high = middle);
            }
            return less(array[low], value) ? -1 : low;
        };

        var insertIdx = _searchInsertIndex(sortedList, value, lessFunc);
        var idx;
        if (notDelete)
        {
            idx = insertIdx < 0 ? (sortedList.push(value) - 1) : (
                sortedList.splice(insertIdx, 0, value) && insertIdx
            );
        }
        else
        {
            idx = insertIdx < 0 ? (sortedList.push(value) - 1) : (
                sortedList.splice(insertIdx, lessFunc(value, sortedList[insertIdx]) ? 0 : 1, value) && insertIdx
            );
        }

        return idx;
    },
};

// 关注未捕获的报错，弹出提示
window.onerror = function( errorMessage, scriptURI, lineNumber, columnNumber, error)
{
    qc.Util.popupError(errorMessage);
}
