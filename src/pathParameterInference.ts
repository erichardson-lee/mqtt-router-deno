import { IsExact } from "https://deno.land/x/conditional_type_checks@1.0.6/mod.ts";

/**
 * This code is heavily inspired by:
 * https://lihautan.com/extract-parameters-type-from-string-literal-types-with-typescript/#splitting-a-string-literal-type
 */

/**
 *  Check if a string is a parameter in a type
 */
type IsParameter<Parameter> = Parameter extends `+${infer ParamName}`
  ? ParamName
  : never | Parameter extends `#${string}`
  ? Parameter
  : never;

type Test1 = [
  IsExact<"test", IsParameter<"+test">>,
  IsExact<"#test", IsParameter<"#test">>,
  IsExact<never, IsParameter<"test">>
];

/**
 * Type To split by / and extract parameters
 */
type FilteredPathSplit<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredPathSplit<PartB>
  : IsParameter<Path>;

type Test2 = [
  IsExact<never, FilteredPathSplit<"A/b/c/d">>,

  IsExact<"A" | "c" | "#d", FilteredPathSplit<"+A/b/+c/#d">>
];

/**
 * Type to get Parameter Value
 */
type ParameterValue<Parameter> = Parameter extends `#${string}`
  ? string[]
  : string;

// Should be string[]
type Test3 = [
  IsExact<string[], ParameterValue<"#test">>,
  IsExact<string, ParameterValue<"test">>
];

/**
 * Type to remove # prefix from parameter
 */
type StripParameterHash<Parameter> = Parameter extends `#${infer Name}`
  ? Name
  : Parameter;

// Should be "test"
type Test4 = [
  IsExact<"test", StripParameterHash<"#test">>,
  IsExact<"test", StripParameterHash<"#test">>
];

/**
 * Parameter Type
 */
export type MqttParameters<Path> = {
  [key in FilteredPathSplit<Path> as StripParameterHash<key>]: ParameterValue<key>;
};

type Test5 = [
  IsExact<
    {
      test: string;
      foo: string;
      bar: string[];
    },
    MqttParameters<"abc/+test/values/+foo/#bar">
  >,
  IsExact<{}, MqttParameters<"abc/test/values">>,
  IsExact<{ test: string }, MqttParameters<"abc/+test/values">>,
  IsExact<{ bar: string[] }, MqttParameters<"abc/test/values/#bar">>
];

export type MQTTRouteMap = {
  [route: string]: unknown;
};

type PD = "+" | "#";
export type SpecificRoutes<Routes extends MQTTRouteMap> = Exclude<
  keyof Routes,
  | `${string}/${PD}${string}` // Middle bit is +/#
  | `${string}/${PD}` // Ends with +/#
  | `${PD}${string}` // Starts with +/#
>;

export type ParameterRoutes<Routes extends MQTTRouteMap> = Exclude<
  keyof Routes,
  SpecificRoutes<Routes>
>;
