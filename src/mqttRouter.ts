export type { MqttParameters } from './pathParameterInference';

import { exec } from './mqtt-pattern';
import { MqttParameters } from './pathParameterInference';

export interface MQTTMessage<Params> {
  topic: string,
  params: Params,
  body: string,
}

interface RouteDeclaration<Path = string> {
  path: Path;
  callback: RouterCallback<Path>;
}

export type RouterCallback<Path> = (msg: MQTTMessage<MqttParameters<Path>>) => void

export class MqttRouter {
  private routes: RouteDeclaration<any>[] = [];

  public emit(topic: string, body: string) {
    this.routes.forEach((route) => {
      const res = exec(route.path, topic);

      // Doesn't match
      if (!res) return

      void route.callback({
        topic,
        body,
        params: res,
      })
    })
  }

  public addRoute<Path extends string>(path: Path, callback: RouterCallback<Path>) {
    this.routes.push({
      path,
      callback
    })
  }
}
