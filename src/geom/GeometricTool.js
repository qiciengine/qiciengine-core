/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 图形处理工具
 */
var GeometricTool = qc.GeometricTool = {};

/**
 * 将多边形的顶点信息放入一个数组
 * @param points
 * @returns {Array}
 */
GeometricTool.flattenPolygon = function (points) {
    var flatten =  new Array(points.length * 2);
    var len = points.length;
    while (len--) {
        flatten[2 * len] = points[len].x;
        flatten[2 * len + 1] = points[len].y;
    }
    return flatten;
};

/**
 * 判定点是否在多边形内
 * @param points
 * @param x
 * @param y
 * @returns {boolean}
 */
GeometricTool.polygonContains = function(points, x, y) {
    //  Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html by Jonas Raoni Soares Silva
    if (isNaN(points[0])) {
        var length = points.length;
        var inside = false;
        for (var i = -1, j = length - 1; ++i < length; j = i) {
            var ix = points[i].x;
            var iy = points[i].y;
            var jx = points[j].x;
            var jy = points[j].y;

            if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
            {
                inside = !inside;
            }
        }
        return inside;
    }
    else {
        var length = points.length / 2;
        var inside = false;
        for (var i = -1, j = length - 1; ++i < length; j = i) {
            var ix = points[2 * i];
            var iy = points[2 * i + 1];
            var jx = points[2 * j];
            var jy = points[2 * j + 1];

            if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
            {
                inside = !inside;
            }
        }
        return inside;
    }
};

/**
 * 点在线上的判定
 * @param a
 * @param b
 * @param x
 * @param y
 * @returns {boolean}
 */
GeometricTool.pointOnLine = function (a, b, x, y) {
    return ((x - a.x) * (b.y - a.y) === (b.x - a.x) * (y - a.y));
};

/**
 * 点在线段上的判定
 * @param a
 * @param b
 * @param x
 * @param y
 * @returns {boolean}
 */
GeometricTool.pointOnSegment = function (a, b, x, y) {

    var xMin = Math.min(a.x, b.x);
    var xMax = Math.max(a.x, b.x);
    var yMin = Math.min(a.y, b.y);
    var yMax = Math.max(a.y, b.y);

    return (qc.GeometricTool.pointOnLine(a, b, x, y) && (x >= xMin && x <= xMax) && (y >= yMin && y <= yMax));
};

/**
 * 线段相交
 * @param a
 * @param b
 * @param e
 * @param f
 * @param asSegment
 * @param result
 * @returns {*}
 */
GeometricTool.lineIntersectsPoints = function (a, b, e, f, asSegment, result) {

    if (typeof asSegment === 'undefined') { asSegment = true; }
    if (!result) { result = new qc.Point(); }

    var a1 = b.y - a.y;
    var a2 = f.y - e.y;
    var b1 = a.x - b.x;
    var b2 = e.x - f.x;
    var c1 = (b.x * a.y) - (a.x * b.y);
    var c2 = (f.x * e.y) - (e.x * f.y);
    var denom = (a1 * b2) - (a2 * b1);

    if (denom === 0)
    {
        return null;
    }
    if (a.equals(e) || a.equals(f)) {
        result.x = a.x;
        result.y = a.y;
        return result;
    }
    else if (b.equals(e) || b.equals(f)) {
        result.x = b.x;
        result.y = b.y;
        return result;
    }
    result.x = ((b1 * c2) - (b2 * c1)) / denom;
    result.y = ((a2 * c1) - (a1 * c2)) / denom;

    if (asSegment)
    {
        var uc = ((f.y - e.y) * (b.x - a.x) - (f.x - e.x) * (b.y - a.y));
        var ua = (((f.x - e.x) * (a.y - e.y)) - (f.y - e.y) * (a.x - e.x)) / uc;
        var ub = (((b.x - a.x) * (a.y - e.y)) - ((b.y - a.y) * (a.x - e.x))) / uc;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)
        {
            return result;
        }
        else
        {
            return null;
        }
    }

    return result;
};

