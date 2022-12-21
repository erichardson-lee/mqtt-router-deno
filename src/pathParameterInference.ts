import {
  Equal,
  IsTrue,
} from "https://raw.githubusercontent.com/type-challenges/type-challenges/f74a4715a06f04e1e3b79bfb0403dcc2a330bc0c/utils/index.d.ts";
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
  IsTrue<Equal<"test", IsParameter<"+test">>>,
  IsTrue<Equal<"#test", IsParameter<"#test">>>,
  IsTrue<Equal<never, IsParameter<"test">>>
];

/**
 * Type To split by / and extract parameters
 */
type FilteredPathSplit<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredPathSplit<PartB>
  : IsParameter<Path>;

type Test2 = [
  IsTrue<Equal<never, FilteredPathSplit<"A/b/c/d">>>,

  IsTrue<Equal<"A" | "c" | "#d", FilteredPathSplit<"+A/b/+c/#d">>>
];

/**
 * Type to get Parameter Value
 */
type ParameterValue<Parameter> = Parameter extends `#${string}`
  ? string[]
  : string;

// Should be string[]
type Test3 = [
  IsTrue<Equal<string[], ParameterValue<"#test">>>,
  IsTrue<Equal<string, ParameterValue<"test">>>
];

/**
 * Type to remove # prefix from parameter
 */
type StripParameterHash<Parameter> = Parameter extends `#${infer Name}`
  ? Name
  : Parameter;

// Should be "test"
type Test4 = [
  IsTrue<Equal<"test", StripParameterHash<"#test">>>,
  IsTrue<Equal<"test", StripParameterHash<"#test">>>
];

/**
 * Parameter Type
 */
export type MqttParameters<Path> = {
  [key in FilteredPathSplit<Path> as StripParameterHash<key>]: ParameterValue<key>;
};

type Test5 = [
  IsTrue<
    Equal<
      {
        test: string;
        foo: string;
        bar: string[];
      },
      MqttParameters<"abc/+test/values/+foo/#bar">
    >
  >,
  IsTrue<Equal<{}, MqttParameters<"abc/test/values">>>,
  IsTrue<Equal<{ test: string }, MqttParameters<"abc/+test/values">>>,
  IsTrue<Equal<{ bar: string[] }, MqttParameters<"abc/test/values/#bar">>>
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
