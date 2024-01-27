import { Line, Point, Vector, cos, getCrossProduct, getIntersectionFromLineAndPlane, getLengthFrom2Points, getPlaneFromVectorAndPoint, getSumOf2Vectors, getVectorFrom2Points, sin } from "./math.js";
import { Edge, Face, Light, Vertex } from "./shape.js";

const CAMERA_W = 3.2;
const CAMERA_H = 1.8;

const expandingRatio = 50;

const CAN_W = CAMERA_W * expandingRatio;
const CAN_H = CAMERA_H * expandingRatio;

const can = document.getElementById("canvas");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";

const con = can.getContext("2d");

const can2 = document.getElementById("canvas2");
const con2 = can2.getContext("2d");

const can3 = document.getElementById("canvas3");
can3.width = CAN_W;
can3.height = CAN_H;
can3.style.background = "#888";

const con3 = can3.getContext("2d");


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


/**
 * カメラのクラス
 */
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
        this.normalVector = new Vector(0, this.focalLength, 0).rotate(this.rx, this.rz);
    }

    updateFocusPoint() {
        this.focus = new Point(
            this.pos.x - this.normalVector.x,
            this.pos.y - this.normalVector.y,
            this.pos.z - this.normalVector.z,
        );
    }


    updatePlane() {
        this.plane = getPlaneFromVectorAndPoint(this.normalVector, this.pos);
    }

    updateCornerVectorsFromPos() {
        this.cornerVectorsFromPos = {
            topLeft: new Vector(-this.width / 2, 0, this.height / 2),
            topRight: new Vector(this.width / 2, 0, this.height / 2),
            bottomLeft: new Vector(-this.width / 2, 0, -this.height / 2),
            bottomRight: new Vector(this.width / 2, 0, -this.height / 2),
        };
        for (const key in this.cornerVectorsFromPos) {
            this.cornerVectorsFromPos[key].rotate(this.rx, this.rz);
        }
    }

    updateCornerPoints() {
        this.cornerPoints = {
            topLeft: this.pos.getClone(),
            topRight: this.pos.getClone(),
            bottomLeft: this.pos.getClone(),
            bottomRight: this.pos.getClone(),
        };
        for (const key in this.cornerPoints) {
            this.cornerPoints[key].move(this.cornerVectorsFromPos[key]);
        }
    }

    updateOnCameraPlaneVector() {
        // カメラの左上から右上又は左下へのベクトル
        this.onCameraPlaneVector = {
            toRight: getVectorFrom2Points(this.cornerPoints.topLeft, this.cornerPoints.topRight),
            toBottom: getVectorFrom2Points(this.cornerPoints.topLeft, this.cornerPoints.bottomLeft),
        };

        // カメラの1px単位のベクトル
        this.onCameraPlane1pxVector = {
            toRight: this.onCameraPlaneVector.toRight.multiplication(1 / CAN_W),
            toBottom: this.onCameraPlaneVector.toBottom.multiplication(1 / CAN_H),
        };
    }


    /**
     * 焦点からカメラの全ピクセルへのベクトルを更新するメソッド
     */
    updateViewLayVectorsFromFocus() {
        this.viewLayVectorsFromFocus = [];
        for (let y = 0; y < CAN_H; y++) {
            this.viewLayVectorsFromFocus[y] = [];
            const cameraVectorToBottomPixel = this.onCameraPlane1pxVector.toBottom.getClone().multiplication(y);
            for (let x = 0; x < CAN_W; x++) {
                const cameraVectorToRightPixel = this.onCameraPlane1pxVector.toRight.getClone().multiplication(x);
                // カメラの左上から特定のピクセルへのベクトル
                const cameraVectorFromTopLeftToPixel = getSumOf2Vectors(cameraVectorToBottomPixel, cameraVectorToRightPixel);
                // カメラの中心から特定のピクセルへのベクトル
                const cameraPixelVectorFromPos = getSumOf2Vectors(this.cornerVectorsFromPos.topLeft, cameraVectorFromTopLeftToPixel);
                // 焦点から特定のピクセルへのベクトル
                const cameraPixelVectorFromFocus = getSumOf2Vectors(this.normalVector, cameraPixelVectorFromPos);
                this.viewLayVectorsFromFocus[y][x] = cameraPixelVectorFromFocus;
            }
        }
    }

    /**
     * 焦点からカメラの全ピクセルへの直線を更新するメソッド
     */
    updateViewLayLines() {
        this.viewLayLines = [];
        for (let y = 0; y < CAN_H; y++) {
            this.viewLayLines[y] = [];
            for (let x = 0; x < CAN_W; x++) {
                this.viewLayLines[y][x] = new Line(this.focus, this.viewLayVectorsFromFocus[y][x])
            }
        }
    }

    updateIntersectionFromViewLaysAndFaces() {
        this.intersectionsFromViewLaysAndFaces = [];
        for (let y = 0; y < CAN_H; y++) {
            this.intersectionsFromViewLaysAndFaces[y] = [];
            for (let x = 0; x < CAN_W; x++) {
                this.intersectionsFromViewLaysAndFaces[y][x] = [];
                for (const face of this.importedFaces) {
                    const intersectionFromViewLayAndPlane
                        = getIntersectionFromLineAndPlane(this.viewLayLines[y][x], face.plane);
                    // 交点がカメラの背面にあるときcontinue
                    if (this.plane.isPointInFrontOf(intersectionFromViewLayAndPlane) === false) continue;
                    // 交点が面上にないとき(面からはみ出しているとき)continue
                    if (face.checkPointOnFace(intersectionFromViewLayAndPlane) === false) continue;
                    this.intersectionsFromViewLaysAndFaces[y][x].push({
                        intersection: intersectionFromViewLayAndPlane,
                        length: getLengthFrom2Points(this.focus, intersectionFromViewLayAndPlane),
                        face: face,
                    });
                }
            }
        }
    }

    updateToDrawIntersections() {
        this.toDrawIntersectionsFromViewLaysAndFaces = [];
        for (let y = 0; y < CAN_H; y++) {
            this.toDrawIntersectionsFromViewLaysAndFaces[y] = [];
            for (let x = 0; x < CAN_W; x++) {
                const pixelInfo = this.intersectionsFromViewLaysAndFaces[y][x];
                if (pixelInfo.length) {
                    // lengthの値に注目して昇順にソート
                    pixelInfo.sort((a, b) => {
                        if (a.length < b.length) return -1;
                        if (a.length > b.length) return 1;
                        return 0;
                    });
                    // 一番手前(カメラから一番近い交点)のみを別配列に保存
                    this.toDrawIntersectionsFromViewLaysAndFaces[y][x] = pixelInfo[0];
                }
            }
        }
    }

    drawPixels(ctx) {
        for (let y = 0; y < CAN_H; y++) {
            for (let x = 0; x < CAN_W; x++) {
                const pixelInfo = this.toDrawIntersectionsFromViewLaysAndFaces[y][x];
                if (pixelInfo) {
                    ctx.fillStyle = pixelInfo.face.color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    drawShade(ctx) {
        for (let y = 0; y < CAN_H; y++) {
            for (let x = 0; x < CAN_W; x++) {
                const pixelInfo = this.toDrawIntersectionsFromViewLaysAndFaces[y][x];
                if (pixelInfo) {
                    for (const light of this.importedLights) {
                        const color = light.color;
                        const lightDistance = getLengthFrom2Points(pixelInfo.intersection, light.pos);
                        let brightness = 1 - lightDistance / light.power;
                        brightness = brightness < 0 ? 0 : brightness;
                        ctx.fillStyle = `rgba(0,0,0, ${1 - brightness})`;
                        ctx.fillRect(x, y, 1, 1);
                        ctx.fillStyle = `rgba(${light.color[0]}, ${light.color[1]}, ${light.color[2]}, ${brightness})`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }

    drawShadow(ctx) {
        for (let y = 0; y < CAN_H; y++) {
            for (let x = 0; x < CAN_W; x++) {
                const pixelInfo = this.toDrawIntersectionsFromViewLaysAndFaces[y][x];
                if (pixelInfo) {
                    let isShadow = false;
                    light: for (const light of this.importedLights) {
                        const shadowLayVector = getVectorFrom2Points(pixelInfo.intersection, light.pos);
                        const newStartPoint = pixelInfo.intersection.getClone();
                        // 交点がある平面と交差するのを避けるために少しずらす
                        const tweakVector = shadowLayVector.getClone().changeLength(0.01);
                        newStartPoint.move(tweakVector);
                        const shadowLayEdge = new Edge(newStartPoint, light.pos);
                        for (const face of this.importedFaces) {
                            const intersection = getIntersectionFromLineAndPlane(shadowLayEdge.line, face.plane)
                            if (shadowLayEdge.checkEdgePlaneIntersection(face.plane) === false) continue;
                            if (face.checkPointOnFace(intersection) === false) continue;
                            isShadow = true;
                            break light;
                        }
                    }
                    if (isShadow) {
                        ctx.fillStyle = "#000";
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }

    drawFace() {
        this.updateViewLayVectorsFromFocus();
        this.updateViewLayLines();
        this.updateIntersectionFromViewLaysAndFaces();
        this.updateToDrawIntersections();
        this.drawPixels(con3);
        this.drawShade(con3);
        this.drawShadow(con3);
    }

    importShapes() {
        this.importedVertexes = vertexes.map(vertex => vertex.getClone());
        this.importedEdges = edges.map(edge => edge.getClone());
        this.importedFaces = faces.map(face => face.getClone());
        this.importedLights = lights.map(light => light.getClone());
    }


    /**
     * 点をカメラ平面に投影
     * @param {Vertex} vertex ポイント
     * @returns {Vertex} カメラ平面上の点
     */
    getProjectedVertex(vertex) {
        const rayVector = getVectorFrom2Points(vertex, this.focus);
        const rayLine = new Line(this.focus, rayVector);
        const intersection = getIntersectionFromLineAndPlane(rayLine, this.plane);

        return new Vertex(intersection.x, intersection.y, intersection.z, vertex.i);
    }


    /**
     * カメラ平面の点の座標変換をするメソッド
     * @param {Vertex} vertex 変換前の座標
     * @returns {Vertex} 座標変換後の座標
     */
    getConvertedVertex(vertex) {
        const vectorFromCamPos = getVectorFrom2Points(this.pos, vertex);

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


    getOnScreenVertex(vertex) {
        const projectedVertex = this.getProjectedVertex(vertex);
        const convertedVertex = this.getConvertedVertex(projectedVertex);
        return convertedVertex;
    }


    /**
     * 座標変換した頂点の描画位置を取得するメソッド
     * @param {Vertex} convertedVertex 座標変換済みの頂点
     * @returns {Object} x,y座標のみ
     */
    getToDrawVertex(convertedVertex) {
        const x = (convertedVertex.x - this.pos.x) * expandingRatio + CAN_W / 2;
        const y = (convertedVertex.z - this.pos.z) * -expandingRatio + CAN_H / 2;
        return { x, y };
    }


    draw() {
        const toDrawVertexes = [];
        for (const vertex of this.importedVertexes) {
            if (this.plane.isPointInFrontOf(vertex) === false) continue;
            const onScreenVertex1 = this.getOnScreenVertex(vertex);

            const toDrawVertex = this.getToDrawVertex(onScreenVertex1);
            toDrawVertexes[vertex.i] = toDrawVertex;

            const dx = toDrawVertex.x;
            const dy = toDrawVertex.y;

            drawCircle(con, dx, dy, 2.5);
            con.fillStyle = "#fff";
            con.fillText(onScreenVertex1.i, dx, dy);
        }

        for (const edge of this.importedEdges) {
            edge.setVertexInFrontOfCamera(this.plane);
            if (!this.plane.isPointInFrontOf(edge.vertex1) && !this.plane.isPointInFrontOf(edge.vertex2)) continue;
            const vertex1 = edge.vertex1.getClone();
            const vertex2 = edge.vertex2.getClone();

            const onScreenVertex1 = this.getOnScreenVertex(vertex1);
            const onScreenVertex2 = this.getOnScreenVertex(vertex2);

            const toDrawVertex1 = this.getToDrawVertex(onScreenVertex1);
            const toDrawVertex2 = this.getToDrawVertex(onScreenVertex2);

            const dx1 = toDrawVertex1.x;
            const dy1 = toDrawVertex1.y;
            const dx2 = toDrawVertex2.x;
            const dy2 = toDrawVertex2.y;

            drawLine(con, dx1, dy1, dx2, dy2);
        }


        // can2ExpandingRatio
        const can2ER = 10;
        // can2Half
        const can2Half = can2.width / 2;

        const pdx = this.pos.x * can2ER + can2Half;
        const pdy = this.pos.y * -can2ER + can2Half;
        drawCircle(con2, pdx, pdy, 3);

        const fdx = this.focus.x * can2ER + can2Half;
        const fdy = this.focus.y * -can2ER + can2Half;
        drawCircle(con2, fdx, fdy, 2)
        // drawLine(con2, this.pos)

        for (const key in this.cornerPoints) {
            const cdx = this.cornerPoints[key].x * can2ER + can2Half;
            const cdy = this.cornerPoints[key].y * -can2ER + can2Half;
            drawCircle(con2, cdx, cdy, 1);
        }

        for (const vertex of vertexes) {
            const dx = vertex.x * can2ER + can2Half;
            const dy = vertex.y * -can2ER + can2Half;
            drawCircle(con2, dx, dy, 2.5);
        }

        for (const edge of edges) {
            const dx1 = edge.vertex1.x * can2ER + can2Half;
            const dy1 = edge.vertex1.y * -can2ER + can2Half;
            const dx2 = edge.vertex2.x * can2ER + can2Half;
            const dy2 = edge.vertex2.y * -can2ER + can2Half;
            drawLine(con2, dx1, dy1, dx2, dy2);
        }

        // console.log(this.cornerPoints.topLeft);
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

        const rv = 2;
        if (key["ArrowLeft"]) this.rz -= rv;
        if (key["ArrowRight"]) this.rz += rv;
        if (key["ArrowUp"]) this.rx += rv;
        if (key["ArrowDown"]) this.rx -= rv;
    }


    update() {
        this.move();
        this.updateNormalVector();
        this.updateCornerVectorsFromPos();
        this.updateCornerPoints();
        this.updateOnCameraPlaneVector();
        this.updateFocusPoint();
        this.updatePlane();
        this.importShapes();
        this.drawFace();
        this.draw();
    }
}


const vertexes = [
    new Vertex(0, 3, 0),
    new Vertex(1, 2, 1),
    new Vertex(1, 2, -1),
    new Vertex(-1, 2, -1),
    new Vertex(-1, 2, 1),
    new Vertex(1, 4, 1),
    new Vertex(1, 4, -1),
    new Vertex(-1, 4, -1),
    new Vertex(-1, 4, 1),

    new Vertex(15, 15, -1.5),
    new Vertex(15, -15, -1.5),
    new Vertex(-15, 15, -1.5),
    new Vertex(-15, -15, -1.5),

    new Vertex(-5, 3, -1),
    new Vertex(-5, 5, -1),
    new Vertex(-7, 5, -1),
    new Vertex(-7, 3, -1),
    new Vertex(-5, 3, 1),
    new Vertex(-5, 5, 1),
    new Vertex(-7, 5, 1),
    new Vertex(-7, 3, 1),
];


for (let i = 0; i < vertexes.length; i++) {
    vertexes[i].i = i;
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

    [9, 10],
    [10, 12],
    [12, 11],
    [11, 9],

    [13, 14],
    [14, 15],
    [15, 16],
    [16, 13],
    [13, 17],
    [14, 18],
    [15, 19],
    [16, 20],
    [17, 18],
    [18, 19],
    [19, 20],
    [20, 17],

    // [1, 3],
    // [1, 6],
    // [5, 7],
    // [3, 8],
    // [4, 5],
    // [3, 6],
];

const edges = [];
for (const v of edgeIndexesList) {
    const v1 = v[0];
    const v2 = v[1];
    edges.push(new Edge(vertexes[v1], vertexes[v2]));
}
// console.log(edges);


const faceIndexesList = [
    [1, 2, 3],
    [1, 5, 6],
    [5, 7, 8],
    [3, 4, 8],
    [1, 4, 5],
    [3, 6, 7],

    // [9, 10, 11],
    // [10, 11, 12],
    [9, 11, 12],
    [10, 12, 9],

    [13, 14, 15],
    [13, 15, 16],
    [13, 14, 17],
    [14, 17, 18],
    [14, 15, 18],
    [15, 18, 19],
    [15, 16, 20],
    [15, 19, 20],
    [13, 16, 20],
    [13, 17, 20],
    [17, 18, 19],
    [17, 19, 20],
];

const faceColorsList = [
    "#f00",
    "#0f0",
    "#00f",
    "#ff0",
    "#0ff",
    "#f0f",

    "#bbb",
    "#bbb",

    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
];

const faces = [];
for (let i = 0; i < faceIndexesList.length; i++) {
    const v = faceIndexesList[i];
    const v1 = v[0];
    const v2 = v[1];
    const v3 = v[2];
    faces.push(new Face(vertexes[v1], vertexes[v2], vertexes[v3], faceColorsList[i]));
}

const lights = [
    new Light(new Point(-4, 4, 4), 10, [255, 255, 255])
];


const camera = new Camera(new Point(-2, -1, 0), 0, 0, 3, CAMERA_W, CAMERA_H);

console.log(camera);

function mainLoop() {
    const st = performance.now();

    con.clearRect(0, 0, CAN_W, CAN_H);
    con2.clearRect(0, 0, 100, 100);
    con3.clearRect(0, 0, CAN_W, CAN_H);

    camera.update();

    const et = performance.now();
    con.fillStyle = "#fff";
    con.fillText(`${((et - st) * 100 | 0) / 100}ms`, 10, 10);
}

// mainLoop();

setInterval(mainLoop, 1000 / 30);