var inside = GeometricTool._sutherlandHodgmanInside = function (cp1, cp2, p, delta) {
    return (cp2.x-cp1.x)*(p.y-cp1.y) + delta >= (cp2.y-cp1.y)*(p.x-cp1.x);
};

var intersection = GeometricTool._sutherlandHodgmanIntersection = function (cp1, cp2, s, e) {
    var dc = [cp1.x - cp2.x, cp1.y - cp2.y],
        dp = [s.x - e.x, s.y - e.y],
        n1 = cp1.x * cp2.y - cp1.y * cp2.x,
        n2 = s.x * e.y - s.y * e.x,
        n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
    return {x : (n1*dp[0] - n2*dc[0]) * n3, y : (n1*dp[1] - n2*dc[1]) * n3};
};
/**
 * 基于Sutherland Hodgman 算法的多边形裁切
 * @param subjectPolygon
 * @param clipPolygon
 * @returns {[]}
 * @constructor
 */
GeometricTool.sutherlandHodgman = function (subjectPolygon, clipPolygon) {
    var cp1, cp2, s, e, j, i;
    var delta = 0.000001;
    var outputList = subjectPolygon;
    cp1 = clipPolygon[clipPolygon.length-1];
    for (j in clipPolygon) {
        var cp2 = clipPolygon[j];
        var inputList = outputList;
        outputList = [];
        s = inputList[inputList.length - 1]; //last on the input list
        for (i in inputList) {
            var e = inputList[i];
            if (inside(cp1, cp2, e, delta)) {
                if (!inside(cp1, cp2, s, delta)) {
                    outputList.push(intersection(cp1, cp2, s, e));
                }
                outputList.push(e);
            }
            else if (inside(cp1, cp2, s, delta)) {
                outputList.push(intersection(cp1, cp2, s, e));
            }
            s = e;
        }
        cp1 = cp2;
    }
    return outputList
};

/**
 * 将多边形分解为三角形
 * @param p
 * @returns {[]}
 * @constructor
 */
GeometricTool.Triangulate = function(p)
{
    var sign = true;

    var n = p.length;
    if(n < 3) return [];

    var tgs = [];
    var avl = [];
    for(var i = 0; i < n; i++) avl.push(i);

    i = 0;
    var al = n;
    while(al > 3)
    {
        var i0 = avl[(i+0)%al];
        var i1 = avl[(i+1)%al];
        var i2 = avl[(i+2)%al];

        var ax = p[i0].x,  ay = p[i0].y;
        var bx = p[i1].x,  by = p[i1].y;
        var cx = p[i2].x,  cy = p[i2].y;

        var earFound = false;
        if(PIXI.PolyK._convex(ax, ay, bx, by, cx, cy, sign))
        {
            earFound = true;
            for(var j = 0; j < al; j++)
            {
                var vi = avl[j];
                if(vi === i0 || vi === i1 || vi === i2) continue;

                if(PIXI.PolyK._PointInTriangle(p[vi].x, p[vi].y, ax, ay, bx, by, cx, cy)) {
                    earFound = false;
                    break;
                }
            }
        }

        if(earFound)
        {
            tgs.push(i0, i1, i2);
            avl.splice((i+1)%al, 1);
            al--;
            i = 0;
        }
        else if(i++ > 3*al)
        {
            // need to flip flip reverse it!
            // reset!
            if(sign)
            {
                tgs = [];
                avl = [];
                for(i = 0; i < n; i++) avl.push(i);

                i = 0;
                al = n;

                sign = false;
            }
            else
            {
                return null;
            }
        }
    }

    tgs.push(avl[0], avl[1], avl[2]);
    return tgs;
};


/**
 * 使用https://github.com/schteppe/poly-decomp.js为基础，摘出多边形分解算法，修改点的构成方式
 */
/**
 * 计算三角形面积
 * @param a
 * @param b
 * @param c
 * @returns {number}
 */
