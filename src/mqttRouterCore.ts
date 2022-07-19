export type { MqttParameters } from './pathParameterInference';

import { exec } from './mqtt-pattern';
import { MqttParameters, MQTTRouteMap, SpecificRoutes } from './pathParameterInference';

export interface MQTTMessage<Params, Body = string> {
  topic: string,
  params: Params,
  body: Body,
}

interface RouteDeclaration<Path = string> {
  path: Path;
  callback: RouterCallback<Path>;
}

export type OnNewRouteCallback = (path: string) => void

export type RouterCallback<Path, Body = string> = (msg: MQTTMessage<MqttParameters<Path>, Body>) => void

export interface MqttClient {
  subscribe(topic: string): void;
  publish(topic: string, message: string): void;
}

export const MockMqttClient: MqttClient = {
  subscribe: (topic) => void (`Subscribe to ${topic}`),
  publish: (topic, value) => void (`Publish to ${topic}: ${value}`),
}

export class MqttRouterCore<Routes extends MQTTRouteMap = MQTTRouteMap> {
  private routes: RouteDeclaration<any>[] = [];

  constructor(private readonly mqttClient: MqttClient = MockMqttClient) { }

  private emit(topic: SpecificRoutes<Routes>, body: string) {
    this.routes.forEach((route) => {
      const res = exec(route.path, topic.toString());

      // Doesn't match
      if (!res) return

      void route.callback({
        topic: topic.toString(),
        body,
        params: res,
      })
    })
  }

  public addRoute<Path extends keyof Routes>(path: Path, callback: RouterCallback<Path>) {
    this.routes.push({
      path,
      callback
    });

    this.mqttClient.subscribe(path.toString());
  }

  public addJSONRoute<Path extends keyof Routes, Body extends Routes[Path] = Routes[Path]>(path: Path, callback: RouterCallback<Path, Body>) {
    this.addRoute(path, (msg) => callback({
      topic: msg.topic,
      params: msg.params,
      body: <Body>JSON.parse(msg.body)
    }));
  }

  public publish<
    Topic extends SpecificRoutes<Routes>,
    Body extends Routes[Topic] = Routes[Topic]
  >(topic: Topic, value: Body): void {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value)

    this.mqttClient.publish(
      topic.toString(),
      stringValue
    );

    this.emit(
      topic,
      stringValue
    )
  }
}


