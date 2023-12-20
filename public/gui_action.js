// 元の位置を保存するためのオブジェクト
var duration = 1000; // 移動にかかる時間（ミリ秒）
var originalPositions = {};
var originalRotations = {};
var six_sub_display = ['display_video_wrapper2', 'display_video_wrapper3', 'display_video_wrapper5', 'display_video_wrapper6'];

// 各ビデオラッパーの元の位置を保存する関数
function saveOriginalPositionsAndRotations() {
    console.log("=== Saving Original Positions and Rotations ===");
    six_sub_display.forEach(function(id) {
        var element = document.getElementById(id);
        var position = element.getAttribute('position');
        console.log(id)
        console.log(position)
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
    saveOriginalPositionsAndRotations()
}

window.testToggleActionSix = function() {
    var guiRadio = document.getElementById('toggleActionSix');
    var isChecked = guiRadio.getAttribute('checked') === 'true'; // 文字列から論理値への変換
    console.log("Radio state: ", isChecked);

    if (isChecked) {
        console.log('Storing');
        moveMine();
    } else {
        console.log('Expanding');
        resetPosition();
    }

    console.log("Clicked Six");
    guiRadio.setAttribute('checked', !isChecked);
}

window.testToggleActionMine = function() {
    console.log("Clicked Mine");
}

window.testSliderAction = function() {
    console.log("Clicked GUI - Slider Action");
}
