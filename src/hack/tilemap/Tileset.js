/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * https://github.com/bjorn/tiled/issues/925
 * but I did it this way so that margin could be used as purely a starting offset.
 * Just that now the name is a little confusing..
 *
 * Tiled编辑器（http://www.mapeditor.org/）的margin仅代表左上角的偏移，
 * Phaser解析为常规理解的上下左右都预留空间，以下函数做修正保持和Tiled编辑器一致
 */
Phaser.Tileset.prototype.updateTileData = function (imageWidth, imageHeight) {
    imageWidth -= this.tileMargin;
    imageHeight -= this.tileMargin;

    // May be fractional values
    var rowCount;
    var colCount;
    if (imageHeight > this.tileHeight) {
        rowCount = (imageHeight - this.tileHeight) / (this.tileHeight + this.tileSpacing) + 1;
    } else {
        rowCount = imageHeight / this.tileHeight;
    }
    if (imageWidth > this.tileWidth) {
        colCount = (imageWidth - this.tileWidth) / (this.tileWidth + this.tileSpacing) + 1;
    } else {
        colCount = imageWidth / this.tileWidth;
    }

    if (rowCount % 1 !== 0 || colCount % 1 !== 0)
    {
//   console.warn("Phaser.Tileset - image tile area is not an even multiple of tile size", rowCount, colCount);
    }

    // In Tiled a tileset image that is not an even multiple of the tile dimensions
    // is truncated - hence the floor when calculating the rows/columns.
    rowCount = Math.floor(rowCount);
    colCount = Math.floor(colCount);

    if ((this.rows && this.rows !== rowCount) || (this.columns && this.columns !== colCount))
    {
        console.warn("Phaser.Tileset - actual and expected number of tile rows and columns differ");
    }

    this.rows = rowCount;
    this.columns = colCount;
    this.total = rowCount * colCount;

    this.drawCoords.length = 0;

    var tx = this.tileMargin;
    var ty = this.tileMargin;

    for (var y = 0; y < this.rows; y++)
    {
        for (var x = 0; x < this.columns; x++)
        {
            this.drawCoords.push(tx);
            this.drawCoords.push(ty);
            tx += this.tileWidth + this.tileSpacing;
        }

        tx = this.tileMargin;
        ty += this.tileHeight + this.tileSpacing;
    }

};