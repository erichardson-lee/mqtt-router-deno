# MQTT Router

This is my attempt at making a MQTT router library in typescript with support
for route parameter inference, and strongly typeable routes.

For the examples below, I'd recomment loading them into a project, and looking
at the intellisense for the different parameters.

## Basic Usage

An example of basic usage can be seen below.

```ts
import { MqttRouter } from "@erichardson-lee/mqtt-router";

const router = new MqttRouter({ hostname: "localhost", port: 1883 });
router.addRoute("test", (msg) => {
  console.log(msg.topic);
  console.log(msg.body);
});
```

If you already have a [MQTT Instance](https://www.npmjs.com/package/mqtt)
running, it can be passed into the constructor instead of connection options.

```ts
import { connect } from "mqtt";
import { MqttRouter } from "@erichardson-lee/mqtt-router";

const MqttClient = connect({ hostname: "localhost", port: 1883 });

const router = new MqttRouter(MqttClient);
```

## Parameter Inference

This library can also infer the parameter names and types based on the route's
path string.

```ts
import { MqttRouter } from "@erichardson-lee/mqtt-router";

const router = new MqttRouter({ hostname: "localhost", port: 1883 });
router.addRoute("sensors/+sensorId/temperature", (msg) => {
  // It automatically infers that sensorId is a string on the params object
  console.log(msg.params.sensorId);
});

router.addRoute("sensors/+sensorId/#values", (msg) => {
  // It automatically infers that sensorId is a string on the params object
  console.log(msg.params.sensorId);

  // It also infers that values is an array of strings on the params object
  console.log(msg.params.values);
});
```

## Strong Route Typing

Additionally, if a route map is provided, it can do strong typing on the body of
a topic.

```ts
import { MqttRouter } from "@erichardson-lee/mqtt-router";

type Routes = {
  "sensors/+id/temperature": number;
  "sensors/+id/humidity": number;
};

const router = new MqttRouter<Routes>({ hostname: "localhost", port: 1883 });
router.addJSONRoute("sensors/+id/temperature", (msg) => {
  console.log(msg.params.id);

  console.log(msg.body);
});
```

This strong typing also works for publishing, and the publish function also
prevents you from accidentally publishing to a topic with parameters in it.

```ts
import { MqttRouter } from '@erichardson-lee/mqtt-router'

type PubRoutes = {
  "sensors/1/temperature": number,
};

type SubRoutes = {
  "sensors/+id/temperature": number,
  "sensors/+id/humidity": number
};

type Routes = PubRoutes & SubRoutes;

const router = new MqttRouter<Routes>({ hostname: 'localhost', port: 1883 });

router.addJSONRoute('sensors/+id/temperature', (msg) => {
  console.log(msg.params.id);

  console.log(msg.body);
});

router.publish('sensors/1/temperature', 40.2);
```
