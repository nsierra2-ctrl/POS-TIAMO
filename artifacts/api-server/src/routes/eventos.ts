import { Router, type IRouter } from "express";
import { addSubscriber, removeSubscriber } from "../lib/broadcast";

const router: IRouter = Router();

router.get("/eventos", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write("event: connected\ndata: {}\n\n");

  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 15000);

  const send = (data: string) => {
    res.write(data);
  };

  addSubscriber(send);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSubscriber(send);
  });
});

export default router;
