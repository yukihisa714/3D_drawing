function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

function abs(number) {
    return Math.abs(number);
}
function sqrt(number) {
    return Math.sqrt(number);
}

function sin(degree) {
    return Math.sin(degreesToRadians(degree));
}
function cos(degree) {
    return Math.cos(degreesToRadians(degree));
}
function tan(degree) {
    return Math.tan(degreesToRadians(degree));
}

function getRandom(min, max) {
    return (max - min) * Math.random() + min;
}


/**
 * 色のクラス
 */
class Color {
    /**
     * コンストラクタ
     * @param {number} r 0~255
     * @param {number} g 0~255
     * @param {number} b 0~255
     * @param {number} a 0~1
     */
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    getClone() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    getString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    /**
     * 色を混ぜるメソッド
     * @param {Color} color 
     * @returns {Color}
     */
    mixColor(color) {
        // 重ねる色のアルファが0のとき何もしない
        if (color.a === 0) {
            return this.getClone();
        }

        const a = color.a + this.a * (1 - color.a);
        this.r = (color.r * color.a + this.r * this.a * (1 - color.a)) / a;
        this.g = (color.g * color.a + this.g * this.a * (1 - color.a)) / a;
        this.b = (color.b * color.a + this.b * this.a * (1 - color.a)) / a;
        this.a = a;

        return this.getClone();
    }

    /**
     * 明るさを乗算し、更に新しいColorクラスを返す
     * @param {number} rate 0~1
     * @returns {Color}
     */
    multiplyBrightness(rate) {
        this.r *= rate;
        this.g *= rate;
        this.b *= rate;

        return this.getClone();
    }
}



/**
 * ポイントのクラス
 */
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

    getClone() {
        return new Point(this.x, this.y, this.z);
    }

    /**
     * 点をベクトルに従って動かすメソッド
     * 自身の要素を変更し、更に新しいPointクラスを返す
     * @param {Vector} vector 移動ベクトル
     * @returns {Point}
     */
    move(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;

        return this.getClone();
    }
}



/**
 * ベクトルのクラス
 */
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

    getClone() {
        return new Vector(this.x, this.y, this.z);
    }

    /**
     * 長さを取得するメソッド
     * @returns {number} 長さ（0以上）
     */
    getLength() {
        return sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    /**
     * 乗算
     * 自身を乗算し、更に新しいVectorクラスを返す
     * @param {number} rate かける数
     * @returns {Vector}
     */
    multiplication(rate) {
        this.x *= rate;
        this.y *= rate;
        this.z *= rate;
        this.length *= abs(rate); // 長さにマイナスはない

        return this.getClone();
    }

    /**
     * 指定した長さに変えるメソッド
     * 自身の長さを更新し、更に新しいVectorクラスを返す
     * @param {number} newLength 新しい長さ
     * @returns {Vector}
     */
    changeLength(newLength) {
        const rate = newLength / this.length;
        this.multiplication(rate);

        return this.getClone();
    }

    /**
     * ベクトルをx軸を中心に回転するメソッド
     * 自身を回転し、更に新しいVectorクラスを返す
     * @param {number} rx x軸を中心にした回転角度
     * @returns {Vector}
     */
    rotateX(rx) {
        const y = cos(rx) * this.y - sin(rx) * this.z;
        const z = sin(rx) * this.y + cos(rx) * this.z;

        this.y = y;
        this.z = z;

        return this.getClone();
    }

    /**
     * ベクトルをz軸を中心に回転するメソッド
     * 自身を回転し、更に新しいVectorクラスを返す
     * @param {number} rz z軸を中心にした回転角度
     * @returns {Vector}
     */
    rotateZ(rz) {
        const x = cos(-rz) * this.x - sin(-rz) * this.y;
        const y = sin(-rz) * this.x + cos(-rz) * this.y;

        this.x = x;
        this.y = y;

        return this.getClone();
    }

    /**
     * ベクトルを回転するメソッド
     * 自身を回転し、更に新しいVectorクラスを返す
     * @param {number} rx x軸を中心にした回転
     * @param {number} rz y軸を中心にした回転
     * @returns {Vector}
     */
    rotate(rx, rz) {
        /*
        X = xcosθ - ysinθ
        Y = xsinθ + ycosθ

        Y = ycosθ - zsinθ
        Z = ysinθ + zcosθ
        */

        this.rotateX(rx);
        this.rotateZ(rz);

        return this.getClone();
    }

}



/**
 * 直線のクラス
 */
class Line {
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

    getClone() {
        return new Line(this.point, this.vector);
    }
}



/**
 * 平面のクラス
 */
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

    getClone() {
        return new Plane(this.a, this.b, this.c, this.d);
    }

    /**
     * 方程式に代入するメソッド
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {number} 代入した結果が0でなければ点(x,y,z)は平面上に無いということ
     */
    substitute(x, y, z) {
        return this.a * x + this.b * y + this.c * z + this.d;
    }

    /**
     * 点が平面の表と裏どちらにあるかを求めるメソッド
     * @param {Point} point 対象の点
     * @returns {boolean} 表または平面上にあればtrue, 裏にあればfalse
     */
    isPointInFrontOf(point) {
        const result = this.substitute(point.x, point.y, point.z);
        return result >= 0;
    }
}



