import { MqttRouterCore } from "../mqttRouterCore";
import { MQTTRouteMap } from "../pathParameterInference";

import * as mqtt from "mqtt";
import type { IClientOptions, MqttClient } from "mqtt";

export class MqttRouter<Routes extends MQTTRouteMap> extends MqttRouterCore<
  Routes,
  MqttClient
> {
  constructor(options: IClientOptions);
  constructor(client: MqttClient);
  constructor(arg: MqttClient | IClientOptions) {
    super(arg instanceof mqtt.MqttClient ? arg : mqtt.connect(arg));

    this.mqttClient.on("message", (topic, payload) => {
      this.emit(topic, payload.toString());
    });
  }

  public getClient() {
    return this.mqttClient;
  }
}
