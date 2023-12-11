#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <pthread.h>
#include <time.h>
#include <math.h>
#include "cglm/cglm.h"
#include "hidapi/hidapi.h"

#define TICK_LEN (1.0f / 3906000.0f)
#define AIR_VID 0x3318
#define AIR_PID 0x0424

FILE *log_file;

// カメラの回転を表すクォータニオン
static versor rotation = GLM_QUAT_IDENTITY_INIT;

// ミューテックス（スレッドセーフな変更のためのロック）
static pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

// HIDデバイスから取得するデータの構造体
typedef struct {
    uint32_t tick;
    int16_t ang_vel[3];
} air_sample;

// クォータニオン
typedef struct {
    double x, y, z, w;
} Quaternion;

// オイラー角構造体
typedef struct {
    double yaw, roll, pitch;
} Euler;


//  set up log
void init_logging() {
    log_file = fopen("sensor_data_log.csv", "w");
    fprintf(log_file, "Timestamp,RawX,RawY,RawZ,ProcessedX,ProcessedY,ProcessedZ\n");
}

// log 書き込み
void log_data(const int16_t raw[3], const float processed[3]) {
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", t);

    fprintf(log_file, "%s,%d,%d,%d,%.4f,%.4f,%.4f\n",
            timestamp, raw[0], raw[1], raw[2],
            processed[0], processed[1], processed[2]);
}

// クォータニオンからオイラー角への変換
Euler quaternionToEuler(Quaternion q) {
    Euler e;

    // ヨー角（yaw）
    double sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    double cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    e.yaw = atan2(sinr_cosp, cosr_cosp);

    // ピッチ角（pitch）
    double siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    double cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    e.pitch = atan2(siny_cosp, cosy_cosp);


    // roll角（roll）
    // ここがおかしい可能性がある。
    double sinp = 2 * (q.w * q.y - q.z * q.x);
    if (fabs(sinp) >= 1)
        e.roll = copysign(M_PI / 2, sinp); 
    else
        e.roll = asin(sinp);

    return e;
}

// ==============================================================================-
// chat gpt が作成したズレ補正用コード
double correct_x(double x, int t) {
    double slope_x = 2.9411956051883347e-06;
    double intercept_x = -1.4262566775464364e-05;
    return x - (slope_x * t + intercept_x);
}

double correct_y(double y, int t) {
    double slope_y = 2.774111033752069e-06;
    double intercept_y = -0.00018742022783452966;
    return y - (slope_y * t + intercept_y);
}

double correct_z(double z, int t) {
    double slope_z = -6.291870176079983e-07;
    double intercept_z = 0.014845147509020225;
    return z - (slope_z * t + intercept_z);
}

// ==============================================================================-

// HIDデバイスを開く関数
static hid_device* open_device() {
    struct hid_device_info* devs = hid_enumerate(AIR_VID, AIR_PID);
    struct hid_device_info* cur_dev = devs;
    hid_device* device = NULL;

    // インターフェース番号が3のデバイスを検索
    while (devs) {
        if (cur_dev->interface_number == 3) {
            device = hid_open_path(cur_dev->path);
            break;
        }
        cur_dev = cur_dev->next;
    }

    hid_free_enumeration(devs);
    return device;
}

// 受信データから角速度を取り出す関数
static void process_ang_vel(const int16_t ang_vel[3], vec3 out_vec) {
    // 角速度のスケールとバイアスの補正（経験的な補正）
    out_vec[0] = (float)(ang_vel[0] + 20) * -0.001f;
    out_vec[1] = (float)(ang_vel[1] + 20) * 0.001f - 0.0128f;
    out_vec[2] = (float)(ang_vel[2] - 20) * 0.001f + 0.0128f;
}

// HIDデバイスからのレポートを解析する関数
static int parse_report(const unsigned char* buffer, int size, air_sample* out_sample) {
    if (size != 64) {
        printf("Invalid packet size");
        return -1;
    }

    buffer += 5;
    out_sample->tick = *(buffer++) | (*(buffer++) << 8) | (*(buffer++) << 16) | (*(buffer++) << 24);
    buffer += 10;
    out_sample->ang_vel[0] = *(buffer++) | (*(buffer++) << 8);
    buffer++;
    out_sample->ang_vel[1] = *(buffer++) | (*(buffer++) << 8);
    buffer++;
    out_sample->ang_vel[2] = *(buffer++) | (*(buffer++) << 8);

    return 0;
}