GeometricTool.area = function(a,b,c){
    if (!a || !b || !c) {
        return 0;
    }
    return (((b.x - a.x) * (c.y - a.y)) - ((c.x - a.x) * (b.y - a.y)));
};

/**
 * 判定点是否在线的左侧
 * @param a
 * @param b
 * @param c
 * @returns {boolean}
 */
GeometricTool.left = function(a,b,c){
    return GeometricTool.area(a,b,c) > 0;
};

/**
 * 判定点是否在线的左侧或者线上
 * @param a
 * @param b
 * @param c
 * @returns {boolean}
 */
GeometricTool.leftOn = function(a,b,c) {
    return GeometricTool.area(a, b, c) >= 0;
};

/**
 * 判定点是否在线的右侧
 * @param a
 * @param b
 * @param c
 * @returns {boolean}
 */
GeometricTool.right = function(a,b,c) {
    return GeometricTool.area(a, b, c) < 0;
};

/**
 * 判定点是否在线的右侧，或者线上
 * @param a
 * @param b
 * @param c
 * @returns {boolean}
 */
GeometricTool.rightOn = function(a,b,c) {
    return GeometricTool.area(a, b, c) <= 0;
};

/**
 * 计算两点的距离
 * @param a
 * @param b
 * @returns {number}
 */
GeometricTool.distance = function(a,b){
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return dx * dx + dy * dy;
};

/**
 * 获取多边形的顶点
 * @param a
 * @param b
 * @param c
 * @returns {boolean}
 */
GeometricTool.atPolygon = function(polygon, i){
    var s = polygon.length;
    return polygon[i < 0 ? i % s + s : i % s];
};

/**
 * 计算两线的交点
 * @param l1
 * @param l2
 * @param precision
 */
GeometricTool.lineInt = function(l1, l2, precision) {
    precision = precision || 0;
    var i = new qc.Point();
    var a1, b1, c1, a2, b2, c2, det;
    a1 = l1[1].y - l1[0].y;
    b1 = l1[0].x - l1[1].x;
    c1 = a1 * l1[0].x + b1 * l1[0].y;
    a2 = l2[1].y - l2[0].y;
    b2 = l2[0].x - l2[1].x;
    c2 = a2 * l2[0].x + b2 *l2[0].y;
    det = 1 / (a1 * b2 - a2 * b1);
    if (!GeometricTool._equals(det, 0, precision)) {
        i.x = (b2 * c1 - b1 * c2) * det;
        i.y = (a1 * c2 - a2 * c1) * det;
    }
    return i;
};

/**
 * 多边形指定顶点是否是逆时针起点
 * @param polygon
 * @param i
 * @returns {boolean}
 */
GeometricTool.isPolygonReflex = function(polygon, i){
    return GeometricTool.right(
        GeometricTool.atPolygon(polygon, i - 1),
        GeometricTool.atPolygon(polygon, i),
        GeometricTool.atPolygon(polygon, i + 1));
};

GeometricTool.polygonCanSee = function(polygon, a, b) {
    var p, dist, l1 = [], l2 = [];
    if (GeometricTool.leftOn(
            GeometricTool.atPolygon(polygon, a + 1),
            GeometricTool.atPolygon(polygon, a),
            GeometricTool.atPolygon(polygon, b)) &&
        GeometricTool.rightOn(
            GeometricTool.atPolygon(polygon, a -1),
            GeometricTool.atPolygon(polygon, a),
            GeometricTool.atPolygon(polygon, b))) {
        return false;
    }
    dist = GeometricTool.distance(GeometricTool.atPolygon(polygon, a), GeometricTool.atPolygon(polygon, b));
    for (var i = 0; i != polygon.length; ++i) {
        if ((i + 1) % polygon.length === a || i === a)
            continue;
        if (GeometricTool.leftOn(
                GeometricTool.atPolygon(polygon, a),
                GeometricTool.atPolygon(polygon, b),
                GeometricTool.atPolygon(polygon, i + 1)
            ) &&
            GeometricTool.rightOn(
                GeometricTool.atPolygon(polygon, a),
                GeometricTool.atPolygon(polygon, b),
                GeometricTool.atPolygon(polygon, i)
            )
        ) {
            l1[0] = GeometricTool.atPolygon(polygon, a);
            l1[1] = GeometricTool.atPolygon(polygon, b);
            l2[0] = GeometricTool.atPolygon(polygon, i);
            l2[1] = GeometricTool.atPolygon(polygon, i + 1);
            p = GeometricTool.lineInt(l1, l2);
            if (GeometricTool.distance(GeometricTool.atPolygon(polygon, a), p) < dist) {
                return false;
            }
        }
    }
    return true;
};

