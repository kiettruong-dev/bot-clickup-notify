import express from "express";
import router from "./routers/index.router.ts";

const app = express();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "clickup-zalo-notifier" });
});
app.use('/', router);

if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
export default app;
