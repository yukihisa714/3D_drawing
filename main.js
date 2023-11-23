import { Line, Point, Vector, cos, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, sin } from "./math.js";
import { Edge, Vertex } from "./shape.js";

const CAMERA_W = 3;
const CAMERA_H = 3;

const expandingRatio = 80;

const CAN_W = CAMERA_W * expandingRatio;
const CAN_H = CAMERA_H * expandingRatio;

const can = document.getElementById("canvas");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";

const con = can.getContext("2d");

const key = {};
document.onkeydown = e => {
    key[e.key] = true;
    // console.log(e.key);
}
document.onkeyup = e => {
    key[e.key] = false;
}


function drawCircle(x, y, r) {
    con.beginPath();
    con.arc(x, y, r, 0, 2 * Math.PI);
    con.fillStyle = "#000";
    con.fill();
}

function drawLine(x1, y1, x2, y2) {
    con.beginPath();
    con.lineTo(x1, y1);
    con.lineTo(x2, y2);
    con.closePath();
    con.lineWIdth = 1;
    con.strokeStyle = "#000";
    con.stroke();
}


class Camera {
    /**
     * コンストラクタ
     * @param {Point} pos カメラの位置
     * @param {number} rx x軸回転の角度
     * @param {number} rz z軸回転の角度
     * @param {number} focalLength 焦点距離
     * @param {number} width カメラの横幅
     * @param {number} height カメラの縦幅
     */
    constructor(pos, rx, rz, focalLength, width, height) {
        this.pos = pos;
        this.rx = rx;
        this.rz = rz;
        this.focalLength = focalLength;
        this.width = width;
        this.height = height;

        this.update();
    }


    updateNormalVector() {
        const z = sin(this.rx) * this.focalLength;
        const y = cos(this.rz) * cos(this.rx) * this.focalLength;
        const x = sin(this.rz) * cos(this.rx) * this.focalLength;

        this.normalVector = new Vector(x, y, z);
    }


    updatePlane() {
        this.plane = getPlaneFromVectorAndPoint(this.normalVector, this.pos);
    }


    importShapes() {
        this.importedVertexes = vertexesList.map(vertex => vertex.getClone());
        this.importedEdges = edges.map(edge => edge.getClone());
    }


    /**
     * 点をカメラ平面に投影
     * @param {Vertex} vertex ポイント
     * @returns {Vertex} カメラ平面上の点
     */
    getProjectedVertex(vertex) {
        const rayVector = new Vector(this.pos.x - vertex.x, this.pos.y - vertex.y, this.pos.z - vertex.z);
        const ray = new Line(this.pos, rayVector);
        const intersection = getIntersectionFromLineAndPlane(ray, this.plane);

        return new Vertex(intersection.x, intersection.y, intersection.z, vertex.i);
    }


    /**
     * カメラ平面の点の座標変換をするメソッド
     * @param {Vertex} vertex 変換前の座標
     * @returns {Vertex} 座標変換後の座標
     */
    getConvertedVertex(vertex) {
        const vectorFromCamPos = new Vector(vertex.x - this.pos.x, vertex.y - this.pos.y, vertex.z - this.pos.z);

        /*
        X = xcosθ - ysinθ
        Y = xsinθ + ycosθ

        Y = ycosθ - zsinθ
        Z = ysinθ + zcosθ
        */

        const { x, y, z } = vectorFromCamPos;

        const x1 = cos(this.rz) * x - sin(this.rz) * y;
        const y1 = sin(this.rz) * x + cos(this.rz) * y;
        const z1 = z;

        const x2 = x1;
        const y2 = cos(-this.rx) * y1 - sin(-this.rx) * z1;
        const z2 = sin(-this.rx) * y1 + cos(-this.rx) * z1;

        const x3 = x2 + this.pos.x;
        const y3 = y2 + this.pos.y;
        const z3 = z2 + this.pos.z;

        return new Vertex(x3, y3, z3, vertex.i);
    }