/**
 * 判定两点是否相等
 * @param a
 * @param b
 * @param precision
 * @returns {boolean}
 * @private
 */
GeometricTool._equals = function(a,b,precision){
    precision = precision || 0;
    return Math.abs(a-b) < precision;
};

/**
 * 获取两个线段的交点
 * @param p1
 * @param p2
 * @param q1
 * @param q2
 * @param delta
 * @returns {{x: number, y: number}}
 */
GeometricTool.getIntersectionPoint = function(p1, p2, q1, q2, delta){
    delta = delta || 0;
    var a1 = p2.y - p1.y;
    var b1 = p1.x - p2.x;
    var c1 = (a1 * p1.x) + (b1 * p1.y);
    var a2 = q2.y - q1.y;
    var b2 = q1.x - q2.x;
    var c2 = (a2 * q1.x) + (b2 * q1.y);
    var det = (a1 * b2) - (a2 * b1);

    if(!GeometricTool._equals(det,0,delta))
        return { x : ((b2 * c1) - (b1 * c2)) / det, y : ((a1 * c2) - (a2 * c1)) / det};
    else
        return { x : 0, y : 0};
};

/**
 * 将一个多边形分解为多个凸多边形
 * @param polygon
 * @param result
 * @param reflexVertices
 * @param steinerPoints
 * @param delta
 * @param maxlevel
 * @param level
 * @returns {*}
 */
