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
// キャンバスの設定
const can = document.getElementById("wireframe-camera-view");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";
const con = can.getContext("2d");
// キャンバスの設定
const can2 = document.getElementById("render-camera-view");
can2.width = CAN_W;
can2.height = CAN_H;
can2.style.background = "#def";
const con2 = can2.getContext("2d");

const ctxs = [con, con2];

// キーの状態を連想配列で保存
const key = {};
document.onkeydown = e => {
    key[e.key] = true;
    // console.log(e.key);
}
document.onkeyup = e => {
    key[e.key] = false;
}




const VERTEXES = [
    // 床
    new Vertex(15, 15, -1.5),
    new Vertex(-15, 15, -1.5),
    new Vertex(-15, -15, -1.5),
    new Vertex(15, -15, -1.5),

    // 立方体
    new Vertex(-3, 5, 1),
    new Vertex(-5, 5, 1),
    new Vertex(-5, 3, 1),
    new Vertex(-3, 3, 1),
    new Vertex(-3, 5, -1),
    new Vertex(-5, 5, -1),
    new Vertex(-5, 3, -1),
    new Vertex(-3, 3, -1),

    // 八面体
    new Vertex(4, 3, -0.75),
    new Vertex(3, 4, -0.75),
    new Vertex(2, 3, -0.75),
    new Vertex(3, 2, -0.75),
    new Vertex(3, 3, 0.25),
    new Vertex(3, 3, -1.75),

    // 四面体
    new Vertex(1, 4, -1.5),
    new Vertex(0, 5.73, -1.5),
    new Vertex(-1, 4, -1.5),
    new Vertex(0, 4.57, 0.13),

    // 鏡
    new Vertex(5, 7, -1),
    new Vertex(-1, 9, -1),
    new Vertex(-1, 9, 3),
    new Vertex(5, 7, 3),

    new Vertex(-5, -3, -1),
    new Vertex(-11, -0, -1),
    new Vertex(-11, -0, 3),
    new Vertex(-5, -3, 3),
];
// 連番を付ける
for (let i = 0; i < VERTEXES.length; i++) {
    VERTEXES[i].i = i;
}


const EDGE_INDEXES_LIST = [
    // 床
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],

    // 立方体
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
    [4, 8],
    [5, 9],
    [6, 10],
    [7, 11],

    // 八面体
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 12],
    [12, 16],
    [13, 16],
    [14, 16],
    [15, 16],
    [12, 17],
    [13, 17],
    [14, 17],
    [15, 17],

    // 四面体
    [18, 19],
    [19, 20],
    [20, 18],
    [18, 21],
    [19, 21],
    [20, 21],

    // 鏡
    [22, 23],
    [23, 24],
    [24, 25],
    [25, 22],

    [26, 27],
    [27, 28],
    [28, 29],
    [29, 26],
];

const EDGES = [];
for (const v of EDGE_INDEXES_LIST) {
    const v1 = v[0];
    const v2 = v[1];
    EDGES.push(new Edge(VERTEXES[v1], VERTEXES[v2]));
}
// console.log(EDGES);


const FACE_INDEXES_LIST = [
    // 床
    [0, 1, 2],
    [2, 3, 0],

    // 立方体
    [4, 5, 6],
    [6, 7, 4],
    [8, 9, 10],
    [10, 11, 8],
    [4, 5, 9],
    [9, 8, 4],
    [5, 6, 10],
    [10, 9, 5],
    [6, 7, 11],
    [11, 10, 6],
    [7, 4, 8],
    [8, 11, 7],

    // 八面体
    [12, 13, 16],
    [13, 14, 16],
    [14, 15, 16],
    [15, 12, 16],
    [12, 13, 17],
    [13, 14, 17],
    [14, 15, 17],
    [15, 12, 17],

    // 四面体
    [18, 19, 21],
    [19, 20, 21],
    [20, 18, 21],

    // 鏡
    [22, 23, 24],
    [24, 25, 22],

    [26, 27, 28],
    [28, 29, 26],
];

// [[r, g, b, a], roughness]
const FACE_COLORS_LIST = [
    // 床
    [[150, 255, 150, 1], 1],
    [[150, 255, 150, 1], 1],

    // 立方体
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

    // 八面体
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],
    [[255, 0, 0, 0.3], 1],

    // 四面体
    [[0, 0, 255, 0.3], 1],
    [[0, 0, 255, 0.3], 1],
    [[0, 0, 255, 0.3], 1],

    // 鏡
    [[255, 255, 255, 1], 0],
    [[255, 255, 255, 1], 0],

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
    new Light(new Point(0, 0, 5), 15, [255, 255, 255]),
];





const CAMERA = new Camera(
    new Point(0, 0, 0), // 座標
    0, // x軸回転
    0, // z軸回転
    3, // 焦点距離
    CAMERA_W, // カメラの大きさ
    CAMERA_H,
    CAN_W, // キャンバスの大きさ
    CAN_H,
    expandingRatio, // キャンバスの拡大率
    FPS, // fps
    3, // 移動速度
    50, // 反射制限回数
    key, // キーの状態
    ctxs, // キャンバスの情報
    VERTEXES, // 頂点
    EDGES, // 辺
    FACES, // 面
    LIGHTS, // ライト
);


let frame = 0;

function mainLoop() {
    const st = performance.now();

    // キャンバスの描画をリセット
    con.clearRect(0, 0, CAN_W, CAN_H);
    con2.clearRect(0, 0, CAN_W, CAN_H);

    // カメラの更新
    CAMERA.update();

    const et = performance.now();
    con.fillStyle = "#fff";
    con.fillText(`${((et - st) * 100 | 0) / 100}ms`, 5, 10);

    frame++;
}

setInterval(mainLoop, MSPF);