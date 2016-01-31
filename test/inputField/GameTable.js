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
                        name : 'font',
                        editable : true
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
                        name : 'lineType',
                        editable : true,
                        valueType : 'number'
                    },
                    {
                        name : 'width',
                        editable : true,
                        valueType : 'number'
                    },
                    {
                        name : 'height',
                        editable : true,
                        valueType : 'number'
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
