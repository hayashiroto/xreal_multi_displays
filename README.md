
# アイアンマンに出てくるようなスタンディングAR作業環境構築手順
1. xreal air を購入(しなくても, スマホの中から空間を覗くことは可能です)
2. macで cmd + space を押して「たーみなる」と入力しターミナルを開きar_monitorリポジトリをcloneする
3. ARグラスの加速度センサー情報を取得するCのコードをビルドする
4. node.js サーバーを起動する(ソケット通信でバイナリ情報をブラウザで送信するため)  
5. betterDummyをクローンして、xcodeでビルドする
6. スクショを参考に、仮装ディスプレイをbetterDummyで表示したいディスプレイの数だけ作成する
7. ベッドからパソコンとmacをもって起き上がり、机に向かう。
8. chromeを開き、[https://localhost:3000/mac_ar_monitor](https://localhost:3000/mac_ar_monitor)にアクセスする
9. + ボタンを押して、キャプチャするディスプイを選択していく。 
10. 3D空間で作業開始!
​
```bash
    git clone ar_monitor
    cd ar_monitor
    make
    node output.js
    git clone https://github.com/ZhipingYang/BetterDummy.git
    git checkout opensource
    open .
    # BetterDummy.xcodeproj をダブルクリック
    ビルド(ここのエラー系の対処が大変かも知れません)
```
(今後、swiftで完結するようなプロジェクトを作成して行く予定です)
