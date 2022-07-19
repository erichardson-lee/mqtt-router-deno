
import type { MqttParameters } from './pathParameterInference';

//@ts-ignore no type availble (yet)
import * as MqttPattern from 'mqtt-pattern';

interface MqttPatternModule {
  exec<Pattern>(pattern: Pattern, topic: string): MqttParameters<Pattern> | null;
  matches(pattern: string, topic: string): boolean;
  extract<Pattern>(pattern: Pattern, topic: string): MqttParameters<Pattern>
  fill<Pattern>(pattern: Pattern, params: MqttParameters<Pattern>): string;
  clean(pattern: string): string;
}

export const exec = MqttPattern.exec as MqttPatternModule['exec'];
export const matches = MqttPattern.matches as MqttPatternModule['matches'];
export const extract = MqttPattern.extract as MqttPatternModule['extract'];
export const fill = MqttPattern.fill as MqttPatternModule['fill'];
export const clean = MqttPattern.clean as MqttPatternModule['clean'];
