import { Color, Point, Vector, cos, getInnerProduct, getPlaneFromVectorAndPoint, getSumOfVectors, getVectorFrom2Points, sin } from "./math.js";
import { Edge, Face, HalfLine, Light, Vertex, getEdgeFromPoints, getIntersectionsEdgeOrHalfLineAndFaces } from "./shape.js";
import { drawCircle, drawLine } from "./context.js";



/**
 * カメラのクラス
 */
export class Camera {
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
     * @param {number} expandingRatio キャンバスの拡大率
     * @param {number} fps 
     * @param {number} speed メートル/秒
     * @param {{}} key キーの状態（main.jsから参照渡し）
     * @param {any[]} ctxs コンテクストの配列
     * @param {Vertex[]} vertexes インポートする頂点の配列
     * @param {Edge[]} edges インポートする辺の配列
     * @param {Face[]} faces インポートする面の配列
     * @param {Light[]} lights インポートするライトの配列
     */
    constructor(pos, rx, rz, focalLength, width, height, canW, canH, expandingRatio, fps, speed, reflectionLimit, key, ctxs, vertexes, edges, faces, lights) {
        this.pos = pos;
        this.rx = rx;
        this.rz = rz;
        this.focalLength = focalLength;
        this.width = width;
        this.height = height;
        this.canW = canW;
        this.canH = canH;
        this.expandingRatio = expandingRatio;
        this.fps = fps;
        this.speed = speed;
        this.reflectionLimit = reflectionLimit;
        this.key = key;

        this.ctxs = ctxs;
        this.con = this.ctxs[0];
        this.con2 = this.ctxs[1];

        this.vertexes = vertexes;
        this.edges = edges;
        this.faces = faces;
        this.lights = lights;

        this.reflectionCountList = [];
        for (let y = 0; y < canH; y++) {
            this.reflectionCountList[y] = [];
            for (let x = 0; x < canW; x++) {
                this.reflectionCountList[y][x] = 0;
            }
        }

        this.importShapes();
        this.update();
    }

