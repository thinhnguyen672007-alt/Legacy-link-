const mqtt = require('mqtt');

// Ket noi toi Broker
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const GATEWAY_ID = 'esp32-zoneA';

// Cau hinh LWT (Last Will & Testament): Phat hien mat ket noi dot ngot
const client = mqtt.connect(MQTT_BROKER, {
  will: {
    topic: `legacylink/gw/${GATEWAY_ID}/status`,
    payload: JSON.stringify({ gatewayId: GATEWAY_ID, status: 'OFFLINE', reason: 'UNEXPECTED_DISCONNECT' }),
    qos: 1,
    retain: false
  }
});

let cycleCount = 1000;

client.on('connect', () => {
  console.log(`[SIMULATOR] ESP32 Gateway (${GATEWAY_ID}) da ket noi thanh cong toi ${MQTT_BROKER}`);

  // 1. Gui thong bao ONLINE khi khoi dong
  const onlinePayload = {
    gatewayId: GATEWAY_ID,
    status: 'ONLINE',
    ip: '192.168.1.55',
    firmwareVersion: 'v1.0.0-sim',
    timestamp: Date.now()
  };
  client.publish(`legacylink/gw/${GATEWAY_ID}/status`, JSON.stringify(onlinePayload));
  console.log(`[SIMULATOR] Da gui thong bao ONLINE:`, onlinePayload);

  // 2. Dinh ky moi 3 giay gui telemetry cua cac may Modbus Slave
  setInterval(() => {
    cycleCount += 1;

    // Gia lap nhiet do bien thien quanh 40-45C, thinh thoang vuot 70C de test canh bao
    const randomTemp = (Math.random() > 0.85)
      ? +(72 + Math.random() * 5).toFixed(1)
      : +(40 + Math.random() * 5).toFixed(1);

    const fakeTelemetry = {
      gatewayId: GATEWAY_ID,
      timestamp: Date.now(),
      devices: [
        {
          slaveId: 1,
          machineCode: 'PRESS-MCH-01',
          status: 'RUNNING',
          metrics: {
            temperature: randomTemp,
            current: +(12.5 + Math.random() * 1.5).toFixed(2),
            voltage: 220,
            cycleCount: cycleCount
          }
        },
        {
          slaveId: 2,
          machineCode: 'CNC-MCH-02',
          status: 'RUNNING',
          metrics: {
            temperature: +(35 + Math.random() * 2).toFixed(1),
            rpm: Math.floor(1400 + Math.random() * 50)
          }
        }
      ]
    };

    const topic = `legacylink/gw/${GATEWAY_ID}/telemetry`;
    client.publish(topic, JSON.stringify(fakeTelemetry));
    console.log(`[SIMULATOR] [${new Date().toLocaleTimeString()}] Publish telemetry toi [${topic}]`);
    console.log(JSON.stringify(fakeTelemetry, null, 2));

  }, 3000);
});

client.on('error', (err) => {
  console.error("[SIMULATOR ERROR] Loi ket noi MQTT:", err.message);
});