
import express from "express";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { authRouter } from "./routes/auth.route";

export const app = express();

app.use(express.json());

app.get("/api/health", (_request, response) => {
    response.status(200).json({
        success: true,
        message: "VolleyStep API is running",
    });
});

app.use("/api/auth", authRouter);

app.use(notFoundHandler);

app.use(errorHandler);