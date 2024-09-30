import { createClient } from "redis";
import config from "../@config/index.js";

class RedisService {
    constructor() {
        this.client = createClient({
            url: config.redis.url,
        });

        // Handle Redis connection errors
        this.client.on("error", (err) => {
            console.log("Redis Client Error:", err);
        });
    }

    async connect() {
        try {
            await this.client.connect();
            if (config.environment === "development") {
                console.log("Redis connected and running in Development mode");
            } else {
                console.log("Redis connected and running in Production mode");
            }
        } catch (error) {
            console.error("Error connecting to Redis:", error);
        }
    }

    async disconnect() {
        try {
            await this.client.quit();
            console.log("Disconnected from Redis");
        } catch (error) {
            console.error("Error disconnecting from Redis:", error);
        }
    }

    async savePasscode(email, passcode, expiration = 900) {
        // expiration default to 15 minutes
        try {
            await this.client.setEx(passcode, expiration, email);
        } catch (error) {
            console.error("Error saving passcode:", error);
        }
    }

    // Retrieve the passcode for a given email
    async getPasscode(passcode) {
        try {
            const email = await this.client.get(passcode);
            return email;
        } catch (error) {
            console.error("Error retrieving passcode:", error);
            return null;
        }
    }

    // Delete the passcode after use (for security)
    async deletePasscode(passcode) {
        try {
            await this.client.del(passcode);
            console.log(`Passcode ${passcode} deleted from Redis`);
        } catch (error) {
            console.error("Error deleting passcode:", error);
        }
    }
}

const redisStorage = new RedisService();
await redisStorage.connect();
export default redisStorage;
