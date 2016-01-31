/**
 * 属性表格封装，用于测试因此仅列举基本属性
 */
var GameTable = qc.widget.Default.define(null, qc.widget.PropertyTable,
    function(dataModel){
        GameTable.super.constructor.call(this, dataModel);
        this._lastData = null;
        this.selectionModel.on('selectionChange', this.updateProperties, this);
    },
    {
        updateProperties: function(){
            if(this._lastData === this.currentData){
                return;
            }
            this._lastData = this.currentData;
            if(!this.currentData){
                this.setProperties([
                    {
                        name: 'uuid'
                    },
                    {
                        name: 'name',
                        editable: true
                    },
                    {
                        name: 'text',
                        editable: true
                    },
                    {
                        name : 'dynamicFont',
                        editable : true,
                        valueType : 'boolean'
                    },
                    {
                        name : 'fontSize',
                        editable : true,
                        valueType : 'int'
                    },
                    {
                        name : 'bold',
                        editable : true,
                        valueType : 'boolean'
                    },
                    {
                        name : 'color',
                        renderer: new qc.widget.renderer.ColorRenderer({labelVisible: false}),
                        width: 120,
                        editable: true,
                        editor: new qc.widget.editor.ColorEditor()
                    },
                    {
                        name : 'gradient',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name : 'startColor',
                        renderer : new qc.widget.renderer.ColorRenderer({labelVisible: false}),
                        width : 120,
                        editable : true,
                        editor : new qc.widget.editor.ColorEditor()
                    },
                    {
                        name: 'endColor',
                        renderer: new qc.widget.renderer.ColorRenderer({labelVisible: false}),
                        width: 120,
                        editable: true,
                        editor: new qc.widget.editor.ColorEditor()
                    },
                    {
                        name: 'wrap',
                        editable : true,
                        valueType : 'boolean'
                    },
                    {
                        name : 'stroke',
                        renderer: new qc.widget.renderer.ColorRenderer({labelVisible: false}),
                        width: 120,
                        editable: true,
                        editor: new qc.widget.editor.ColorEditor()
                    },
                    {
                        name : 'strokeThickness',
                        editable : true,
                        valueType : 'int'
                    },
                    {
                        name : 'enableGlow',
                        editable : true,
                        valueType : 'boolean'
                    },
                    {
                        name : 'glowColor',
                        renderer: new qc.widget.renderer.ColorRenderer({labelVisible: false}),
                        width: 120,
                        editable: true,
                        editor: new qc.widget.editor.ColorEditor()
                    },
                    {
                        name : 'width',
                        editable : true,
                        valueType : 'number'
                    },
                    {
                        name : 'multiAlign',
                        editable : true,
                        valueType : 'number'
                    },
                    {
                        name : 'autoSize',
                        editable : true,
                        valueType : 'boolean'
                    },
                    {
                        name : 'overflow',
                        editable : true,
                        valueType : 'boolean'
                    }
                ]);
            }
        }
    },
    {

    },
    {

    }
);