GeometricTool.quickDecomp = function(polygon, result,reflexVertices,steinerPoints,delta,maxlevel,level){
    maxlevel = maxlevel || 100;
    level = level || 0;
    delta = delta || 25;
    result = typeof(result)!="undefined" ? result : [];
    reflexVertices = reflexVertices || [];
    steinerPoints = steinerPoints || [];

    var upperInt=[0,0], lowerInt=[0,0], p=[0,0]; // Points
    var upperDist=0, lowerDist=0, d=0, closestDist=0; // scalars
    var upperIndex=0, lowerIndex=0, closestIndex=0; // Integers
    var lowerPoly=[], upperPoly=[]; // polygons
    var poly = polygon;

    if(poly.length < 3) return result;

    level++;
    if(level > maxlevel){
        return result;
    }

    for (var i = 0; i < poly.length; ++i) {
        if (GeometricTool.isPolygonReflex(poly, i)) {
            reflexVertices.push(poly[i]);
            upperDist = lowerDist = Number.MAX_VALUE;

            for (var j = 0; j < poly.length; ++j) {
                if (GeometricTool.left(GeometricTool.atPolygon(poly, i - 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j))
                    && GeometricTool.rightOn(GeometricTool.atPolygon(poly, i - 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j - 1))) { // if line intersects with an edge
                    p = GeometricTool.getIntersectionPoint(GeometricTool.atPolygon(poly, i - 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j), GeometricTool.atPolygon(poly, j - 1)); // find the point of intersection
                    if (GeometricTool.right(GeometricTool.atPolygon(poly, i + 1), GeometricTool.atPolygon(poly, i), p)) { // make sure it's inside the poly
                        d = GeometricTool.distance(poly[i], p);
                        if (d < lowerDist) { // keep only the closest intersection
                            lowerDist = d;
                            lowerInt = p;
                            lowerIndex = j;
                        }
                    }
                }
                if (GeometricTool.left(GeometricTool.atPolygon(poly, i + 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j + 1))
                    && GeometricTool.rightOn(GeometricTool.atPolygon(poly, i + 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j))) {
                    p = GeometricTool.getIntersectionPoint(GeometricTool.atPolygon(poly, i + 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j), GeometricTool.atPolygon(poly, j + 1));
                    if (GeometricTool.left(GeometricTool.atPolygon(poly, i - 1), GeometricTool.atPolygon(poly, i), p)) {
                        d = GeometricTool.distance(poly[i], p);
                        if (d < upperDist) {
                            upperDist = d;
                            upperInt = p;
                            upperIndex = j;
                        }
                    }
                }
            }

            // if there are no vertices to connect to, choose a point in the middle
            if (lowerIndex == (upperIndex + 1) % poly.length) {
                //console.log("Case 1: Vertex("+i+"), lowerIndex("+lowerIndex+"), upperIndex("+upperIndex+"), poly.size("+this.vertices.length+")");
                p.x = (lowerInt.x + upperInt.x) / 2;
                p.y = (lowerInt.y + upperInt.y) / 2;
                steinerPoints.push(p);

                if (i < upperIndex) {
                    //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.begin() + upperIndex + 1);
                    Array.prototype.push.apply(lowerPoly, poly.slice(i, upperIndex + 1));
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    if (lowerIndex != 0){
                        //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.end());
                        Array.prototype.push.apply(upperPoly, poly.slice(lowerIndex, poly.length));
                    }
                    //upperPoly.insert(upperPoly.end(), poly.begin(), poly.begin() + i + 1);
                    Array.prototype.push.apply(upperPoly, poly.slice(0, i + 1));
                } else {
                    if (i != 0){
                        //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.end());
                        Array.prototype.push.apply(lowerPoly, poly.slice(i, poly.length));
                    }
                    //lowerPoly.insert(lowerPoly.end(), poly.begin(), poly.begin() + upperIndex + 1);
                    Array.prototype.push.apply(lowerPoly, poly.slice(0, upperIndex + 1));
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.begin() + i + 1);
                    Array.prototype.push.apply(upperPoly, poly.slice(lowerIndex, i + 1));
                }
            } else {
                // connect to the closest point within the triangle
                //console.log("Case 2: Vertex("+i+"), closestIndex("+closestIndex+"), poly.size("+this.vertices.length+")\n");

                if (lowerIndex > upperIndex) {
                    upperIndex += poly.length;
                }
                closestDist = Number.MAX_VALUE;

                if(upperIndex < lowerIndex){
                    return result;
                }

                for (var j = lowerIndex; j <= upperIndex; ++j) {
                    if (GeometricTool.leftOn(GeometricTool.atPolygon(poly, i - 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j))
                        && GeometricTool.rightOn(GeometricTool.atPolygon(poly, i + 1), GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j))) {
                        d = GeometricTool.distance(GeometricTool.atPolygon(poly, i), GeometricTool.atPolygon(poly, j));
                        if (d < closestDist) {
                            closestDist = d;
                            closestIndex = j % poly.length;
                        }
                    }
                }

                if (i < closestIndex) {
                    Array.prototype.push.apply(lowerPoly, poly.slice(i, closestIndex + 1));
                    if (closestIndex != 0){
                        Array.prototype.push.apply(upperPoly, poly.slice(closestIndex, poly.length));
                    }
                    Array.prototype.push.apply(upperPoly, poly.slice(0, i + 1));
                } else {
                    if (i != 0){
                        Array.prototype.push.apply(lowerPoly, poly.slice(i, poly.length));
                    }
                    Array.prototype.push.apply(lowerPoly, poly.slice(0, closestIndex + 1));
                    Array.prototype.push.apply(upperPoly, poly.slice(closestIndex, i + 1));
                }
            }

            // solve smallest poly first
            if (lowerPoly.length < upperPoly.length) {
                GeometricTool.quickDecomp(lowerPoly,result,reflexVertices,steinerPoints,delta,maxlevel,level);
                GeometricTool.quickDecomp(upperPoly,result,reflexVertices,steinerPoints,delta,maxlevel,level);
            } else {
                GeometricTool.quickDecomp(upperPoly,result,reflexVertices,steinerPoints,delta,maxlevel,level);
                GeometricTool.quickDecomp(lowerPoly,result,reflexVertices,steinerPoints,delta,maxlevel,level);
            }

            return result;
        }
    }
    result.push(poly);

    return result;
};

