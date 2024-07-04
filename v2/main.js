import { Color, Point } from "./math.js";
import { Edge, Face, Light, Vertex } from "./shape.js";
import { Camera } from "./camera.js";



// FPS
const FPS = 30;
// 1フレームのミリ秒
const MSPF = 1000 / 30;


// 空間内におけるカメラの大きさ（メートル）
const CAMERA_W = 3.2;
const CAMERA_H = 1.8;

const expandingRatio = 50;

// キャンバスサイズ（ピクセル）
const CAN_W = CAMERA_W * expandingRatio;
const CAN_H = CAMERA_H * expandingRatio;

const can = document.getElementById("wireframe-camera-view");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";
const con = can.getContext("2d");

const can2 = document.getElementById("render-camera-view");
can2.width = CAN_W;
can2.height = CAN_H;
can2.style.background = "#888";
const con2 = can2.getContext("2d");

const ctxs = [con, con2];


const key = {};
document.onkeydown = e => {
    key[e.key] = true;
    // console.log(e.key);
}
document.onkeyup = e => {
    key[e.key] = false;
}




const VERTEXES = [
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

    new Vertex(-3, 10, -1),
    new Vertex(-1, 10, 3),
    new Vertex(1, 10, -1),

    new Vertex(-1.5, 3, 0),
    new Vertex(0, 3, 2),
    new Vertex(2, 1.5, -0.5),
];

for (let i = 0; i < VERTEXES.length; i++) {
    VERTEXES[i].i = i;
}


const EDGE_INDEXES_LIST = [
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

    [24, 25],
    [25, 26],
    [26, 24],
];

const EDGES = [];
for (const v of EDGE_INDEXES_LIST) {
    const v1 = v[0];
    const v2 = v[1];
    EDGES.push(new Edge(VERTEXES[v1], VERTEXES[v2]));
}
// console.log(EDGES);


const FACE_INDEXES_LIST = [
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

    [21, 22, 23],

    [24, 25, 26],
];

const FACE_COLORS_LIST = [
    [[255, 0, 0, 1], 1],
    [[0, 255, 0, 1], 1],
    [[0, 0, 255, 1], 1],
    [[255, 255, 0, 0.5], 1],
    [[0, 255, 255, 1], 1],
    [[255, 0, 255, 1], 1],

    [[191, 191, 191, 1], 1],
    [[191, 191, 191, 1], 1],

    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],
    [[255, 255, 255, 1], 1],

    [[255, 255, 255, 1], 0],

    [[255, 255, 255, 1], 0],
];

const FACES = [];
for (let i = 0; i < FACE_INDEXES_LIST.length; i++) {
    const v = FACE_INDEXES_LIST[i];
    const v1 = v[0];
    const v2 = v[1];
    const v3 = v[2];

    const color = new Color(...FACE_COLORS_LIST[i][0]);
    FACES.push(new Face(VERTEXES[v1], VERTEXES[v2], VERTEXES[v3], color, FACE_COLORS_LIST[i][1]));
}



const LIGHTS = [
    new Light(new Point(-4, 4, 4), 10, [255, 255, 255]),
    new Light(new Point(6, 5, 3), 5, [255, 255, 255]),
];





const CAMERA = new Camera(
    new Point(-2, -1, 0),
    0,
    0,
    3,
    CAMERA_W,
    CAMERA_H,
    CAN_W,
    CAN_H,
    expandingRatio,
    FPS,
    3,
    key,
    ctxs,
    VERTEXES,
    EDGES,
    FACES,
    LIGHTS,
);


let frame = 0;
const zeroFrameTime = performance.now();

function mainLoop() {
    const st = performance.now();

    con.clearRect(0, 0, CAN_W, CAN_H);
    con2.clearRect(0, 0, CAN_W, CAN_H);

    CAMERA.update();

    const et = performance.now();
    con.fillStyle = "#fff";
    con.fillText(`${((et - st) * 100 | 0) / 100}ms`, 5, 10);

    frame++;

    // con.fillText(`${((performance.now() - zeroFrameTime) / frame * 100 | 0) / 100}ms`, 5, CAN_H - 2);
}

// mainLoop();

setInterval(mainLoop, MSPF);