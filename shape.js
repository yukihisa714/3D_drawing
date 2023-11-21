import { Line, Plane, Point, Vector, getIntersectionFromLineAndPlane, max, min } from "./math.js";


export class Vertex extends Point {
    constructor(x, y, z, i) {
        super(x, y, z);
        this.i = i;
    }
}

export class Edge {
    constructor(vertex1, vertex2) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vector = new Vector(vertex2.x - vertex1.x, vertex2.y - vertex1.y, vertex2.z - vertex1.z,);
        this.line = new Line(vertex1, this.vector);
        this.min = new Point(min(vertex1.x, vertex2.x), min(vertex1.y, vertex2.y), min(vertex1.z, vertex2.z));
        this.max = new Point(max(vertex1.x, vertex2.x), max(vertex1.y, vertex2.y), max(vertex1.z, vertex2.z));
    }

    /**
     * 
     * @param {Plane} plane 
     */
    isIntersectionOnPlane(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        if (
            intersection.x > this.min.x &&
            intersection.x < this.max.x &&
            intersection.y > this.min.y &&
            intersection.y < this.max.y &&
            intersection.z > this.min.z &&
            intersection.z < this.max.z
        ) {
            return true;
        }
        else return false;
    }

    /**
     * 
     * @param {Plane} plane 
     */
    correctVertexToFront(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        if (this.isIntersectionOnPlane(plane)) {
            if (plane.isPointInFrontOf(this.vertex1)) {
                this.vertex2 = intersection;
            }
            else {
                this.vertex1 = intersection;
            }
        }
    }
}