    importShapes() {
        this.importedVertexes = this.vertexes.map(vertex => vertex.getClone());
        this.importedEdges = this.edges.map(edge => edge.getClone());
        this.importedFaces = this.faces.map(face => face.getClone());
        this.importedLights = this.lights.map(light => light.getClone());
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
            toRight: this.onCameraPlaneVector.toRight.multiplication(1 / this.canW),
            toBottom: this.onCameraPlaneVector.toBottom.multiplication(1 / this.canH),
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
        if (this.plane.isPointInFrontOf(vertex.point) === false) return null;
        const rayVector = getVectorFrom2Points(this.focus, vertex.point);
        const rayHalfLine = new HalfLine(this.focus, rayVector);
        const intersection = rayHalfLine.getIntersectionWithPlane(this.plane);
        const intersectionVertex = new Vertex(intersection.x, intersection.y, intersection.z, vertex.i);

        return intersectionVertex;
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
     * 頂点の描画位置を取得するメソッド
     * @param {Vertex} vertex 頂点
     * @returns {{x: number, y: number}|null} x,y座標のみ
     */
    getToDrawVertex(vertex) {
        const projectedVertex = this.getProjectedVertex(vertex);
        if (projectedVertex === null) return null;
        const convertedVertex = this.getConvertedVertex(projectedVertex);

        const x = (convertedVertex.x - this.pos.x) * this.expandingRatio + this.canW / 2;
        const y = (convertedVertex.z - this.pos.z) * -this.expandingRatio + this.canH / 2;

        return { x, y };
    }

    drawVertexes() {
        for (const vertex of this.importedVertexes) {
            const toDrawVertex = this.getToDrawVertex(vertex);
            if (toDrawVertex === null) continue;

            const { x: dx, y: dy } = toDrawVertex;

            drawCircle(this.con, dx, dy, 2.5);
            this.con.fillStyle = "#fff";
            this.con.fillText(vertex.i, dx, dy);
        }
    }

    drawEdges() {
        for (const edge of this.importedEdges) {
            // カメラ平面と交わる辺は、裏側の頂点をカメラ平面上に修正
            const convertedEdge = edge.getClone().setVertexInFrontOfCamera(this.plane);
            // 頂点を座標変換
            const toDrawVertex1 = this.getToDrawVertex(convertedEdge.vertex1);
            const toDrawVertex2 = this.getToDrawVertex(convertedEdge.vertex2);
            // toDrawVertexがnull つまり 頂点が両方カメラ平面の裏にあるときcontinue
            if (toDrawVertex1 === null) continue;

            const dx1 = toDrawVertex1.x;
            const dy1 = toDrawVertex1.y;
            const dx2 = toDrawVertex2.x;
            const dy2 = toDrawVertex2.y;

            drawLine(this.con, dx1, dy1, dx2, dy2);
        }
    }

    /**
     * 点における明るさを取得する
     * @param {Point} point 
     * @returns {number}
     */
    getBrightnessOfPoint(point) {
        let allBrightness = 0;
        for (const light of this.importedLights) {
            // ライトまでの辺
            const edgeFromIntersectionToLight = getEdgeFromPoints(point, light.pos);
            // ライトまでの障害物
            const obstacleIntersections = getIntersectionsEdgeOrHalfLineAndFaces(edgeFromIntersectionToLight, this.importedFaces);
            // ライトからの距離での明るさ
            let brightness = light.getBrightnessFromPoint(point);
            // 障害物による明るさ
            for (const intersection of obstacleIntersections) {
                brightness *= (1 - intersection.face.color.a * 0.8);
            }
            allBrightness += brightness;
        }
        if (allBrightness > 1) {
            allBrightness = 1;
        }
        return allBrightness;
    }

    /**
     * 視点の半直線から色を取得する
     * @param {halfLine} halfLine 
     * @param {number} x pixel
     * @param {number} y pixel
     * @returns {Color}
     */
    getColorFromViewLayHalfLine(halfLine, x, y) {
        // もとの色（黒色透明）
        const color = new Color(0, 0, 0, 0.1);

        // 半直線と面の交点（距離の近い順にソートされている）
        const intersectionsWithViewLayAndFaces = getIntersectionsEdgeOrHalfLineAndFaces(halfLine, this.importedFaces);
        // どの面とも交わらなければreturn
        if (intersectionsWithViewLayAndFaces.length === 0) {
            return color;
        }
        // 交点を順に検査し、不透明度が1の面の交点より遠くの交点の要素を削除
        let i = 0;
        while (true) {
            if (intersectionsWithViewLayAndFaces[i].face.color.a === 1) {
                break;
            }
            if (intersectionsWithViewLayAndFaces.length === i + 1) {
                break;
            }
            i++;
        }
        intersectionsWithViewLayAndFaces.length = i + 1;

        // 一番奥の面が不透明のとき
        if (intersectionsWithViewLayAndFaces[i].face.color.a === 1) {
            // 配列の最後（唯一の不透明度1）の交点と面
            const opaqueIntersection = intersectionsWithViewLayAndFaces[i].intersection.getClone();
            const opaqueFace = intersectionsWithViewLayAndFaces[i].face.getClone();
            // 交点を含む面がライトまでの障害物にならないようにカメラ方向に少し補正
            const fixVectorLength = -0.0001 * getInnerProduct(opaqueFace.normalVector, halfLine.vector);
            const fixVector = opaqueFace.normalVector.getClone().changeLength(fixVectorLength);
            opaqueIntersection.move(fixVector);

            // 鏡面のとき
            if (opaqueFace.roughness !== 1) {
                // 光線のベクトルに鏡面の法線ベクトルを合成して反射ベクトルを取得
                const toAddVectorLength = -2 * getInnerProduct(opaqueFace.normalVector, halfLine.vector);
                const toAddVector = opaqueFace.normalVector.getClone().changeLength(toAddVectorLength);
                const reflectionVector = getSumOfVectors([halfLine.vector, toAddVector]);
                // 反射光線の半直線
                const reflectionHalfLine = new HalfLine(opaqueIntersection, reflectionVector);

                // 反射回数を上回ったらreturn
                this.reflectionCountList[y][x]++;
                if (this.reflectionCountList[y][x] > this.reflectionLimit) {
                    return color;
                }
                // 反射先の色
                // ※再帰関数
                const reflectionColor = this.getColorFromViewLayHalfLine(reflectionHalfLine, x, y);

                color.mixColor(reflectionColor);
            }
            // 鏡面でないとき
            else {
                // 点における明るさ
                const brightness = this.getBrightnessOfPoint(opaqueIntersection);

                // 一番奥の面を重ねる
                color.mixColor(opaqueFace.color);
                color.multiplyBrightness(brightness);
            }

            // 奥の面を処理したので減らしておく
            i--;
        }

        // 半透明の面を重ねる
        for (let k = i; k >= 0; k--) {
            color.mixColor(intersectionsWithViewLayAndFaces[k].face.color);
        }

        return color;
    }

    drawFaces() {
        for (let y = 0; y < this.canH; y++) {
            for (let x = 0; x < this.canW; x++) {

                this.reflectionCountList[y][x] = 0;

                // 焦点から特定のピクセルへの半直線
                const viewLayHalfLine = this.getCameraViewLayHalfLine(x, y);

                const color = this.getColorFromViewLayHalfLine(viewLayHalfLine, x, y);

                // 描画
                this.con2.fillStyle = color.getString();
                this.con2.fillRect(x, y, 1, 1);
            }
        }
    }


    move() {
        const v = this.speed / this.fps;

        if (this.key["a"]) {
            this.pos.x -= cos(this.rz) * v;
            this.pos.y += sin(this.rz) * v;
        }
        if (this.key["d"]) {
            this.pos.x += cos(this.rz) * v;
            this.pos.y -= sin(this.rz) * v;
        }
        if (this.key["w"]) {
            this.pos.x += sin(this.rz) * v;
            this.pos.y += cos(this.rz) * v;
        }
        if (this.key["s"]) {
            this.pos.x -= sin(this.rz) * v;
            this.pos.y -= cos(this.rz) * v;
        }

        if (this.key[" "]) this.pos.z += v;
        if (this.key["Shift"]) this.pos.z -= v;

        const rv = 2;
        if (this.key["ArrowLeft"]) this.rz -= rv;
        if (this.key["ArrowRight"]) this.rz += rv;
        if (this.key["ArrowUp"]) this.rx += rv;
        if (this.key["ArrowDown"]) this.rx -= rv;
    }


    update() {
        this.move();
        this.updateNormalVector();
        this.updateCornerVectorsFromPos();
        this.updateCornerPoints();
        this.updateOnCameraPlaneVector();
        this.updateFocusPoint();
        this.updatePlane();
        this.drawEdges();
        this.drawVertexes();
        this.drawFaces();
    }

}