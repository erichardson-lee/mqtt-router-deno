export type { MqttParameters } from "./pathParameterInference";
import { clean, exec } from "./mqtt-pattern";
import {
  MqttParameters,
  MQTTRouteMap,
  SpecificRoutes,
} from "./pathParameterInference";

import {
  connect,
  IClientOptions,
  IClientPublishOptions,
  MqttClient,
} from "mqtt";

export interface MQTTMessage<Params, Body = string> {
  topic: string;
  params: Params;
  body: Body;
}

interface RouteDeclaration<Path = string> {
  path: Path;
  callback: RouterCallback<Path>;
}

export type OnNewRouteCallback = (path: string) => void;

export type RouterCallback<Path, Body = string> = (
  msg: MQTTMessage<MqttParameters<Path>, Body>,
) => void;

export class MqttRouter<Routes extends MQTTRouteMap = MQTTRouteMap> {
  private routes: RouteDeclaration<any>[] = [];

  public readonly mqttClient: MqttClient;

  constructor(options: IClientOptions);
  constructor(client: MqttClient);
  constructor(arg: MqttClient | IClientOptions) {
    this.mqttClient = arg instanceof MqttClient ? arg : connect(arg);

    this.mqttClient.on("message", (topic, payload) => {
      this.emit(topic, payload.toString());
    });
  }

  protected emit(topic: string, body: string) {
    this.routes.forEach((route) => {
      const res = exec(route.path, topic.toString());

      // Doesn't match
      if (!res) return;

      void route.callback({
        topic: topic.toString(),
        body,
        params: res,
      });
    });
  }

  public addRoute<Path extends keyof Routes>(
    path: Path,
    callback: RouterCallback<Path>,
  ) {
    this.routes.push({
      path,
      callback,
    });

    return this.mqttClient.subscribe(clean(path.toString()));
  }

  public addJSONRoute<
    Path extends keyof Routes,
    Body extends Routes[Path] = Routes[Path],
  >(path: Path, callback: RouterCallback<Path, Body>) {
    return this.addRoute(path, (msg) =>
      callback({
        topic: msg.topic,
        params: msg.params,
        body: <Body> JSON.parse(msg.body),
      }));
  }

  public async publish<
    Topic extends SpecificRoutes<Routes>,
    Body extends Routes[Topic] = Routes[Topic],
  >(topic: Topic, value: Body, options?: IClientPublishOptions): Promise<void> {
    const stringValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    return new Promise((res, rej) => {
      this.mqttClient.publish(
        topic.toString(),
        stringValue,
        options ?? {},
        (err) => (err ? rej(err) : res()),
      );
    });
  }
}
