import { Line, Plane, Point, Vector, getCrossProduct, getInnerProduct, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, getSTFrom3Vectors, getVectorFrom2Points, max, min } from "./math.js";


class Vertex extends Point {
    constructor(x, y, z, i) {
        super(x, y, z);
        this.i = i;
        this.point = new Point(x, y, z);
    }

    getClone() {
        return new Vertex(this.x, this.y, this.z, this.i);
    }
}

class Edge {
    constructor(vertex1, vertex2) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vector = getVectorFrom2Points(this.vertex1, this.vertex2);
        this.line = new Line(vertex1, this.vector);
        this.min = new Point(min(vertex1.x, vertex2.x), min(vertex1.y, vertex2.y), min(vertex1.z, vertex2.z));
        this.max = new Point(max(vertex1.x, vertex2.x), max(vertex1.y, vertex2.y), max(vertex1.z, vertex2.z));
    }

    getClone() {
        return new Edge(this.vertex1.getClone(), this.vertex2.getClone());
    }

    /**
     * 辺と平面の交点が辺上にあるかチェックするメソッド
     * @param {Plane} plane 
     * @returns {Boolean}
     */
    checkEdgePlaneIntersection(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        return (
            intersection.x >= this.min.x &&
            intersection.x <= this.max.x &&
            intersection.y >= this.min.y &&
            intersection.y <= this.max.y &&
            intersection.z >= this.min.z &&
            intersection.z <= this.max.z
        )
    }

    /**
     * 辺が(カメラ)平面と交差しているとき平面の後ろの頂点を平面上に移動するメソッド
     * @param {Plane} plane
     * @returns {Edge}
     */
    setVertexInFrontOfCamera(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        if (this.checkEdgePlaneIntersection(plane)) {
            if (!plane.isPointInFrontOf(this.vertex1)) {
                this.vertex1 = new Vertex(intersection.x, intersection.y, intersection.z);
            }
            else if (!plane.isPointInFrontOf(this.vertex2)) {
                this.vertex2 = new Vertex(intersection.x, intersection.y, intersection.z);
            }
        }
        return this.getClone();
    }
}

class HalfLine extends Line {
    constructor(point, vector) {
        super(point, vector);
        this.line = new Line(this.point, this.vector);
    }

    getClone() {
        return new HalfLine(this.point, this.vector);
    }

    isPointWithinRange(point) {
        const toPointVector = new Vector(this.point, point);
        const innerProduct = getInnerProduct(this.vector, toPointVector);
        return innerProduct > 0;
    }

    isOnIntersectionWithPlane(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        const isOnIntersection = this.isPointWithinRange(intersection);
        return isOnIntersection;
    }
}
console.log(new HalfLine(new Point(0, 0, 0), new Vector(1, 1, 1)));


class Face {
    constructor(vertex1, vertex2, vertex3, color, roughness) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vertex3 = vertex3;

        this.color = color;
        this.roughness = roughness;

        this.vector1 = getVectorFrom2Points(this.vertex1, this.vertex2);
        this.vector2 = getVectorFrom2Points(this.vertex1, this.vertex3);

        this.normalVector = getCrossProduct(this.vector1, this.vector2);

        this.plane = getPlaneFromVectorAndPoint(this.normalVector, this.vertex1.point);
    }

    getClone() {
        return new Face(this.vertex1.getClone(), this.vertex2.getClone(), this.vertex3.getClone(), this.color);
    }

    /**
     * 頂点が面の中にあるかチェックするメソッド
     * 頂点が面を含む平面上にあることが条件
     * @param {Point} point 
     * @returns {boolean}
     */
    checkPointOnFace(point) {
        const ST = getSTFrom3Vectors(getVectorFrom2Points(this.vertex1, point), this.vector1, this.vector2);

        const s = ST.s;
        const t = ST.t;

        return (s >= 0 && t >= 0 && s + t <= 1);
    }
}


class Light {
    constructor(pos, power, color) {
        this.pos = pos;
        this.power = power;
        this.color = color;
    }

    getClone() {
        return new Light(this.pos, this.power, this.color);
    }
}

/**
 * 辺と面が交差しているかチェックする関数
 * @param {Edge} edge 
 * @param {Face} face 
 * @returns {boolean}
 */
function checkDoesIntersectEdgeAndFace(edge, face) {
    return (
        // 交点が辺上にあるかどうか
        edge.checkEdgePlaneIntersection(face.plane) &&
        // 交点が面上にあるかどうか
        face.checkPointOnFace(getIntersectionFromLineAndPlane(edge.line, face.plane))
    );
}

function checkDoesIntersectHalfLineAndFace(halfLine, face) {
    return (
        // 交点が半直線上にあるかどうか
        halfLine.isOnIntersectionWithPlane(face.plane) &&
        // 交点が面上にあるかどうか
        face.checkPointOnFace(getIntersectionFromLineAndPlane(halfLine.line, face.plane))
    )
}