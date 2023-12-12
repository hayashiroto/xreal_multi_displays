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
    try {
        const ws = new WebSocket('wss://localhost:3000');
        ws.onmessage = function(event) {
            // ARグラスのオイラーを取得
            const euler = event.data.split(' ').map(Number);
            const rotationPower = 3;
            // z はroll だが、ズレが激しいため使用しない
            cameraWrapper.setAttribute('rotation', {
                x: euler[0] * (180 / Math.PI) * rotationPower - delta_camera_vector.get_x(),
                y: euler[1] * (180 / Math.PI) * rotationPower - delta_camera_vector.get_y(),
            });
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