    getToDrawVertex(vertex) {
        const projectedVertex = this.getProjectedVertex(vertex);
        const convertedVertex = this.getConvertedVertex(projectedVertex);
        return convertedVertex;
    }


    draw() {
        for (const vertex of this.importedVertexes) {
            if (this.plane.isPointInFrontOf(vertex)) {
                const toDrawVertex = this.getToDrawVertex(vertex);

                const dx = (toDrawVertex.x - this.pos.x) * expandingRatio + CAN_W / 2;
                const dy = (toDrawVertex.z - this.pos.z) * -expandingRatio + CAN_H / 2;
                drawCircle(dx, dy, 5);
                con.fillStyle = "#fff";
                con.fillText(toDrawVertex.i, dx, dy);
            }
        }

        for (const edge of this.importedEdges) {
            edge.correctVertexToFront(this.plane);
            if (!this.plane.isPointInFrontOf(edge.vertex1) && !this.plane.isPointInFrontOf(edge.vertex2)) continue;
            const vertex1 = edge.vertex1.getClone();
            const vertex2 = edge.vertex2.getClone();

            const toDrawVertex1 = this.getToDrawVertex(vertex1);
            const toDrawVertex2 = this.getToDrawVertex(vertex2);

            const dx1 = (toDrawVertex1.x - this.pos.x) * expandingRatio + CAN_W / 2;
            const dy1 = (toDrawVertex1.z - this.pos.z) * -expandingRatio + CAN_H / 2;
            const dx2 = (toDrawVertex2.x - this.pos.x) * expandingRatio + CAN_W / 2;
            const dy2 = (toDrawVertex2.z - this.pos.z) * -expandingRatio + CAN_H / 2;

            drawLine(dx1, dy1, dx2, dy2);
        }
    }


    move() {
        const v = 0.1;
        if (key["a"]) {
            this.pos.x -= cos(this.rz) * v;
            this.pos.y += sin(this.rz) * v;
        }
        if (key["d"]) {
            this.pos.x += cos(this.rz) * v;
            this.pos.y -= sin(this.rz) * v
        }
        if (key["w"]) {
            this.pos.x += sin(this.rz) * v;
            this.pos.y += cos(this.rz) * v;
        }
        if (key["s"]) {
            this.pos.x -= sin(this.rz) * v;
            this.pos.y -= cos(this.rz) * v;
        }

        if (key[" "]) this.pos.z += v;
        if (key["Shift"]) this.pos.z -= v;

        const rv = 1.5;
        if (key["ArrowLeft"]) this.rz -= rv;
        if (key["ArrowRight"]) this.rz += rv;
        if (key["ArrowUp"]) this.rx += rv;
        if (key["ArrowDown"]) this.rx -= rv;
    }


    update() {
        this.move();
        this.updateNormalVector();
        this.updatePlane();
        this.importShapes();
        this.draw();
    }
}


const vertexesList = [
    new Vertex(0, 3, 0),
    new Vertex(1, 2, 1),
    new Vertex(1, 2, -1),
    new Vertex(-1, 2, -1),
    new Vertex(-1, 2, 1),
    new Vertex(1, 4, 1),
    new Vertex(1, 4, -1),
    new Vertex(-1, 4, -1),
    new Vertex(-1, 4, 1),
];
for (let i = 0; i < vertexesList.length; i++) {
    vertexesList[i].i = 0;
}


const edgeIndexesList = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 1],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 5],
    [1, 5],
    [2, 6],
    [3, 7],
    [4, 8],
];

const edges = [];
for (const i of edgeIndexesList) {
    const i1 = i[0];
    const i2 = i[1];
    edges.push(new Edge(vertexesList[i1], vertexesList[i2]));
}
console.log(edges);


const camera = new Camera(new Point(0, -1, 0), 0, 0, 3, 3, 3);

console.log(camera);

function mainLoop() {
    con.clearRect(0, 0, CAN_W, CAN_H);

    camera.update();
}

setInterval(mainLoop, 1000 / 60);