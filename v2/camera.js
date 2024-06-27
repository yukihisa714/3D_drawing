import { Point, Vector, cos, getIntersectionFromLineAndPlane, getPlaneFromVectorAndPoint, getSumOfVectors, getVectorFrom2Points, sin } from "./math.js";
import { Face, HalfLine, Vertex, checkDoesIntersectEdgeOrHalfLineAndFace } from "./shape.js";



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
     * @param {number} canW キャンバスの横幅
     * @param {number} canH キャンバスの縦幅
     * @param {number} fps 
     * @param {number} speed メートル/秒
     * @param {Array} key キーの状態（main.jsから参照渡し）
     */
    constructor(pos, rx, rz, focalLength, width, height, canW, canH, fps, speed, key) {
        this.pos = pos;
        this.rx = rx;
        this.rz = rz;
        this.focalLength = focalLength;
        this.width = width;
        this.height = height;
        this.canW = canW;
        this.canH = canH;
        this.fps = fps;
        this.speed = speed;
        this.key = key;

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
            toRight: this.onCameraPlane1pxVector.toRight.multiplication(1 / this.canW),
            toBottom: this.onCameraPlane1pxVector.toBottom.multiplication(1 / this.canH),
        };
    }

    /**
     * 焦点から特定のピクセルへの半直線を取得するメソッド
     * @param {number} x キャンバス上の座標
     * @param {number} y キャンバス上の座標
     * @returns {HalfLine}
     */
    getCameraViewLayHalfLine(x, y) {
        // カメラの左上から右と下へのベクトル
        const cameraVectorToBottomPixel = this.onCameraPlane1pxVector.toBottom.getClone().multiplication(y);
        const cameraVectorToRightPixel = this.onCameraPlane1pxVector.toRight.getClone().multiplication(x);
        // 焦点から特定のピクセルへのベクトル
        const cameraPixelVectorFromFocus = getSumOfVectors([
            cameraVectorToBottomPixel,
            cameraVectorToRightPixel, // カメラの左上から特定のピクセルへのベクトル
            this.cornerVectorsFromPos.topLeft, // カメラの中心から特定のピクセルへのベクトル
            this.normalVector, // 焦点から特定のピクセルへのベクトル
        ]);
        // 焦点から特定のピクセルへの半直線
        const viewLayHalfLine = new HalfLine(this.focus, cameraPixelVectorFromFocus);

        return viewLayHalfLine;
    }

    /**
     * 点をカメラ平面に投影
     * @param {Vertex} vertex 
     * @returns {Vertex|null} 点が
     */
    getProjectedVertex(vertex) {
        // 点がカメラ平面の後ろにあったらreturn
        if (this.plane.isPointInFrontOf(vertex.point) === false) {
            return null;
        }
        const rayVector = getVectorFrom2Points(this.focus, vertex.point);
        const rayHalfLine = new HalfLine(this.focus, rayVector);
        const intersection = rayHalfLine.isOnIntersectionWithPlane(this.plane);
        const intersectionVertex = new Vertex(intersection.x, intersection.y, intersection.z, vertex.i);

        // カメラの面をおいてその範囲も検証
        const cameraFace1 = new Face(this.cornerPoints.topLeft, this.cornerPoints.bottomLeft, this.cornerPoints.topRight);
        const cameraFace2 = new Face(this.cornerPoints.bottomRight, this.cornerPoints.topRight, this.cornerPoints.bottomLeft);
        // 交点がcanvas外だったらreturn null
        if (cameraFace1.isPointOnFace(intersection)) {
            return intersectionVertex;
        }
        if (cameraFace2.isPointOnFace(intersection)) {
            return intersectionVertex;
        }

        return null;
    }

    /**
     * カメラ平面の点の座標を変換（posを中心に回転し正規化）するメソッド
     * @param {Vertex} vertex 返還前の座標
     * @returns {Vertex} 変換後の座標
     */
    getConvertedVertex(vertex) {
        const vectorFromCamPos = getVectorFrom2Points(this.pos, vertex.point);

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


    /**
     * 頂点をカメラ平面に投影、座標変換
     * @param {Vertex} vertex 
     * @returns {Vertex|null}
     */
    getOnScreenVertex(vertex) {
        const projectedVertex = this.getProjectedVertex(vertex);
        if (projectedVertex === null) {
            return null;
        }
        const convertedVertex = this.getConvertedVertex(projectedVertex);

        return convertedVertex;
    }


    /**
     * 座標変換した頂点の描画位置を取得するメソッド
     * @param {Vertex} convertedVertex 座標変換済みの頂点
     * @returns {{x: number, y: number}} x,y座標のみ
     */
    getToDrawVertex(convertedVertex) {
        const x = (convertedVertex.x - this.pos.x) * expandingRatio + this.canW / 2;
        const y = (convertedVertex.z - this.pos.z) * -expandingRatio + this.canH / 2;
        return { x, y };
    }

}