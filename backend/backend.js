const mqtt = require("mqtt");

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on("connect" () => {
    console.log(" Backend kết nối thành công với MQTT");

    const topicToListen = 'legacylink/gw/+/telemetry'; // Đẩy dự liệu của cá máy CNC lên backend

    client.subscribe(topicToListen, (err) => {
    if (!err) {
      console.log(`📡 Đang túc trực lắng nghe dữ liệu tại: ${topicToListen}`);
    }
  });
});

client.on("message", (topic, message) => {
    try {
        const rawString = message.toString();

        const parsedData = JSON.parse(rawString);
        console.log(`\n📦 Vừa bắt được gói hàng từ Topic: ${topic}`);

        const gatewayId = topic.split('/')[2]; 
        const thoiGian = new Date(parsedData.timestamp).toLocaleTimeString();
        const nhietDo = parsedData.devices[0].temperature;
        const trangThai = parsedData.devices[0].status;

        console.log(`🔥 [${thoiGian}] Gateway ${gatewayId} báo cáo: Nhiệt độ máy CNC là ${nhietDo}°C - Trạng thái: ${trangThai}`);

    
        console.log(" Lưu vào database");

  } catch (error) {
    console.log(" Lỗi khi bóc tách JSON (Có thể định dạng gửi lên bị rách):", error.message);
  }
});
