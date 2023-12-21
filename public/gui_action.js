 // 移動にかかる時間（ミリ秒）
var duration = 600;
// 元の位置を保存するためのオブジェクト
var originalPositions = {};
var originalRotations = {};
var six_sub_display = ['display_video_wrapper2', 'display_video_wrapper3', 'display_video_wrapper5', 'display_video_wrapper6'];
// シーンがロードされたらtemp_functionを実行
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('a-scene').addEventListener('loaded', saveOriginalPositionsAndRotations);
});

// エンティテぃのロード完了後に実行される処理
// 各ビデオラッパーの元の位置を保存する関数
function saveOriginalPositionsAndRotations() {
    console.log("=== Saving Original Positions and Rotations ===");
    six_sub_display.forEach(function(id) {
        var element = document.getElementById(id);
        var position = element.getAttribute('position');
        var rotation = element.getAttribute('rotation');
        originalPositions[id] = { x: position.x, y: position.y, z: position.z };
        originalRotations[id] = { x: rotation.x, y: rotation.y, z: rotation.z };
    });
}

// 各ビデオラッパーの元の位置に戻す
function resetPosition() {
    console.log("Resetting Positions");
    six_sub_display.forEach(function(id) {
        var element = document.getElementById(id);
        var originalPosition = originalPositions[id];
        element.setAttribute('animation', {
            property: 'position',
            to: originalPosition.x + " " + originalPosition.y + " " + originalPosition.z,
            dur: duration
        });
    });
}

function moveMine() {
    var newPosition = { x: 0, y: 1.5, z: -10 };
    six_sub_display.forEach(function(id) {
        var element = document.getElementById(id);
        element.setAttribute('animation', {
            property: 'position',
            to: newPosition.x + " " + newPosition.y + " " + newPosition.z,
            dur: duration
        });
    });
}

function zeroRotation() {
    six_sub_display.forEach(function(id) {
        var element = document.getElementById(id);
        element.setAttribute('animation', {
            property: 'rotation',
            to: "0 0 0",
            dur: duration
        });
    });
}

function resetRotation() {
    console.log("Resetting Rotations");
    for (var id in originalRotations) {
        var element = document.getElementById(id);
        var originalRotation = originalRotations[id];
        element.setAttribute('animation', {
            property: 'rotation',
            to: originalRotation.x + " " + originalRotation.y + " " + originalRotation.z,
            dur: duration
        });
    }
}

// 初期位置を保存

window.testToggleActionRotation = function() {
    // zeroRotation();
    console.log("Clicked GUI - Zero Rotation");
}

// 6面2面モニタの切り替え
window.testToggleActionSix = function() {
    var guiRadio = document.getElementById('toggleActionSix');
    // 文字列から論理値への変換
    var isChecked = guiRadio.getAttribute('checked') === 'true';
    if (isChecked) {
        moveMine();
    } else {
        resetPosition();
    }
    guiRadio.setAttribute('checked', !isChecked);
}

window.testToggleActionMine = function() {
    console.log("Clicked Mine");
}

window.testSliderAction = function() {
    console.log("Clicked GUI - Slider Action");
}
