/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 显示Game模型层次关系树类
 * @param game qc.Game对象
 * @param dataModel qc.widget.DataModel对象
 */
var GameTree = qc.widget.Default.define(null, qc.widget.Tree,
    function (game, dataModel) {
        GameTree.super.constructor.call(this, dataModel);
        this._game = game;

        // 从world根节点开始遍历添加树节点
        this.addNode(this.world);

        // 监听孩子变化事件更新树节点
        this.world.onModelChange.add(this.handleModelChange, this);

        // 添加顶层绘制画笔，用于绘制拖拽时状态提示
        this.addTopPainter(this.drawDNDState);
    },
    {
        // 自定义树节点文字颜色，对于骨骼类型显示淡灰色
        getLabelColor: function (data) {
            return data.node._bone ? '#A0A0A0' : 'black';
        },
        handleModelChange: function (event) {
            var type = event.type,
                target = event.target,
                parent = target.parent,
                dataModel = this.dataModel,
                data = dataModel.getDataById(target.uuid);

            // 节点名称变化
            if (type === 'name') {
                this.iv();
            }
            // 节点被销毁
            else if (type === 'destroy') {
                // 如果是world，只清除其孩子
                if (target === this.world) {
                    data.children.slice().forEach(function (child) {
                        dataModel.remove(child);
                    });
                }
                else {
                    dataModel.remove(data);
                }
            }
            // 删除所有孩子节点
            else if (type === 'removeChildren') {
                data.children.slice().forEach(function (child) {
                    dataModel.remove(child);
                });
            }
            // 节点父子关系变化
            else if (type === 'parent') {
                // 存在父亲节点
                if (parent) {
                    // child以前存在模型中，更新所在父亲节点位置
                    if (data) {
                        var parentData = dataModel.getDataById(parent.uuid);
                        // 如果父亲不一样，更新父亲节点
                        if (data.parent !== parentData) {
                            data.parent = parentData;
                        }
                        // 确保节点所在的孩子数组中的顺序
                        dataModel.moveTo(data, parent.getChildIndex(target));
                    }
                    // child以前不存在模型中，添加如模型，包括子孙节点
                    else {
                        this.addNode(target);
                    }
                }
                // 不存在父亲节点
                else {
                    // 从模型删除，child肯定以前在模型中，因此不做空检测
                    dataModel.remove(data);
                }
            }
        },
        // 构建node模型，包括其子孙
        addNode: function (node) {
            var data = new GameData(node);

            // 父亲节点设置，注意最顶层为qc.Stage，该节点不是qc.Node类型
            var parent = node.parent;
            if (parent instanceof qc.Node) {
                // 所在父节点孩子的索引位置
                var index = parent.getChildIndex(node);
                // 插入到父节点的孩子索引位置
                this.dataModel.getDataById(parent.uuid).addChild(data, index);
            }

            // 将data对象添加到dataModel，注意qc.widget.DataModel模型的节点除了设置父子关系外，
            // 还必须都加入到dataModel中，这点与Phaser的模型有差异
            this.dataModel.add(data);

            // 递归填充孩子节点
            node.children.forEach(this.addNode, this);
        },
        // 绘制拖拽时状态提示
        drawDNDState: function (g) {
            if (this.dragInfo) {
                var width = this.clientWidth,
                    rowHeight = this.rowHeight,
                    rowIndex = this.dragInfo.rowIndex,
                    type = this.dragInfo.type;

                g.beginPath();
                g.rect(0, rowIndex * rowHeight, width, rowHeight);
                g.fillStyle = 'rgba(0, 0, 0, 0.15)';
                g.fill();

                if (type === 'up') {
                    g.beginPath();
                    g.moveTo(0, rowIndex * rowHeight);
                    g.lineTo(width, rowIndex * rowHeight);
                    g.strokeStyle = 'red';
                    g.lineWidth = 2;
                    g.stroke();
                }
                else if (type === 'down') {
                    g.beginPath();
                    g.moveTo(0, (rowIndex + 1) * rowHeight);
                    g.lineTo(width, (rowIndex + 1) * rowHeight);
                    g.strokeStyle = 'red';
                    g.lineWidth = 2;
                    g.stroke();
                }
                else {
                    g.beginPath();
                    g.rect(1, rowIndex * rowHeight, width - 2, rowHeight);
                    g.strokeStyle = '#3498DB';
                    g.lineWidth = 2;
                    g.stroke();
                }
            }
        },
        handleDragAndDrop: function (e, state) {
            // 准备拖拽和取消拖拽处理
            if (state === 'prepare' || state === 'cancel') {
                if (this.dragInfo) {
                    this.dragInfo = null;
                    this.iv();
                }
            }
            // 开始拖拽和拖拽过程处理
            else if (state === 'begin' || state === 'between') {
                if (state === 'begin') {
                    var data = this.getDataAt(e);
                    if (data) {
                        if (!this.isSelected(data)) {
                            this.selectionModel.selection = data;
                        }
                        this.dragInfo = {};
                    }
                }
                var dragInfo = this.dragInfo;
                if (dragInfo) {
                    var rowHeight = this.rowHeight,
                        point = this.lp(e),
                        row = point.y / rowHeight,
                        rowIndex = Math.floor(row);

                    if (rowIndex > this.rowDatas.length - 1) {
                        dragInfo.rowIndex = this.rowDatas.length - 1;
                        dragInfo.type = 'down'; // 插入到下方
                    } else {
                        dragInfo.rowIndex = rowIndex;
                        var mod = point.y - rowIndex * rowHeight;
                        if (mod < rowHeight * 0.3) {
                            dragInfo.type = 'up'; // 插入到上方
                        }
                        else if (mod > rowHeight * 0.7) {
                            dragInfo.type = 'down'; // 插入到下方
                        }
                        else {
                            dragInfo.type = 'parent'; // 插入作为孩子
                        }
                    }
                    this.autoScroll(e);
                    this.iv();
                }
            }
            else if (state === 'end') {
                var dragInfo = this.dragInfo;
                if (dragInfo) {
                    var rowIndex = dragInfo.rowIndex,
                        type = dragInfo.type,
                        targetData = this.rowDatas[rowIndex],
                        targetNode = targetData.node;

                    // 遍历所有顶层节点进行操作
                    this.topSelection.forEach(function (data) {
                        var node = data.node;

                        // 不对world和dragRoot节点进行操作
                        if (node === this.game.world || node._dragRoot) {
                            return;
                        }

                        // 插入作为孩子
                        if (type === 'parent') {
                            try {
                                node.switchParent(targetNode);
                            }
                            catch(ex) {
                                // 设置不合法的父子关系会出异常
                                console.log(ex);
                            }
                        }
                        // 进行down和up的插入操作，不能插入到world平级
                        else if (targetNode !== this.game.world) {
                            var targetParentNode = targetData.parent.node;
                            try {
                                if (node.parent !== targetParentNode) {
                                    node.switchParent(targetParentNode);
                                }
                                var newIndex = targetParentNode.getChildIndex(targetNode);
                                var oldIndex = targetParentNode.getChildIndex(node);
                                // 插入到下方对目标索引+1
                                if (type === 'down') {
                                    newIndex++;
                                }
                                // 如果原始索引小于目标索引，则对目标索引--，
                                // 因为setChildIndex先删除oldIndex，导致newIndex往前移动
                                if (oldIndex < newIndex) {
                                    newIndex--;
                                }
                                // 设置目标索引
                                targetParentNode.setChildIndex(node, newIndex);
                            }
                            catch(ex) {
                                // 设置不合法的父子关系会出异常
                                console.log(ex);
                            }
                        }
                    }, this);

                    this.dragInfo = null;
                    this.iv();
                }
            }
        }
    },
    {},
    {
        game: {
            get: function () {
                return this._game;
            }
        },
        world: {
            get: function () {
                return this.game.world;
            }
        },
        // 获取顶层选中节点
        topSelection: {
            get: function () {
                var selection = this.dataModel.selectionModel.topSelection,
                    map = {},
                    list = [];
                // 构建层次结构顶层选中元素的uuid映射
                selection.forEach(function (data) {
                    map[data.uuid] = data;
                });
                // 通过rowDatas遍历确保顶层选中图元的顺序
                this.rowDatas.forEach(function (data) {
                    if (map[data.uuid]) {
                        list.push(data);
                    }
                });
                return list;
            }
        }
    }
);
