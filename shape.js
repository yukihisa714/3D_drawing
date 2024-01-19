import { Line, Plane, Point, getCrossProduct, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, getVectorFrom2Points, max, min } from "./math.js";


export class Vertex extends Point {
    constructor(x, y, z, i) {
        super(x, y, z);
        this.i = i;
        this.point = new Point(x, y, z);
    }

    getClone() {
        return new Vertex(this.x, this.y, this.z, this.i);
    }
}

export class Edge {
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
    }
}

export class Face {
    constructor(vertex1, vertex2, vertex3) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vertex3 = vertex3;

        this.vector1 = getVectorFrom2Points(this.vertex1, vertex2);
        this.vector2 = getVectorFrom2Points(this.vertex1, vertex3);

        this.normalVector = getCrossProduct(this.vector1, this.vector2);

        this.plane = getPlaneFromVectorAndPoint(this.normalVector, vertex1.point);
    }
}