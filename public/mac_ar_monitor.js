let now_x = 0;
let now_y = 0;
let lock = true;
let track_settings = "";

let cameraWrapper = document.getElementById("camera-wrapper");
let camera = document.getElementById("camera");

const resetCamera = document.getElementById("resetCamera");
const lockCamera = document.getElementById("lockCamera");

const hide_switch = document.getElementById("hide_switch");
const fixedElm = document.getElementById("fixed");
const startElemAr = document.getElementById("startAr");
const stopElemAr = document.getElementById('stopAr');

const repeatNum = 6;

const startElems = Array.from({ length: repeatNum }, (_, index) => document.getElementById(`start${index + 1}`));

const stopElems = Array.from({ length: repeatNum }, (_, index) => document.getElementById(`stop${index + 1}`));

const videoElements = Array.from({ length: repeatNum }, (_, index) => document.getElementById(`display_video${index + 1}`));

const displayVideoWrappers = Array.from({ length: repeatNum }, (_, index) => document.getElementById(`display_video_wrapper${index + 1}`));

// オブジェクトのインスタンスを作成
// カメラの補正べクトル
let delta_camera_vector = new vector_3d(0, 0, 0);

// Options for getDisplayMedia()
const displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: false
};

startElems.forEach((startElem, index) => {
    startElem.addEventListener("click", () => startCaptureObj(videoElements[index], displayVideoWrappers[index]), false);
});

stopElems.forEach((stopElem, index) => {
    stopElem.addEventListener("click", () => stopCapture(videoElements[index]), false);
});

// カメラの位置をリセットする
// マイナスの
resetCamera.addEventListener("click", function (evt) {
    recenterCamera();
}, false);

hide_switch.addEventListener("click", function (evt) {
  fixedElm.classList.toggle("hide");
}, false);

startElemAr.addEventListener("click", function(evt) {
    startCaptureAr();
    shortcut.add("Ctrl+C",function() {
        recenterCamera();
    });
}, false);

stopAr.addEventListener('click', () => {
    cameraWrapper.setAttribute('rotation', { x: 0,y: 0, z: 0 });
    shortcut.remove("Ctrl+B");
});

async function startCaptureObj(video, display_video_wrapper) {
    try {
        video.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } catch (err) {
        track_settings = "";
        console.error(`Error: ${err}`);
    }
}

function stopCapture(video) {
  track_settings = "";
  let tracks = video.srcObject.getTracks();

  tracks.forEach((track) => track.stop());
  video.srcObject = null;
}

async function startCaptureAr() {
    let index = 0;
    try {
        const ws = new WebSocket('wss://localhost:3000');
        ws.onmessage = function(event) {
            // ARクォータニオンデータを受信
            let quaternion_ar = event.data.split(' ').map(Number);
            // ハイパスフィルターを行う
            if (highPassFilter(quaternion_ar))
            {
                console.log('処理をスキップしました');
                quaternion_ar = [0,0,0,1];
            }
            // cameraのクォータニオンを取得
            const quaternion_camera = convertEulerToQuaternion(cameraWrapper);
            // 合成
            // クォータニオンからオイラー角への変換
            const combinedQuaternions = combineQuaternions(quaternion_ar, quaternion_camera);
            const combinedEuler = convertQuaternionToEuler(combinedQuaternions);

            // cameraWrapperのrotationを更新
            cameraWrapper.setAttribute('rotation', {
                // ctrl + c でリセット
                x: combinedEuler.x - delta_camera_vector.get_x(),
                y: combinedEuler.y - delta_camera_vector.get_y(),
                // z roll はズレが大きすぎるので割愛
            });
            index += 1;
        };
        ws.onopen = function() {
            console.log('WebSocket connection established');
        };
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

// chat gpt が算出した補正
// クォータニオンの変化量が小さい場合に処理をスキップする関数
function highPassFilter(newQuaternion) {
    // 経験的補正
    const threshold = 0.00002;
    const changeX = Math.abs(newQuaternion[0]);
    const changeY = Math.abs(newQuaternion[1]);
    const changeZ = Math.abs(newQuaternion[2]);
    const changeW = Math.abs(newQuaternion[3]);

    return changeX < threshold && changeY < threshold && changeZ < threshold;
}

function convertEulerToQuaternion(cameraWrapper) {
    // cameraWrapperのオイラー角を取得
    const euler = cameraWrapper.getAttribute('rotation');

    // Three.jsのEulerオブジェクトを作成（角度は度からラジアンに変換）
    const threeEuler = new THREE.Euler(
        euler.x * Math.PI / 180, 
        euler.y * Math.PI / 180, 
        euler.z * Math.PI / 180, 
        'XYZ'  // 回転順序（デフォルトはXYZ）
    );

    // EulerオブジェクトからQuaternionオブジェクトへ変換
    const quaternion = new THREE.Quaternion().setFromEuler(threeEuler);

    // クォータニオンの各成分を配列として返す
    return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

function combineQuaternions(quaternion1, quaternion2) {
    // Three.jsのQuaternionオブジェクトを作成
    const threeQuaternion1 = new THREE.Quaternion(quaternion1[0], quaternion1[1], quaternion1[2], quaternion1[3]);
    const threeQuaternion2 = new THREE.Quaternion(quaternion2[0], quaternion2[1], quaternion2[2], quaternion2[3]);

    // 二つのクォータニオンを合成（乗算）
    threeQuaternion1.multiply(threeQuaternion2);

    // 合成されたクォータニオンを配列として返す
    return [threeQuaternion1.x, threeQuaternion1.y, threeQuaternion1.z, threeQuaternion1.w];
}

function convertQuaternionToEuler(quaternion) {

    // Three.jsのQuaternionオブジェクトを作成
    const threeQuaternion = new THREE.Quaternion(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);

    // QuaternionからEulerへ変換
    const euler = new THREE.Euler().setFromQuaternion(threeQuaternion, 'XYZ');

    // オイラー角をラジアンから度に変換
    return {
        x: euler.x * (180 / Math.PI),
        y: euler.y * (180 / Math.PI),
        z: euler.z * (180 / Math.PI)
    };
}

function stopCapture(evt) {
  track_settings = "";
  let tracks = videoElem1.srcObject.getTracks();

  tracks.forEach((track) => track.stop());
  videoElem1.srcObject = null;
}

function stopCapture2(evt) {
  track_settings = "";
  let tracks = videoElem2.srcObject.getTracks();

  tracks.forEach((track) => track.stop());
  videoElem1.srcObject = null;
}

const state = {
  maxFaces: 1,
  triangulateMesh: true
};

let videoWidth, videoHeight, video, canvas;

videoWidth = 600;
videoHeight = 400;

async function main() {

  canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const canvasContainer = document.querySelector('.canvas-wrapper');
}

function recenterCamera(){

    const cameraRotation = cameraWrapper.getAttribute("rotation") // <a-camera>の現在のrotation(回転)を取得</a-camera>
    const set_x = cameraRotation.x + delta_camera_vector.get_x();
    const set_y = cameraRotation.y + delta_camera_vector.get_y();
    const set_z = cameraRotation.z + delta_camera_vector.get_z();
    delta_camera_vector.set_all(set_x, set_y, set_z);
}

main();

