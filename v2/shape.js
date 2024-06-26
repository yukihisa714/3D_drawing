import { Line, Plane, Point, Vector, getCrossProduct, getInnerProduct, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, getSTFrom3Vectors, getVectorFrom2Points } from "./math.js";


/**
 * 頂点のクラス
 */
export class Vertex extends Point {
    /**
     * コンストラクタ
     * @param {number} x 座標
     * @param {number} y 座標
     * @param {number} z 座標
     * @param {number} i 番号
     */
    constructor(x, y, z, i) {
        super(x, y, z);
        this.i = i;
        this.point = new Point(x, y, z);
    }

    getClone() {
        return new Vertex(this.x, this.y, this.z, this.i);
    }
}



/**
 * 辺のクラス
 */
export class Edge {
    /**
     * コンストラクタ
     * @param {Vertex} vertex1 
     * @param {Vertex} vertex2 
     */
    constructor(vertex1, vertex2) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vector = getVectorFrom2Points(vertex1.point, vertex2.point);
        this.line = new Line(vertex1.point, this.vector);
    }

    getClone() {
        return new Edge(this.vertex1.getClone(), this.vertex2.getClone());
    }

    /**
     * 点が辺の範囲内にあるかどうか
     * @param {Point} point 
     * @returns {boolean}
     */
    isPointInRange(point) {
        const toPointVector1 = getVectorFrom2Points(this.vertex1.point, point);
        const toPointVector2 = getVectorFrom2Points(this.vertex2.point, point);
        const innerProduct1 = getInnerProduct(this.vector, toPointVector1);
        const innerProduct2 = getInnerProduct(this.vector, toPointVector2);

        return innerProduct1 > 0 && innerProduct2 < 0;
    }

    /**
     * 辺と平面の交点が辺上にあるかチェックするメソッド
     * @param {Plane} plane 
     * @returns {boolean}
     */
    isOnIntersectionWithPlane(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        return this.isPointInRange(intersection);
    }

    /**
     * 辺が(カメラ)平面と交差しているとき平面の後ろの頂点を平面上に移動するメソッド
     * @param {Plane} plane
     * @returns {Edge}
     */
    setVertexInFrontOfCamera(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        if (this.isOnIntersectionWithPlane(plane)) {
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



/**
 * 半直線のクラス
 */
export class HalfLine extends Line {
    /**
     * コンストラクタ
     * @param {Point} point 端の点
     * @param {Vector} vector 
     */
    constructor(point, vector) {
        super(point, vector);
        this.line = new Line(this.point, this.vector);
    }

    getClone() {
        return new HalfLine(this.point, this.vector);
    }

    /**
     * 点が半直線の範囲内にあるかどうか
     * @param {Point} point 
     * @returns {boolean}
     */
    isPointInRange(point) {
        const toPointVector = new Vector(this.point, point);
        const innerProduct = getInnerProduct(this.vector, toPointVector);

        return innerProduct > 0;
    }
}
console.log(new HalfLine(new Point(0, 0, 0), new Vector(1, 1, 1)));



/**
 * 面のクラス
 */
export class Face {
    /**
     * コンストラクタ
     * @param {Vertex} vertex1 
     * @param {Vertex} vertex2 
     * @param {Vertex} vertex3 
     * @param {Array} color 
     * @param {number} roughness 
     */
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
    isPointOnFace(point) {
        const ST = getSTFrom3Vectors(getVectorFrom2Points(this.vertex1, point), this.vector1, this.vector2);

        const s = ST.s;
        const t = ST.t;

        return (s >= 0 && t >= 0 && s + t <= 1);
    }
}



/**
 * ライトのクラス
 */
export class Light {
    /**
     * コンストラクタ
     * @param {Point} pos 位置
     * @param {number} power 強さ
     * @param {Array} color 色
     */
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
export function checkDoesIntersectEdgeAndFace(edge, face) {
    return (
        // 交点が辺上にあるかどうか
        edge.isOnIntersectionWithPlane(face.plane) &&
        // 交点が面上にあるかどうか
        face.isPointOnFace(getIntersectionFromLineAndPlane(edge.line, face.plane))
    );
}
/**
 * 半直線と面が交差しているかチェックする関数
 * @param {HalfLine} halfLine 
 * @param {Face} face 
 * @returns {boolean}
 */
export function checkDoesIntersectHalfLineAndFace(halfLine, face) {
    return (
        // 交点が半直線上にあるかどうか
        halfLine.isOnIntersectionWithPlane(face.plane) &&
        // 交点が面上にあるかどうか
        face.isPointOnFace(getIntersectionFromLineAndPlane(halfLine.line, face.plane))
    );
}