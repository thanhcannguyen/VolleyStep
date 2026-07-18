
import path from "node:path";

import dotenv from "dotenv";

import { app } from "./app";

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
    console.log(`VolleyStep API is running on port ${port}`);
});