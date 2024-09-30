import express from "express";
import injectRoutes from "./routes/index.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import config from "./@config/index.js";

dotenv.config();
const server = express();
const port = config.port;

// server.use(cors(corsOptions));
server.use(cors());
server.use(bodyParser.json());
server.use(express.json());
server.use(cookieParser());
injectRoutes(server);

server.listen(port, () => {
    if (config.environment === "development") {
        console.log(`Server running in Development mode on port ${port}`);
    } else {
        console.log(`Server running in Production mode on port ${port}`);
    }
});
