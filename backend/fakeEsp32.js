const mqtt = require('mqtt');
// Kết nối vào trạm công cộng
const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log("ESP32 Giả đã kết nối mạng!");
  
  // Cứ 3 giây bắn dữ liệu 1 lần
  setInterval(() => {
    const fakeData = {
      timestamp: Date.now(),
      devices: [
        { slaveId: 1, temperature: Math.floor(Math.random() * (50 - 30) + 30), status: "running" }
      ]
    };
    
    // Gửi JSON lên Topic đã quy hoạch
    client.publish('legacylink/gw/esp32-zoneA/telemetry', JSON.stringify(fakeData));
    console.log("Đã gửi báo cáo:", fakeData);
  }, 3000);
});