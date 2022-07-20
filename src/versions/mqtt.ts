import { MqttRouterCore } from "../mqttRouterCore";
import { MQTTRouteMap } from "../pathParameterInference";

import { connect, IClientOptions, MqttClient } from "mqtt";

export class MqttRouter<Routes extends MQTTRouteMap> extends MqttRouterCore<
  Routes,
  MqttClient
> {
  constructor(options: IClientOptions);
  constructor(client: MqttClient);
  constructor(arg: MqttClient | IClientOptions) {
    super(arg instanceof MqttClient ? arg : connect(arg));

    this.client.on("message", (topic, payload) => {
      this.emit(topic, payload.toString());
    });
  }

  public get client() {
    return this.mqttClient;
  }
}
