// 構造体風のオブジェクトを作成
function vector_3d(x, y, z) {
  this._x = x || 0;
  this._y = y || 0;
  this._z = z || 0;
}

// xの値を取得するメソッド
vector_3d.prototype.get_x = function() {
  return this._x;
};

// xの値を設定するメソッド
vector_3d.prototype.set_x = function(x) {
  this._x = x;
};

// yの値を取得するメソッド
vector_3d.prototype.get_y = function() {
  return this._y;
};

// yの値を設定するメソッド
vector_3d.prototype.set_y = function(y) {
  this._y = y;
};

// zの値を取得するメソッド
vector_3d.prototype.get_z = function() {
  return this._z;
};

// zの値を設定するメソッド
vector_3d.prototype.set_z = function(z) {
  this._z = z;
};

// 配列を受け取ってセットする
vector_3d.prototype.set_all = function(x, y, z) {
  this._x = x;
  this._y = y;
  this._z = z;
};
// オブジェクトのインスタンスを作成
// var myVector = new vector_3d(1, 2, 3);

// 値の取得
// console.log("X:", myVector.getX()); // 出力: X: 1
// console.log("Y:", myVector.getY()); // 出力: Y: 2
// console.log("Z:", myVector.getZ()); // 出力: Z: 3

// 値の設定
// myVector.setX(4);
// myVector.setY(5);
// myVector.setZ(6);

// 値の再取得
// console.log("X:", myVector.getX()); // 出力: X: 4
// console.log("Y:", myVector.getY()); // 出力: Y: 5
// console.log("Z:", myVector.getZ()); // 出力: Z: 6
