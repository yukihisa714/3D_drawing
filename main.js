import { Line, Point, Vector, cos, getIntersectionOfLineAndPlane, getPlaneFromVectorAndPoint, sin } from "./math.js";

const CAN_W = 250;
const CAN_H = 250;

const can = document.getElementById("canvas");
can.width = CAN_W;
can.height = CAN_H;
can.style.background = "#888";

const con = can.getContext("2d");

const key = {};
document.onkeydown = (e) => {
    key[e.key] = true;
    // console.log(e.key);
}
document.onkeyup = (e) => {
    key[e.key] = false;
}


function drawCircle(x, y, r) {
    con.beginPath();
    con.arc(x, y, r, 0, 2 * Math.PI);
    con.fillStyle = "#000";
    con.fill();
}


class Camera {
    /**
     * コンストラクタ
     * @param {Point} pos カメラの位置
     * @param {number} rx x軸回転の角度
     * @param {number} rz z軸回転の角度
     * @param {number} focalLength 焦点距離
     */
    constructor(pos, rx, rz, focalLength) {
        this.pos = pos;
        this.rx = rx;
        this.rz = rz;
        this.focalLength = focalLength;

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

    /**
     * 点をカメラ平面に投影
     * @param {Point} point ポイント
     * @returns {Point} カメラ平面上の点
     */
    getProjectedPoint(point) {
        const rayVector = new Vector(this.pos.x - point.x, this.pos.y - point.y, this.pos.z - point.z);
        const ray = new Line(this.pos, rayVector);
        const intersection = getIntersectionOfLineAndPlane(ray, this.plane);

        return intersection;
    }

    /**
     * すべての点を投影
     * @param {Array} points ポイントリスト
     */
    projectAllPoints(points) {
        this.projectedPoints = [];
        for (const point of points) {
            this.projectedPoints.push(this.getProjectedPoint(point));
        }
    }

    /**
     * カメラ平面の点を
     * @param {Point} point 変換前の座標
     */
    getConvertedPoint(point) {
        const vectorFromCamPos = new Vector(point.x - this.pos.x, point.y - this.pos.y, point.z - this.pos.z);

        /*
        X = xcosθ - ysinθ
        Y = xsinθ + ycosθ

        Y = ycosθ - zsinθ
        Z = ysinθ + zcosθ
        */

        const { x, y, z } = vectorFromCamPos;
        // console.log(x, y);

        const x1 = cos(this.rz) * x - sin(this.rz) * y;
        const y1 = sin(this.rz) * x + cos(this.rz) * y;
        const z1 = z;
        // console.log(x1, y1);

        const x2 = x1;
        const y2 = cos(-this.rx) * y1 - sin(-this.rx) * z1;
        const z2 = sin(-this.rx) * y1 + cos(-this.rx) * z1;
        // console.log(x2, y2);

        const x3 = x2 + this.pos.x;
        const y3 = y2 + this.pos.y;
        const z3 = z2 + this.pos.z;
        // console.log(x3, y3);

        return new Point(x3, y3, z3);
    }


    convertAllPoints(points) {
        this.convertedPoints = [];
        for (const point of points) {
            this.convertedPoints.push(this.getConvertedPoint(point));
        }
    }

    draw() {
        for (const point of this.convertedPoints) {
            drawCircle((point.x - this.pos.x) * 50 + CAN_W / 2, (point.z - this.pos.z) * -50 + CAN_H / 2, 5);
            con.fillStyle = "#fff";
            con.fillText(
                this.convertedPoints.indexOf(point),
                (point.x - this.pos.x) * 50 + CAN_W / 2,
                (point.z - this.pos.z) * -50 + CAN_H / 2
            );
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
        this.projectAllPoints(pointsList);
        this.convertAllPoints(this.projectedPoints);
        this.draw();
    }
}


const pointsList = [
    new Point(0, 3, 0),
    new Point(1, 2, 1),
    new Point(1, 2, -1),
    new Point(-1, 2, -1),
    new Point(-1, 2, 1),
    new Point(1, 4, 1),
    new Point(1, 4, -1),
    new Point(-1, 4, -1),
    new Point(-1, 4, 1),
];

const camera = new Camera(new Point(0, 0, 0), 0, 0, 3);

console.log(camera);

function mainLoop() {
    con.clearRect(0, 0, CAN_W, CAN_H);

    camera.update();
}

setInterval(mainLoop, 1000 / 60);