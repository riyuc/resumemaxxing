import { Elysia } from "elysia";

function handleModify() {

}

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .post("/modify", handleModify)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
