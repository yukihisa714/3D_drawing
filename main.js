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
    console.log(e.key);
}
document.onkeyup = (e) => {
    key[e.key] = false;
}

function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

function sin(degree) {
    return Math.sin(degreesToRadians(degree));
}
function cos(degree) {
    return Math.cos(degreesToRadians(degree));
}

function drawCircle(x, y, r) {
    con.beginPath();
    con.arc(x, y, r, 0, 2 * Math.PI);
    con.fillStyle = "#000";
    con.fill();
}

/**
 * 
 * @param {Line} line 
 * @param {Plane} plane 
 */
function getIntersectionOfLineAndPlane(line, plane) {
    /*
    x = x0 + tl
    y = y0 + tm
    z = z0 + tn

    ax + by + cz + d = 0

    a(x0 + tl) + b(y0 + tm) + c(z0 + tn) + d = 0
    t(al + bm + cn) + ax0 + by0 + cz0 + d = 0
    t = -(ax0 + by0 + cz0 + d) / (al + bm + cn)
    */

    const a = plane.a;
    const b = plane.b;
    const c = plane.c;
    const d = plane.d;

    const x0 = line.x0;
    const y0 = line.y0;
    const z0 = line.z0;

    const l = line.l;
    const m = line.m;
    const n = line.n;

    const t = -(a * x0 + b * y0 + c * z0 + d) / (a * l + b * m + c * n);

    const x = x0 + t * l;
    const y = y0 + t * m;
    const z = z0 + t * n;

    return new Point(x, y, z);
}



class Point {
    /**
     * コンストラクタ
     * @param {number} x 座標
     * @param {number} y 座標
     * @param {number} z 座標
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Vector {
    /**
     * コンストラクタ
     * @param {number} x 要素
     * @param {number} y 要素
     * @param {number} z 要素
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.length = this.getLength();
    }

    /**
     * 長さを取得するメソッド
     * @returns {number} 長さ
     */
    getLength() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    /**
     * 長さを変えるメソッド
     * @param {number} newLength 新しい長さ
     */
    changeLength(newLength) {
        const rate = newLength / this.length;
        this.length = newLength;
        this.x *= rate;
        this.y *= rate;
        this.z *= rate;
    }

    /**
     * 内積を求めるメソッド
     * @param {Vector} vector2 もう一つのベクトル
     * @returns {number} 内積
     */
    getInnerProduct(vector2) {
        return this.x * vector2.x + this.y * vector2.y + this.z * vector2.z;
    }
}


class Line {
    /**
     * 直線の方程式
     * P(x0, y0, z0)を通り、
     * V(l, m, n)に平行
     * x = x0 + tl
     * y = y0 + tm
     * z = z0 + tn
     * @param {Point} point 通る点
     * @param {Vector} vector 向きベクトル
     */
    constructor(point, vector) {
        this.x0 = point.x;
        this.y0 = point.y;
        this.z0 = point.z;
        this.l = vector.x;
        this.m = vector.y;
        this.n = vector.z;
    }
}

class Plane {
    /**
     * 平面の方程式
     * ax + by + cz + d = 0
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @param {number} d 
     */
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
}


class Camera {
    /**
     * コンストラクタ
     * @param {Point} pos カメラの位置
     * @param {number} rx x軸回転の角度
     * @param {number} rz z軸回転の角度
     */
    constructor(pos, rx, rz) {
        this.pos = pos;
        this.rx = rx;
        this.rz = rz;

        this.update();
    }

    updateNormalVector() {
        const z = sin(this.rx);
        const y = cos(this.rz) * cos(this.rx);
        const x = sin(this.rz) * cos(this.rx);

        this.normalVector = new Vector(x, y, z);
    }

    updatePlane() {
        const x0 = this.pos.x + this.normalVector.x;
        const y0 = this.pos.y + this.normalVector.y;
        const z0 = this.pos.z + this.normalVector.z;

        const a = this.normalVector.x;
        const b = this.normalVector.y;
        const c = this.normalVector.z;
        const d = - (a * x0 + b * y0 + c * z0);

        this.plane = new Plane(a, b, c, d);
    }

    /**
     * 
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
     * 
     * @param {Array} points ポイントリスト
     */
    projectAllPoints(points) {
        this.projectedPoints = [];
        for (const point of points) {
            this.projectedPoints.push(this.getProjectedPoint(point));
        }
    }

    /**
     * 
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
        let x = vectorFromCamPos.x;
        let y = vectorFromCamPos.y;
        let z = vectorFromCamPos.z;
        // console.log(x, y);

        // let x1 = cos(-this.rz) * (x - this.pos.x) - sin(-this.rz) * (y - this.pos.y) + this.pos.x;
        // let y1 = sin(-this.rz) * (x - this.pos.x) + cos(-this.rz) * (y - this.pos.y) + this.pos.y;
        // let z1 = z;

        // let x2 = x1;
        // let y2 = cos(-this.rx) * (y1 - this.pos.y) - sin(-this.rx) * (z1 - this.pos.z) + this.pos.y;
        // let z2 = sin(-this.rx) * (y1 - this.pos.y) + cos(-this.rx) * (z1 - this.pos.z) + this.pos.z;

        let x1 = cos(this.rz) * x - sin(this.rz) * y;
        let y1 = sin(this.rz) * x + cos(this.rz) * y;
        let z1 = z;
        // console.log(x1, y1);

        let x2 = x1;
        let y2 = cos(-this.rx) * y1 - sin(-this.rx) * z1;
        let z2 = sin(-this.rx) * y1 + cos(-this.rx) * z1;
        // console.log(x2, y2);

        let x3 = x2 + this.pos.x;
        let y3 = y2 + this.pos.y;
        let z3 = z2 + this.pos.z;
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
        }
    }

    move() {
        const v = 0.1;
        if (key["a"]) this.pos.x -= v;
        if (key["d"]) this.pos.x += v;
        if (key["w"]) this.pos.y += v;
        if (key["s"]) this.pos.y -= v;

        if (key[" "]) this.pos.z += v;
        if (key["Shift"]) this.pos.z -= v;

        const rv = 1;
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

const camera = new Camera(new Point(0, 0, 0), 0, 0);

console.log(camera);

function mainLoop() {
    con.clearRect(0, 0, CAN_W, CAN_H);

    camera.update();
}

setInterval(mainLoop, 1000 / 60);