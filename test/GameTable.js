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
                        name: 'interactive',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name: 'draggable',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name: 'colorTint',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'visible',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name: 'alpha',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'x',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'y',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'width',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'height',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'rotation',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'scaleX',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'scaleY',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'anchorX',
                        editable: true,
                        valueType: 'number'
                    },
                    {
                        name: 'anchorY',
                        editable: true,
                        valueType: 'number'
                    },
                ]);
            }
        }
    },
    {

    },
    {

    }
);
