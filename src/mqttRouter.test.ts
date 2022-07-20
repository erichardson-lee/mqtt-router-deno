import { MqttRouterCore } from "./mqttRouter";
import test from "ava";

test("can be constructed", (t) => {
  const router = new MqttRouterCore();

  t.assert(router, "Router Constructor works");
});

test("Can Route Basic Requests", (t) => {
  const router = new MqttRouterCore();

  const topic = "abc/test/foo";

  t.plan(4);

  // Exact Value (valid)
  router.addRoute("abc/test/foo", () => t.pass());

  // Exact Value (invalid)
  router.addRoute("abcd/test/foo", () => t.fail());
  router.addRoute("abc/testt/foo", () => t.fail());
  router.addRoute("abc/test/bar", () => t.fail());

  // Single Level Parameter (valid)
  router.addRoute("abc/+/foo", () => t.pass());

  // Single Level Parameter (invalid)
  router.addRoute("abc/+/bar", () => t.fail());
  router.addRoute("abc/boo/+", () => t.fail());

  // Multiple Single Level Parameters (valid)
  router.addRoute("abc/+/+", () => t.pass());

  // Multiple Single Level Parameters (invalid)
  router.addRoute("+/testt/+", () => t.fail());

  // Multi level wildcard (valid)
  router.addRoute("abc/#", () => t.pass());

  // Multi level wildcard (invalid)
  router.addRoute("abcd/#", () => t.fail());

  router.publish(topic, "");
});

test.skip("JSON Route Typing", (t) => {
  type User = {
    name: string;
    age: number;
  };

  type Post = {
    title: string;
    contents: string;
  };

  type SubRoutes = {
    "posts/+postid/update": Post;

    "users/+userId/update": User;
  };

  type PubRoutes = {
    "posts/test/update": Post;

    "users/test/update": User;
  };

  const router = new MqttRouterCore<SubRoutes & PubRoutes>();

  t.plan(6);

  router.addJSONRoute("posts/+postid/update", (msg) => {
    t.assert(typeof msg.topic === "string");
    t.assert(msg.params.postid === "test");
    t.deepEqual(msg.body, <Post>{ title: "test", contents: "test post" });
  });

  router.publish("posts/test/update", <Post>{
    title: "test",
    contents: "test post",
  });

  router.addJSONRoute("users/+userId/update", (msg) => {
    t.assert(typeof msg.topic === "string");
    t.assert(msg.params.userId === "test");
    t.deepEqual(msg.body, <User>{ age: 20, name: "Edward" });
  });

  router.publish("users/test/update", <User>{ age: 20, name: "Edward" });
});
