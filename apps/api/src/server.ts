
import type { Server } from "node:http";

import { app } from "./app";
import {
    connectDatabase,
    disconnectDatabase,
} from "./config/database";
import { env } from "./config/env";

let httpServer: Server | undefined;
let isShuttingDown = false;

const startServer = async (): Promise<void> => {
    await connectDatabase();

    httpServer = app.listen(env.PORT, () => {
        console.log(
            `VolleyStep API is running on port ${env.PORT} in ${env.NODE_ENV} mode`,
        );
    });
};

const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    if (!httpServer) {
        await disconnectDatabase();
        process.exit(0);
    }

    httpServer.close(async (error) => {
        if (error) {
            console.error("Failed to close HTTP server:", error);
            process.exit(1);
        }

        try {
            await disconnectDatabase();
            process.exit(0);
        } catch (disconnectError) {
            console.error(
                "Failed to disconnect from MongoDB:",
                disconnectError,
            );

            process.exit(1);
        }
    });
};

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

startServer().catch((error: unknown) => {
    console.error("Failed to start VolleyStep API:", error);
    process.exit(1);
});