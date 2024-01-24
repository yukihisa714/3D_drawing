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
    constructor(vertex1, vertex2, vertex3, color) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vertex3 = vertex3;

        this.color = color;

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
        /**
         * a→ = (ax, ay, az)
         * b→ = (bx, by, bz)
         * p→ = (px, py, pz)
         * 
         * p が a,bを含む平面上にあるとき、存在条件はx,yのみでいい
         * 
         * (s>=0, t>=0, s+t<=1)
         * 
         * px = s*ax + t*bx
         * py = s*zy + t*by
         * 
         * px*ay = s*ax*ay + t*bx*ay
         * py*ax = s*ax*ay + t*by*ax
         * 
         * px*ay - py*ax = t*bx*ay - t*by*ax
         * t = (px*ay - py*ax) / (bx*ay - by*ax)
         * s = (px - t*bx) / ax
         * s = (py - t*by) / ay
         */

        const a = this.vector1;
        const b = this.vector2;
        const p = getVectorFrom2Points(this.vertex1, point);
        // console.log(a, b, p);

        /**
         * 二軸で計算すると、分母が0になる場合があるので
         * 3パターン計算すれば必ず0にならない式が作れる
         * 
         * これでもまだ足りないのが分かったので
         * sも2通りの式を作る
         */

        const t1 = (p.x * a.y - p.y * a.x) / (b.x * a.y - b.y * a.x);
        const s11 = (p.x - t1 * b.x) / a.x;
        const s12 = (p.y - t1 * b.y) / a.y;
        let s1 = isNaN(s11) ? s12 : s11;
        const st1 = s1 + t1;

        const t2 = (p.y * a.z - p.z * a.y) / (b.y * a.z - b.z * a.y);
        const s21 = (p.y - t2 * b.y) / a.y;
        const s22 = (p.z - t2 * b.z) / a.z;
        let s2 = isNaN(s21) ? s22 : s21;
        const st2 = s2 + t2;

        const t3 = (p.z * a.x - p.x * a.z) / (b.z * a.x - b.x * a.z);
        const s31 = (p.z - t3 * b.z) / a.z;
        const s32 = (p.x - t3 * b.x) / a.x;
        let s3 = isNaN(s31) ? s32 : s31;
        const st3 = s3 + t3;

        let s;
        let t;

        if (isNaN(st1) === false) {
            s = s1;
            t = t1;
        }
        else if (isNaN(st2) === false) {
            s = s2;
            t = t2;
        }
        else if (isNaN(st3) === false) {
            s = s3;
            t = t3;
        }

        return (s >= 0 && t >= 0 && s + t <= 1);
    }
}