/**
 * 分隔为凸多边形
 */
GeometricTool.decomp = function(polygon){
    var edges = GeometricTool.getCutEdges(polygon);
    if (edges.length > 0)
        return GeometricTool.polygonSlice(polygon, edges);
    else
        return [polygon];
};

/**
 * 根据裁切边界分隔多边形
 * @param polygon
 * @param cutEdges
 * @returns {*}
 */
GeometricTool.polygonSlice = function(polygon, cutEdges) {
    if (cutEdges.length === 0) return [this];
    if (cutEdges instanceof Array &&
        cutEdges.length &&
        cutEdges[0] instanceof Array &&
        cutEdges[0].length == 2 &&
        cutEdges[0][0] instanceof  Array
    ) {
        var polys = [polygon];
        for (var i = 0; i < cutEdges.length; i++) {
            var cutEdge = cutEdges[i];
            for (var j = 0; j < polys.length; j++) {
                var poly = polys[j];
                var result = GeometricTool.polygonSlice(poly, cutEdge);
                if (result) {
                    polys.splice(j , 1);
                    polys.push(result[0], result[1]);
                    break;
                }
            }
        }
        return polys;
    } else {
        var cutEdge = cutEdges;
        var i = polygon.indexOf(cutEdge[0]);
        var j = polygon.indexOf(cutEdge[1]);
        if (i != -1 && j != -1) {
            return [
                GeometricTool.copyPolygon(polygon, i, j),
                GeometricTool.copyPolygon(polygon, j, 1)
            ];
        }
        else {
            return false;
        }
    }
};

/**
 * 拷贝多边形
 * @param polygon
 * @param i
 * @param j
 * @param targetPoly
 * @returns {*|Array}
 */
GeometricTool.copyPolygon = function(polygon, i, j, targetPoly) {
    var p = targetPoly || [];
    if (i < j) {
        for (var k = i; k <= j; k++) {
            p.push(polygon[k]);
        }
    }
    else {
        for (var k = 0; k <= j; k++) {
            p.push(polygon[k]);
        }
        for (var k = i; k < polygon.length; k++) {
            p.push(polygon[k]);
        }
    }
    return p;
};

/**
 * 得到裁剪边界
 * @param polygon
 * @returns {Array}
 */
GeometricTool.getCutEdges = function(polygon) {
    var min = [], tmp1 = [], tmp2 = [], tmpPoly = [];
    var nDiags = Number.MAX_VALUE;

    for (var i = 0; i < polygon.length; ++i) {
        if (GeometricTool.isPolygonReflex(polygon, i)) {
            for (var j = 0; j < polygon.length; ++j) {
                if (GeometricTool.polygonCanSee(polygon, i, j)) {
                    tmp1 = GeometricTool.getCutEdges(GeometricTool.copyPolygon(polygon, i, j));
                    tmp2 = GeometricTool.getCutEdges(GeometricTool.copyPolygon(polygon, j, i));

                    for (var k = 0; k < tmp2.length; k++) {
                        tmp1.push(tmp2[k]);
                    }
                    if (tmp1.length < nDiags) {
                        min = tmp1;
                        nDiags = tmp1.length;
                        min.push([
                            GeometricTool.atPolygon(polygon, i),
                            GeometricTool.atPolygon(polygon, j)
                        ]);
                    }
                }
            }
        }
    }
    return min;
};