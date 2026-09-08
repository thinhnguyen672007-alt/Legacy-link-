const mqtt = require('mqtt');
const mysql = require('mysql2');


// Kết nối database

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'iot_legacylink',
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0
});

pool.getConnection((err) => {
  if (err) {
    console.error(" Không thể kết nối Database:", err.message);
    return;
  }
  console.log(" Đã kết nối thành công tới Database MySQL!");
  connection.release
});


// Kết nối MQTT và kết nối dữ liệu 

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log("🟢 Đã kết nối tới trạm MQTT!");
  client.subscribe('legacylink/gw/+/telemetry');
});

client.on('message', (topic, message) => {
  try {
    const parsedData = JSON.parse(message.toString());
    const gatewayId = topic.split('/')[2]; 
    const nhietDo = parsedData.devices[0].temperature;
    const trangThai = parsedData.devices[0].status;

    console.log(`\n📦 Nhận dữ liệu từ ${gatewayId}: Nhiệt độ ${nhietDo}°C`);

   
    // insert vào database 
   
    const sql = `INSERT INTO telemetry_data (gateway_id, temperature, status) VALUES (?, ?, ?)`;
    const values = [gatewayId, nhietDo, trangThai];

    pool.query(sql, values, (err, results) => {
      if (err) {
        console.error("Lỗi khi lưu vào DB:", err.message);
      } else {
        console.log(` Đã lưu vào DB thành công! (ID dòng vừa tạo: ${results.insertId})`);
      }
    });

  } catch (error) {
    console.log(" Lỗi xử lý dữ liệu:", error.message);
  }
});