// Tu dong doc file .env neu co (tinh nang goc cua Node.js v20+)
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (e) { /* Bo qua neu chua co file .env */ }
}

const mqtt = require('mqtt');
const mysql = require('mysql2');

// ====================================================================
// 1. CAU HINH KET NOI DATABASE MYSQL
// ====================================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3390,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'iot_legacylink',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiem tra ket noi ban dau
pool.getConnection((err, connection) => {
  if (err) {
    console.error("[ERROR] Khong the ket noi Database MySQL:", err.message);
    console.error("[INFO] Vui long kiem tra: MySQL da bat chua, port co dung khong va database da duoc tao chua.");
    return;
  }
  console.log("[SUCCESS] Da ket noi thanh cong toi Database MySQL!");
  connection.release();
});

// ====================================================================
// 2. KET NOI VA DANG KY MQTT BROKER
// ====================================================================
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log(`[MQTT] Da ket noi toi tram MQTT Broker (${MQTT_BROKER})`);

  client.subscribe('legacylink/gw/+/telemetry', (err) => {
    if (!err) console.log("[MQTT] Da subscribe: legacylink/gw/+/telemetry");
  });

  client.subscribe('legacylink/gw/+/status', (err) => {
    if (!err) console.log("[MQTT] Da subscribe: legacylink/gw/+/status");
  });
});

client.on('error', (err) => {
  console.error("[MQTT ERROR] Loi ket noi MQTT:", err.message);
});

// ====================================================================
// 3. TIEP NHAN VA PHAN PHOI DU LIEU (INGESTION DISPATCHER)
// ====================================================================
client.on('message', (topic, message) => {
  try {
    const rawString = message.toString();
    const parsedData = JSON.parse(rawString);

    const topicParts = topic.split('/');
    const gatewayId = topicParts[2];
    const action = topicParts[3]; // 'telemetry' hoac 'status'

    if (action === 'telemetry') {
      processTelemetry(gatewayId, parsedData);
    } else if (action === 'status') {
      processStatus(gatewayId, parsedData);
    }

  } catch (error) {
    console.error("[ERROR] Loi parse goi tin MQTT JSON:", error.message);
  }
});

// --------------------------------------------------------------------
// XU LY DU LIEU DO DAC (TELEMETRY)
// --------------------------------------------------------------------
function processTelemetry(gatewayId, payload) {
  const recordedAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

  if (!payload.devices || !Array.isArray(payload.devices)) {
    console.warn(`[WARN] Bo qua goi tin tu ${gatewayId}: Khong co mang devices`);
    return;
  }

  payload.devices.forEach((dev) => {
    const machineCode = dev.machineCode || `MCH-SLAVE-${dev.slaveId || 1}`;
    const status = dev.status || 'RUNNING';

    let metricsObj = dev.metrics;
    if (!metricsObj) {
      const { slaveId, machineCode: mc, status: st, ...rest } = dev;
      metricsObj = rest;
    }
    const metricsJson = JSON.stringify(metricsObj);

    console.log(`[DATA] [${gatewayId}] => [${machineCode}]: Status=${status}, Metrics=${metricsJson}`);

    // Luu lich su chuoi thoi gian
    const historySql = `
      INSERT INTO telemetry_history (gateway_id, machine_code, status, metrics, recorded_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(historySql, [gatewayId, machineCode, status, metricsJson, recordedAt], (err) => {
      if (err) console.error(`[DB ERROR] Ghi telemetry_history (${machineCode}):`, err.message);
    });

    // Cap nhat trang thai may hien tai vao bang machines
    const machineSql = `
      INSERT INTO machines (machine_code, gateway_id, machine_name, status, last_metrics, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gateway_id = VALUES(gateway_id),
        status = VALUES(status),
        last_metrics = VALUES(last_metrics),
        last_seen = VALUES(last_seen)
    `;
    pool.query(machineSql, [machineCode, gatewayId, `May ${machineCode}`, status, metricsJson, recordedAt], (err) => {
      if (err) console.error(`[DB ERROR] Cap nhat machines (${machineCode}):`, err.message);
    });

    // Kiem tra nguong bao dong (Rule Engine)
    if (metricsObj && metricsObj.temperature && metricsObj.temperature > 70) {
      triggerAlarm(machineCode, 'OVERHEAT', 'CRITICAL', `Nhiet do vuot nguong an toan: ${metricsObj.temperature}C`);
    }
  });
}

// --------------------------------------------------------------------
// XU LY TRANG THAI GATEWAY (STATUS / LWT)
// --------------------------------------------------------------------
function processStatus(gatewayId, payload) {
  const status = payload.status || 'UNKNOWN';
  console.log(`[STATUS] Gateway [${gatewayId}]: ${status}`);

  const sql = `UPDATE machines SET status = ? WHERE gateway_id = ?`;
  pool.query(sql, [status, gatewayId], (err) => {
    if (err) {
      console.error(`[DB ERROR] Cap nhat status machines cho ${gatewayId}:`, err.message);
    } else {
      console.log(`[STATUS] Dong bo trang thai ${status} cho cac may thuoc ${gatewayId}`);
    }
  });

  if (status === 'OFFLINE') {
    triggerAlarm(gatewayId, 'DISCONNECTED', 'WARNING', `Gateway ${gatewayId} mat ket noi dot ngot (LWT)`);
  }
}

// --------------------------------------------------------------------
// LUU BAO DONG VAO DATABASE
// --------------------------------------------------------------------
function triggerAlarm(machineCode, alarmType, severity, message) {
  console.warn(`[ALARM ${severity}] ${machineCode}: ${message}`);
  const sql = `INSERT INTO alarms (machine_code, alarm_type, severity, message) VALUES (?, ?, ?, ?)`;
  pool.query(sql, [machineCode, alarmType, severity, message], (err) => {
    if (err) console.error("[DB ERROR] Ghi alarm:", err.message);
  });
}