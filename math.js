function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

export function sin(degree) {
    return Math.sin(degreesToRadians(degree));
}
export function cos(degree) {
    return Math.cos(degreesToRadians(degree));
}


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
     * 乗算
     * @param {number} rate かける数
     */
    multiplication(rate) {
        this.x *= rate;
        this.y *= rate;
        this.z *= rate;
    }

    /**
     * 長さを変えるメソッド
     * @param {number} newLength 新しい長さ
     */
    changeLength(newLength) {
        const rate = newLength / this.length;
        this.length = newLength;
        this.multiplication(rate);
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

export class Line {
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
        return this.a * x + this.b * y + this.c * z;
    }

    /**
     * 点が平面の表と裏どちらにあるかを求めるメソッド
     * @param {Point} point 対象の点
     * @returns {Boolean} 表または平面上にあればtrue, 裏にあればfalse
     */
    isPointInFrontOf(point) {
        const result = this.substitute(point.x, point.y, point.z);
        if (result >= 0) return true;
        else return false;
    }
}

/**
 * 法線ベクトルとそのベクトルを通る一点から平面のクラスを取得する関数
 * @param {Vector} normalVector 法線ベクトル
 * @param {Point} point ポイント
 */
export function getPlaneFromVectorAndPoint(normalVector, point) {
    const { x: a, y: b, z: c } = normalVector;

    const x0 = point.x + a;
    const y0 = point.y + b;
    const z0 = point.z + c;

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

