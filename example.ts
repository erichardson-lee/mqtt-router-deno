import { MqttRouter } from "./mqttRouter.ts";

type PubRoutes = {
  "sensors/1/temperature": number;
};

type SubRoutes = {
  "sensors/+id/temperature": number;
  "sensors/+id/humidity": number;
};

type Routes = PubRoutes & SubRoutes;

const router = new MqttRouter<Routes>({
  url: "mqtt://localhost:1883",
});

router.addJSONRoute("sensors/+id/temperature", (msg) => {
  console.log("ID:", msg.params.id);

  console.log("Body:", msg.body);

  // When message is recieved, start disconnecting
  disconnect();
});

router.publish("sensors/1/temperature", 40.2);

await router.connect().then(() => void console.log("🚀 Connected to MQTT!"));

async function disconnect() {
  await router.disconnect();
  console.log("🚀 Disconnected from MQTT");
  Deno.exit(0);
}
