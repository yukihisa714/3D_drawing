import { Line, Plane, Point, Vector, getIntersectionFromLineAndPlane, max, min } from "./math.js";


export class Vertex extends Point {
    constructor(x, y, z, i) {
        super(x, y, z);
        this.i = i;
    }

    getClone() {
        return new Vertex(this.x, this.y, this.z, this.i);
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

    getClone() {
        return new Edge(this.vertex1.getClone(), this.vertex2.getClone());
    }

    /**
     * 
     * @param {Plane} plane 
     * @returns {Boolean}
     */
    isIntersectionOnEdge(plane) {
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
     * 
     * @param {Plane} plane 
     */
    correctVertexToFront(plane) {
        const intersection = getIntersectionFromLineAndPlane(this.line, plane);
        if (this.isIntersectionOnEdge(plane)) {
            if (plane.isPointInFrontOf(this.vertex1)) {
                this.vertex2 = intersection.getClone();
            }
            else {
                this.vertex1 = intersection;
            }
        }
    }
}