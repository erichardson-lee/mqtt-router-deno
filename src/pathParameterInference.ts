/**
 * This code is heavily inspired by:
 * https://lihautan.com/extract-parameters-type-from-string-literal-types-with-typescript/#splitting-a-string-literal-type
 */



/**
 *  Check if a string is a parameter in a type
 */
type IsParameter<Parameter> =
  | Parameter extends `+${infer ParamName}` ? ParamName : never
  | Parameter extends `#${string}` ? Parameter : never

// Should be "test"
type TestParam = IsParameter<"+test">

// Should be "#test"
type TestParam2 = IsParameter<"#test">

// Should be never
type TestParam3 = IsParameter<"test">


/**
 * Type To split by /
 */
type FilteredPathSplit<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredPathSplit<PartB>
  : IsParameter<Path>;

// Should be never
type TestSplit = FilteredPathSplit<"A/b/c/d">;

// Should be "A" | "c" | "#d"
type TestSplit2 = FilteredPathSplit<"+A/b/+c/#d">;

/**
 * Type to get Parameter Value
 */
type ParameterValue<Parameter> =
  Parameter extends `#${string}` ? string[] : string;

// Should be string[]
type TestValue = ParameterValue<"#test">;

// Should be string
type TestValue2 = ParameterValue<"test">;


/** 
 * Type to remove # prefix from parameter
 */
type StripParameterHash<Parameter> =
  Parameter extends `#${infer Name}` ? Name : Parameter;

// Should be "test"
type TestStrip = StripParameterHash<"#test">

// Should be "test"
type TestStrip2 = StripParameterHash<"test">



/**
 * Parameter Type
 */
export type MqttParameters<Path> = {
  [key in FilteredPathSplit<Path> as StripParameterHash<key>]: ParameterValue<key>
}


/*
should be:
{
  test: string
  foo: string
  bar: string[]
}
*/
type TestParameters = MqttParameters<"abc/+test/values/+foo/#bar">;

/*
should be:
{}
*/
type TestParameters2 = MqttParameters<"abc/test/values">;

/*
should be:
{
  test: string
}
*/
type TestParameters3 = MqttParameters<"abc/+test/values">;

/*
should be:
{
  bar: string[]
}
*/
type TestParameters4 = MqttParameters<"abc/test/values/#bar">;


export type MQTTRouteMap = {
  [route: string]: unknown;
}

export type SpecificRoutes<Routes extends MQTTRouteMap> = Exclude<keyof Routes,
  | `${string}/+${string}`
  | `${string}/#${string}`
  | `${string}/+`
  | `${string}/#`
  | `+${string}`
  | `#${string}`
>

export type ParameterRoutes<Routes extends MQTTRouteMap> = Exclude<keyof Routes, SpecificRoutes<Routes>>
