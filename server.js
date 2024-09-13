import express from "express";
import injectRoutes from "./routes/index.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const server = express();
const port = process.env.SERVER_PORT;
const corsOptions = {
    origin: "http://localhost:5173", // Only allow requests from this origin
    credentials: true, // Allow cookies and credentials
};
// server.use(cors(corsOptions));
server.use(cors());
server.use(bodyParser.json());
server.use(express.json());
server.use(cookieParser());
injectRoutes(server);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
