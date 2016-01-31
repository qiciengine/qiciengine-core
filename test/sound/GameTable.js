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
                        name: 'loop',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name: 'volume',
                        editable: true,
                        editor: new qc.widget.editor.SliderEditor({
                            min: 0,
                            max: 1,
                            step: 0.1
                        })
                    },
                    {
                        name: 'mute',
                        editable: true,
                        valueType: 'boolean'
                    },
                    {
                        name: 'playOnAwake',
                        editable: true,
                        valueType: 'boolean'
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
