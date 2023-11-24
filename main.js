import { Line, Point, Vector, cos, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, sin } from "./math.js";
import { Edge, Vertex } from "./shape.js";

const CAMERA_W = 3.2;
const CAMERA_H = 1.8;

const expandingRatio = 256;

const CAN_W = CAMERA_W * expandingRatio;
const CAN_H = CAMERA_H * expandingRatio;

const can = document.getElementById("canvas");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";

const con = can.getContext("2d");

const can2 = document.getElementById("canvas2");
const con2 = can2.getContext("2d");

const key = {};
document.onkeydown = e => {
    key[e.key] = true;
    // console.log(e.key);
}
document.onkeyup = e => {
    key[e.key] = false;
}


function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.lineWIdth = 1;
    ctx.strokeStyle = "#000";
    ctx.stroke();
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

    updateFocus() {
        this.focus = new Point(
            this.pos.x - this.normalVector.x,
            this.pos.y - this.normalVector.y,
            this.pos.z - this.normalVector.z,
        );
    }


    updatePlane() {
        this.plane = getPlaneFromVectorAndPoint(this.normalVector, this.focus);
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
        const rayVector = new Vector(this.focus.x - vertex.x, this.focus.y - vertex.y, this.focus.z - vertex.z);
        const ray = new Line(this.focus, rayVector);
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

        const sinRZ = sin(this.rz);
        const cosRZ = cos(this.rz);
        const sinRX = sin(-this.rx);
        const cosRX = cos(-this.rx);

        const x1 = cosRZ * x - sinRZ * y;
        const y1 = sinRZ * x + cosRZ * y;
        const z1 = z;

        const x2 = x1;
        const y2 = cosRX * y1 - sinRX * z1;
        const z2 = sinRX * y1 + cosRX * z1;

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
                drawCircle(con, dx | 0, dy | 0, 2.5);
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

            drawLine(con, dx1 | 0, dy1 | 0, dx2 | 0, dy2 | 0);
        }


        const pdx = this.pos.x * 10 + 50;
        const pdy = this.pos.y * -10 + 50;
        drawCircle(con2, pdx, pdy, 3);

        const fdx = this.focus.x * 10 + 50;
        const fdy = this.focus.y * -10 + 50;
        drawCircle(con2, fdx, fdy, 2)
        // drawLine(con2, this.pos)

        for (const vertex of vertexesList) {
            const dx = vertex.x * 10 + 50;
            const dy = vertex.y * -10 + 50;
            drawCircle(con2, dx, dy, 2.5);
        }

        for (const edge of edges) {
            const dx1 = edge.vertex1.x * 10 + 50;
            const dy1 = edge.vertex1.y * -10 + 50;
            const dx2 = edge.vertex2.x * 10 + 50;
            const dy2 = edge.vertex2.y * -10 + 50;
            drawLine(con2, dx1, dy1, dx2, dy2);
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
        this.updateFocus();
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
    vertexesList[i].i = i;
}

// for (let i = 0; i < 10; i++) {
//     for (let j = 0; j < 10; j++) {
//         for (let k = 0; k < 10; k++) {
//             vertexesList.push(new Vertex(i, j, k, i + j + k));
//         }
//     }
// }


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
    const st = performance.now();

    con.clearRect(0, 0, CAN_W, CAN_H);
    con2.clearRect(0, 0, 100, 100);

    camera.update();

    const et = performance.now();
    con.fillStyle = "#fff";
    con.fillText(`${((et - st) * 100 | 0) / 100}ms`, 10, 10);
}

// mainLoop();

setInterval(mainLoop, 1000 / 60);