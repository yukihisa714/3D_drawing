function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

export function abs(number) {
    return Math.abs(number);
}
export function sqrt(number) {
    return Math.sqrt(number);
}

export function sin(degree) {
    return Math.sin(degreesToRadians(degree));
}
export function cos(degree) {
    return Math.cos(degreesToRadians(degree));
}
export function tan(degree) {
    return Math.tan(degreesToRadians(degree));
}

export function max(num1, num2) {
    return Math.max(num1, num2);
}
export function min(num1, num2) {
    return Math.min(num1, num2);
}


/**
 * ポイントのクラス
 */
export class Point {
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

    getClone() {
        return new Point(this.x, this.y, this.z);
    }

    /**
     * 点をベクトルに従って動かすメソッド
     * @param {Vector} vector 移動ベクトル
     */
    move(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
    }
}

/**
 * ベクトルのクラス
 */
export class Vector {
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

        this.updateLength();
    }

    getClone() {
        return new Vector(this.x, this.y, this.z);
    }

    /**
     * 長さを取得するメソッド
     * @returns {number} 長さ
     */
    getLength() {
        return sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    /**
     * 長さを更新するメソッド
     */
    updateLength() {
        this.length = this.getLength();
    }

    /**
     * 乗算
     * @param {number} rate かける数
     */
    multiplication(rate) {
        this.x *= rate;
        this.y *= rate;
        this.z *= rate;
        this.length *= rate;
    }

    /**
     * 指定した長さに変えるメソッド
     * @param {number} newLength 新しい長さ
     */
    changeLength(newLength) {
        const rate = newLength / this.length;
        this.length = newLength;
        this.multiplication(rate);
    }

    rotate(rx, rz) {
        /*
        X = xcosθ - ysinθ
        Y = xsinθ + ycosθ

        Y = ycosθ - zsinθ
        Z = ysinθ + zcosθ
        */

        const x1 = this.x;
        const y1 = cos(rx) * this.y - sin(rx) * this.z;
        const z1 = sin(rx) * this.y + cos(rx) * this.z;

        const x2 = cos(rz) * x1 - sin(rz) * y1;
        const y2 = sin(rz) * x1 + cos(rz) * y1;
        const z2 = z1;

        this.x = -x2;
        this.y = y2;
        this.z = z2;

    }

}

/**
 * 直線のクラス
 */
export class Line {
    /**
     * 直線の方程式
     * P(x0, y0, z0)を通り、
     * V(l, m, n)に平行
     * 媒介変数tを利用
     * x = x0 + tl
     * y = y0 + tm
     * z = z0 + tn
     * @param {Point} point 通る点
     * @param {Vector} vector 向きベクトル
     */
    constructor(point, vector) {
        this.point = point;
        this.vector = vector;

        this.x0 = this.point.x;
        this.y0 = this.point.y;
        this.z0 = this.point.z;

        this.l = this.vector.x;
        this.m = this.vector.y;
        this.n = this.vector.z;
    }
}

export class Plane {
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

    /**
     * 方程式に代入するメソッド
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns 
     */
    substitute(x, y, z) {
        return this.a * x + this.b * y + this.c * z + this.d;
    }

    /**
     * 点が平面の表と裏どちらにあるかを求めるメソッド
     * @param {Point} point 対象の点
     * @returns {Boolean} 表または平面上にあればtrue, 裏にあればfalse
     */
    isPointInFrontOf(point) {
        const result = this.substitute(point.x, point.y, point.z);
        return result >= 0;
    }
}


/**
 * 内積を求める関数
 * (x1, y1, z1)・(x2, y2, z2) = x1*x2 + y1*y2 + z1*z2
 * @param {Vector} vector1 ベクトル1
 * @param {Vector} vector2 ベクトル2
 * @returns {number} 内積
 */
export function getInnerProduct(vector1, vector2) {
    return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
}

/**
 * 外積を求める関数
 * (ax, ay, az) ✕ (bx, by, bz) = (ay*bz - az*by, az*bx - ax*bz, ax*by - ay*bx)
 * @param {Vector} vector1 ベクトル1
 * @param {Vector} vector2 ベクトル2
 * @returns {Vector} 外積
 */
export function getCrossProduct(vector1, vector2) {
    const a = vector1;
    const b = vector2;
    return new Vector(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    );
}


export function getNormalVectorFromTwoVectors(vector1, vector2) {

}

/**
 * 法線ベクトルとそのベクトルを通る一点から平面のクラスを取得する関数
 * @param {Vector} normalVector 法線ベクトル
 * @param {Point} point ポイント
 */
export function getPlaneFromVectorAndPoint(normalVector, point) {
    const { x: a, y: b, z: c } = normalVector;

    const { x: x0, y: y0, z: z0 } = point;

    const d = - (a * x0 + b * y0 + c * z0);

    return new Plane(a, b, c, d);
}


/**
 * 直線と平面の交点を求める関数
 * @param {Line} line 直線
 * @param {Plane} plane 平面
 */
export function getIntersectionFromLineAndPlane(line, plane) {
    /*
    x = x0 + tl
    y = y0 + tm
    z = z0 + tn

    ax + by + cz + d = 0

    a(x0 + tl) + b(y0 + tm) + c(z0 + tn) + d = 0
    t(al + bm + cn) + ax0 + by0 + cz0 + d = 0
    t = -(ax0 + by0 + cz0 + d) / (al + bm + cn)
    */

    const { a, b, c, d } = plane;

    const { x0, y0, z0 } = line;

    const { l, m, n } = line;

    const t = -(a * x0 + b * y0 + c * z0 + d) / (a * l + b * m + c * n);

    const x = x0 + t * l;
    const y = y0 + t * m;
    const z = z0 + t * n;

    return new Point(x, y, z);
}

