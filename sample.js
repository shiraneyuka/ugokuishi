// 石が動くアニメーション

let imagePaths = ['img/stone1.png', 'img/stone2.png', 'img/stone3.png', 'img/stone4.png', 'img/stone5.png'];
let images = []; // ロードされた画像オブジェクトを格納
let imageObjects = []; // 石オブジェクト（位置、速度、画像データなど）を格納
let speed = 2.5; // 基本速度
let sounds; // 衝突音を格納

// スマホと判断する画面幅のしきい値
const MOBILE_BREAKPOINT = 600;

// ----------------------------------------------------
// --- プリロード関数 ---
// ----------------------------------------------------
function preload() {
    sounds = loadSound('sounds/se_kotsun02.mp3');

    // 画像のロード（ここではプレースホルダーを使用）
    for (let path of imagePaths) {
        images.push(loadImage(path));
    }
}

// ----------------------------------------------------
// --- セットアップ関数 ---
// ----------------------------------------------------
function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
    canvas.style('z-index', '-1');

    // サウンドオブジェクトがない場合のダミー
    if (!sounds) {
        // p5.soundがロードされていない場合のダミーオブジェクト
        sounds = {
            play: () => {
                // console.log("Collision sound triggered (No real sound loaded)");
                // 実際には音源URLを置き換えてください
            },
            isLoaded: () => true
        };
    }

    // デバイス幅に応じて画像サイズの比率を決定
    // 画面幅がしきい値以下ならサイズを半分 (0.5)、そうでなければそのまま (1.0)
    const sizeRatio = (windowWidth <= MOBILE_BREAKPOINT) ? 0.5 : 1.0;

    // imageObjectsをリセット
    imageObjects = [];

    // 石オブジェクトの初期化
    for (let img of images) {

        let angle = random(TWO_PI);
        let dx = cos(angle) * speed;
        let dy = sin(angle) * speed;

        imageObjects.push({
            img: img,
            x: random(width), // X座標
            y: random(height), // Y座標
            dx: dx, // X方向速度
            dy: dy, // Y方向速度
            angle: 0, // 回転角度
            r: Math.max(img.width, img.height) / 2 // 衝突判定用の半径
        });
    }
}

// ----------------------------------------------------
// --- 描画関数 ---
// ----------------------------------------------------
function draw() {
    background(224, 224, 224);

    // 全ての石を動かし、壁と衝突判定を行う
    for (let i = 0; i < imageObjects.length; i++) {
        let obj = imageObjects[i];

        // 1.位置の更新
        obj.x += obj.dx;
        obj.y += obj.dy;

        // 2.壁との衝突判定と反転
        // X方向の衝突
        if (obj.x < 0) {
            obj.x = 0; // 画面内に戻す
            obj.dx *= -1; // 速度を反転
            obj.angle += random(-0.2, 0.2); // わずかに回転
            sounds.play();
        } else if (obj.x > width - obj.img.width) {
            obj.x = width - obj.img.width;
            obj.dx *= -1;
            obj.angle += random(-0.2, 0.2);
            sounds.play();
        }

        // Y方向の衝突
        if (obj.y < 0) {
            obj.y = 0;
            obj.dy *= -1;
            obj.angle += random(-0.2, 0.2);
            sounds.play();
        } else if (obj.y > height - obj.img.height) {
            obj.y = height - obj.img.height;
            obj.dy *= -1;
            obj.angle += random(-0.2, 0.2);
            sounds.play();
        }

        // 3.石同士の衝突判定と反発処理（新しいロジック）
        for (let j = i + 1; j < imageObjects.length; j++) {
            let obj2 = imageObjects[j];

            // 石の中心座標
            let center1 = createVector(obj.x + obj.r, obj.y + obj.r);
            let center2 = createVector(obj2.x + obj2.r, obj2.y + obj2.r);

            let collisionDistance = obj.r + obj2.r;
            let d = dist(center1.x, center1.y, center2.x, center2.y);

            if (d < collisionDistance) {
                // 衝突が発生
                sounds.play();

                // A. 位置の分離（重なりを解消して石がくっつくのを防ぐ）
                let overlap = collisionDistance - d;
                let collisionNormal = p5.Vector.sub(center2, center1);
                collisionNormal.normalize();

                // 重なりを半分ずつ解消するために、それぞれの位置を調整
                let moveVector = p5.Vector.mult(collisionNormal, overlap / 2);
                obj.x -= moveVector.x;
                obj.y -= moveVector.y;
                obj2.x += moveVector.x;
                obj2.y += moveVector.y;

                // B. 速度の交換（簡単な弾性衝突）
                let v1 = createVector(obj.dx, obj.dy);
                let v2 = createVector(obj2.dx, obj2.dy);

                // 衝突法線ベクトルに垂直な接戦ベクトル
                let tangent = createVector(-collisionNormal.y, collisionNormal.x);

                // 速度を法線方向と接線方向に分解
                let v1n = p5.Vector.dot(v1, collisionNormal);
                let v2n = p5.Vector.dot(v2, collisionNormal);
                let v1t = p5.Vector.dot(v1, tangent);
                let v2t = p5.Vector.dot(v2, tangent);

                // 衝突後の法線方向の速度（簡単のため、速度を交換）
                let v1n_after = v2n;
                let v2n_after = v1n;

                // 新しい速度ベクトルを再構築
                let v1n_vec_after = p5.Vector.mult(collisionNormal, v1n_after);
                let v2n_vec_after = p5.Vector.mult(collisionNormal, v2n_after);
                let v1t_vec_after = p5.Vector.mult(tangent, v1t);
                let v2t_vec_after = p5.Vector.mult(tangent, v2t);

                let v1_after = p5.Vector.add(v1n_vec_after, v1t_vec_after);
                let v2_after = p5.Vector.add(v2n_vec_after, v2t_vec_after);

                // 速度の更新
                obj.dx = v1_after.x;
                obj.dy = v1_after.y;
                obj2.dx = v2_after.x;
                obj2.dy = v2_after.y;

                // 衝突による回転のバリエーションを追加
                obj.angle += random(-0.3, 0.3);
                obj2.angle += random(-0.3, 0.3);
            }
        }
    }

    for (let obj of imageObjects) {
        // 画像の中心を基準に回転させるための描画ロジック
        push(); // 現在の描画状態（座標や回転など）を保存する
        translate(obj.x + obj.img.width / 2, obj.y + obj.img.height / 2); // 描画の基準点（0, 0）を obj の画像の中心に移動
        rotate(obj.angle); // 基準点（今は画像の中心）を中心にして、画像を回転
        imageMode(CENTER); // 描画モードを中心基準に設定
        image(obj.img, 0, 0); // 基準点(0, 0)に画像を描画
        pop(); // 保存した描画状態を元に戻す
    }
}

// ----------------------------------------------------
// --- イベントハンドラ ---
// ----------------------------------------------------
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// クリックかタップがされたらサウンドオン（ブラウザの制限対応）
function mousePressed() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
        document.getElementById('p5-info').style.display = 'none';
    }
}
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
        document.getElementById('p5-info').style.display = 'none';
    }
}