/**
 * 複数のベクトルの和を取得する関数
 * @param {Vector[]} vectorsList ベクトルクラスを格納した配列
 * @returns {Vector}
 */
function getSumOfVectors(vectorsList) {
    const result = new Vector(0, 0, 0);
    for (const v of vectorsList) {
        result.x += v.x;
        result.y += v.y;
        result.z += v.z;
    }
    result.length = result.getLength();

    return result;
}


/**
 * 内積を求める関数
 * (x1, y1, z1)・(x2, y2, z2) = x1*x2 + y1*y2 + z1*z2
 * @param {Vector} vector1 ベクトル1
 * @param {Vector} vector2 ベクトル2
 * @returns {number} 内積
 */
function getInnerProduct(vector1, vector2) {
    return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
}
/**
 * 外積を求める関数
 * (ax, ay, az) ✕ (bx, by, bz) = (ay*bz - az*by, az*bx - ax*bz, ax*by - ay*bx)
 * @param {Vector} vector1 ベクトル1
 * @param {Vector} vector2 ベクトル2
 * @returns {Vector} 外積
 */
function getCrossProduct(vector1, vector2) {
    const a = vector1;
    const b = vector2;
    return new Vector(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    );
}


/**
 * 二点間を結ぶベクトルを取得する関数
 * @param {Point} point1 始点
 * @param {Point} point2 終点
 * @returns {Vector}
 */
function getVectorFrom2Points(point1, point2) {
    return new Vector(point2.x - point1.x, point2.y - point1.y, point2.z - point1.z);
}


/**
 * 二点間の距離を取得する関数
 * @param {Point} point1 始点
 * @param {Point} point2 終点
 * @returns {number} 距離
 */
function getLengthFrom2Points(point1, point2) {
    return getVectorFrom2Points(point1, point2).length;
}



/**
 * 任意のベクトルを二つの基準ベクトルで表すための変数s,tを返す関数
 * p→ = sa→ + tb→
 * 式が平面上でのものなので、a,b,p全てが同一平面状にあることが条件
 * @param {Vector} pVector s,tで表したいベクトル
 * @param {Vector} aVector 基準のベクトル
 * @param {Vector} bVector 基準のベクトル
 * @returns {{s: number, t:number}} {s, t}
 */
function getSTFrom3Vectors(pVector, aVector, bVector) {
    /**
     * a→ = (ax, ay, az)
     * b→ = (bx, by, bz)
     * p→ = (px, py, pz)
     * 
     * p が a,bを含む平面上にあるとき、存在条件はx,yのみでいい
     * 
     * (s>=0, t>=0, s+t<=1)
     * 
     * px = s*ax + t*bx
     * py = s*ay + t*by
     * 
     * px*ay = s*ax*ay + t*bx*ay
     * py*ax = s*ax*ay + t*by*ax
     * 
     * px*ay - py*ax = t*bx*ay - t*by*ax
     * t = (px*ay - py*ax) / (bx*ay - by*ax)
     * s = (px - t*bx) / ax
     * s = (py - t*by) / ay
     */

    const p = pVector;
    const a = aVector;
    const b = bVector;

    /**
     * 二軸で計算すると、分母が0になる場合があるので
     * 3パターン計算すれば必ず0にならない式が作れる
     * 
     * これでもまだ足りないのが分かったので
     * sも2通りの式を作る
     */

    const t1 = (p.x * a.y - p.y * a.x) / (b.x * a.y - b.y * a.x);
    const s11 = (p.x - t1 * b.x) / a.x;
    const s12 = (p.y - t1 * b.y) / a.y;
    const s1 = isNaN(s11) ? s12 : s11;
    const st1 = s1 + t1;
    if (isNaN(st1) === false) return { s: s1, t: t1 };

    const t2 = (p.y * a.z - p.z * a.y) / (b.y * a.z - b.z * a.y);
    const s21 = (p.y - t2 * b.y) / a.y;
    const s22 = (p.z - t2 * b.z) / a.z;
    const s2 = isNaN(s21) ? s22 : s21;
    const st2 = s2 + t2;
    if (isNaN(st2) === false) return { s: s2, t: t2 };

    const t3 = (p.z * a.x - p.x * a.z) / (b.z * a.x - b.x * a.z);
    const s31 = (p.z - t3 * b.z) / a.z;
    const s32 = (p.x - t3 * b.x) / a.x;
    const s3 = isNaN(s31) ? s32 : s31;
    const st3 = s3 + t3;
    if (isNaN(st3) === false) return { s: s3, t: t3 };
}



/**
 * 法線ベクトルとそのベクトルを通る一点から平面のクラスを取得する関数
 * @param {Vector} normalVector 法線ベクトル
 * @param {Point} point ポイント
 * @returns {Plane} 平面
 */
function getPlaneFromVectorAndPoint(normalVector, point) {
    const { x: a, y: b, z: c } = normalVector;

    const { x: x0, y: y0, z: z0 } = point;

    const d = - (a * x0 + b * y0 + c * z0);

    return new Plane(a, b, c, d);
}



/**
 * 直線と平面の交点を求める関数
 * @param {Line} line 直線
 * @param {Plane} plane 平面
 * @returns {Point} 交点
 */
function getIntersectionFromLineAndPlane(line, plane) {
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