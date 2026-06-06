/**
 * @file app.js
 * @description Cấu hình chính của Express Application, tích hợp các middleware bảo mật, nén dữ liệu và phân tích request.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import router from "./modules/index.routes.js";

const app = express();

// Cấu hình Helmet để bảo mật HTTP headers
app.use(helmet());

// Cấu hình CORS
app.use(cors());

// Cấu hình Compression để nén response dữ liệu
app.use(compression());

// Cấu hình JSON Parser
app.use(express.json());

// Cấu hình URL Encoded Parser
app.use(express.urlencoded({ extended: true }));

// Mount Root Router
app.use("/api/v1", router);

export default app;
