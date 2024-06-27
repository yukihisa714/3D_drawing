


// FPS
const FPS = 30;
const MSPF = 1000 / 30;


// 空間内におけるカメラの大きさ（メートル）
const CAMERA_W = 3.2;
const CAMERA_H = 1.8;

const expandingRatio = 50;

// キャンバスサイズ（ピクセル）
const CAN_W = CAMERA_W * expandingRatio;
const CAN_H = CAMERA_H * expandingRatio;

const can = document.getElementById("camera-view");
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


