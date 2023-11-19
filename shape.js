import { Point, Vector } from "./math.js";


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
    }
}