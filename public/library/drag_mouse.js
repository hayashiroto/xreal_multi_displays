var camera = document.getElementById('camera');
var isDragging = false;
var previousTouchPosition = { x: 0, y: 0  };

function onTouchStart(event) {
    isDragging = true;
    previousTouchPosition.x = event.touches[0].clientX;
    previousTouchPosition.y = event.touches[0].clientY;

}

function onTouchMove(event) {
    if (isDragging) {
        var touchPosition = event.touches[0];
        var deltaX = touchPosition.clientX - previousTouchPosition.x;
        var deltaY = touchPosition.clientY - previousTouchPosition.y;

        var rotation = camera.getAttribute('rotation');
        rotation.y -= deltaX * 0.1; // 横方向の回転速度を調整
        rotation.x -= deltaY * 0.1; // 縦方向の回転速度を調整
        camera.setAttribute('rotation', rotation);

        previousTouchPosition = { x: touchPosition.clientX, y: touchPosition.clientY  };
    }
}

function onTouchEnd() {
    isDragging = false;

}

document.addEventListener('touchstart', onTouchStart);
document.addEventListener('touchmove', onTouchMove);
document.addEventListener('touchend', onTouchEnd);