// カメラの回転を更新する関数
static void update_rotation(float dt, vec3 ang_vel) {
    // ミューテックスのロック
    pthread_mutex_lock(&mutex);

    // 角速度の大きさが一定以上の場合のみ回転処理を行う
    float ang_vel_length = glm_vec3_norm(ang_vel);

    if (ang_vel_length > 0.0001f) {
        // 角速度ベクトルを正規化して回転軸として使用
        vec3 rot_axis = { ang_vel[0] / ang_vel_length, ang_vel[1] / ang_vel_length, ang_vel[2] / ang_vel_length };

        // 回転角度は角速度の大きさと経過時間に比例
        float rot_angle = ang_vel_length * dt;

        // 回転軸と回転角度から回転を表すクォータニオンを作成
        versor delta_rotation;
        glm_quatv(delta_rotation, rot_angle, rot_axis);

        // ここの出力をunity側がキャプチャする
        /* printf("%f %f %f %f\n", delta_rotation[0], delta_rotation[1], delta_rotation[2], delta_rotation[3]); */

        // 既存の回転に新しい回転を合成
        glm_quat_mul(rotation, delta_rotation, rotation);
    }

    // クォータニオンの正規化（必要ならば）
    glm_quat_normalize(rotation);

    /* printf("%f %f %f %f\n", rotation[0], rotation[1], rotation[2], rotation[3]); */

    // ミューテックスのアンロック
    pthread_mutex_unlock(&mutex);
}

int main(void) {
    // HIDデバイスを開く
    hid_device* device = open_device();
    if (!device) {
        printf("Unable to open device\n");
        return 1;
    }

    // HIDデバイスに特定のデータを書き込む（マジックナンバー）
    uint8_t magic_payload[] = { 0xaa, 0xc5, 0xd1, 0x21, 0x42, 0x04, 0x00, 0x19, 0x01 };
    int res = hid_write(device, magic_payload, sizeof(magic_payload));
    if (res < 0) {
        printf("Unable to write to device\n");
        return 1;
    }

    init_logging();
    int t = 0; // インデックス
    do {
        unsigned char buffer[64] = {};
        uint32_t last_sample_tick = 0;
        air_sample sample = {};
        vec3 ang_vel = {};

        // HIDデバイスからデータを読み取る
        int res = hid_read(device, (void*)&buffer, sizeof(buffer));
        if (res < 0) {
            printf("Unable to get feature report\n");
            break;
        }

        // 受信データを解析して角速度を取得
        parse_report(buffer, sizeof(buffer), &sample);

        // 取得した角速度データを処理
        process_ang_vel(sample.ang_vel, ang_vel);

        // タイムスタンプの差から経過時間を計算
        uint32_t tick_delta = 3906;
        if (last_sample_tick > 0)
            tick_delta = sample.tick - last_sample_tick;

        float dt = tick_delta * TICK_LEN;
        last_sample_tick = sample.tick;

        // カメラの回転を更新
        /* process_sensor_data(sample.ang_vel, ang_vel); */
        update_rotation(dt, ang_vel);
        log_data(sample.ang_vel, rotation);

        // 例のクォータニオン
        Quaternion q = {rotation[0], rotation[1], rotation[2], rotation[3]}; 
        // サンプルインデックス
        int sampleIndex = 0;

        // オイラー角への変換
        Euler e = quaternionToEuler(q);

        // ズレの補正
        double corrected_x = correct_x(e.yaw, t);
        double corrected_y = correct_y(e.pitch, t);

        /* printf("%f %f %f\n", e.yaw, e.pitch, e.roll); */
        // pitch の値はいらない、あまりしない動きだし、ズレが補正できていない
        printf("%f %f %f\n", corrected_x, corrected_y, e.roll);

        t++;
    } while (res);

    // HIDデバイスを閉じる
    hid_close(device);
    res = hid_exit();

    return 0;
}
