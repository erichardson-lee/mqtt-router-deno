import { clean, exec } from "https://deno.land/x/mqtt_pattern@1.0.0/mod.ts";

import {
  Client as MqttClient,
  ClientOptions as IClientOptions,
} from "https://deno.land/x/mqtt_ts@1.2.0/mod.ts";
import type { PublishOptions } from "https://deno.land/x/mqtt_ts@1.2.0/lib/base_client.ts";
import type { MqttParameters } from "https://deno.land/x/mqtt_pattern@1.0.0/parameters.d.ts";

export class MqttRouter<Routes extends MQTTRouteMap = MQTTRouteMap> {
  private routes: RouteDeclaration<string, string>[] = [];

  public readonly mqttClient: MqttClient;

  constructor(options: IClientOptions);
  constructor(client: MqttClient);
  constructor(arg: MqttClient | IClientOptions) {
    this.mqttClient = arg instanceof MqttClient ? arg : new MqttClient(arg);

    this.mqttClient.on(
      "message",
      (topic: string, payload: string | Uint8Array) => {
        const pStr = typeof payload === "string"
          ? payload
          : new TextDecoder().decode(payload);

        this.emit(topic, pStr);
      },
    );
  }

  public async connect(): Promise<void> {
    await this.mqttClient.connect();
  }
  public async disconnect(): Promise<void> {
    await this.mqttClient.disconnect();
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

  public addRoute<Path extends Extract<keyof Routes, string>>(
    path: Path,
    callback: RouterCallback<Path, string>,
  ) {
    this.routes.push({
      path,
      //@ts-expect-error It'll be fine...
      callback,
    });

    return this.mqttClient.subscribe(clean(path.toString()));
  }

  public addJSONRoute<
    Path extends Extract<keyof Routes, string>,
    Body extends Routes[Path] = Routes[Path],
  >(path: Path, callback: RouterCallback<Path, Body>) {
    return this.addRoute(path, async (msg) => {
      try {
        const body = <Body> JSON.parse(msg.body);

        await callback({
          ...msg,
          body,
        });
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error("Error Parsing message", msg);
        } else {
          throw e;
        }
      }
    });
  }

  public publish<
    Topic extends SpecificRoutes<Routes>,
    Body extends Routes[Topic] = Routes[Topic],
  >(topic: Topic, value: Body, options?: PublishOptions): Promise<void> {
    const stringValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    return this.mqttClient.publish(
      topic.toString(),
      stringValue,
      options ?? {},
    );
  }
}

export interface MQTTMessage<Params, Body = string> {
  topic: string;
  params: Params;
  body: Body;
}

interface RouteDeclaration<Path extends string = string, Body = string> {
  path: Path;
  callback: RouterCallback<Path, Body>;
}

export type OnNewRouteCallback = (path: string) => void;

export type RouterCallback<Path, Body = string> = (
  msg: MQTTMessage<MqttParameters<Path>, Body>,
) => void | Promise<void>;

export type MQTTRouteMap = {
  [route: string]: unknown;
};

type PD = "+" | "#";
type PRoutes =
  | `${string}/${PD}${string}` // Middle bit is +/#
  | `${string}/${PD}` // Ends with +/#
  | `${PD}${string}`; // Starts with +/#

export type SpecificRoutes<Routes extends MQTTRouteMap> = Exclude<
  keyof Routes,
  PRoutes
>;

export type ParameterRoutes<Routes extends MQTTRouteMap> = Extract<
  keyof Routes,
  PRoutes
>;
