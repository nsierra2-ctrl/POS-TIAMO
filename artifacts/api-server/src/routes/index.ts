import { Router, type IRouter } from "express";
import path from "path";
import express from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usuariosRouter from "./usuarios";
import mesasRouter from "./mesas";
import pedidosRouter from "./pedidos";
import productosRouter from "./productos";
import eventosRouter from "./eventos";
import reportesRouter from "./reportes";
import displayRouter from "./display";
import cajaRouter from "./caja";
import impresoraRouter from "./impresora";
import adminRouter from "./admin";
import configuracionRouter from "./configuracion";
import backupRouter from "./backup";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "public", "uploads");
router.use("/uploads", express.static(uploadsDir));

router.use(healthRouter);
router.use(authRouter);
router.use(usuariosRouter);
router.use(mesasRouter);
router.use(pedidosRouter);
router.use(productosRouter);
router.use(eventosRouter);
router.use(reportesRouter);
router.use(displayRouter);
router.use(cajaRouter);
router.use(impresoraRouter);
router.use(adminRouter);
router.use(configuracionRouter);
router.use(backupRouter);

export default router;
