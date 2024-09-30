import dotenv from "dotenv";
dotenv.config();

const config = {
    db: {
        url:
            process.env.NODE_ENV === "development"
                ? "postgres://Temz:Temitope_12@localhost:5432/fraudBucket"
                : process.env.DATABASE_URL,
    },
    redis: {
        url:
            process.env.NODE_ENV === "development"
                ? "redis://localhost:6379"
                : process.env.REDIS_URL,
    },
    jwt: {
        accessSecretToken:
            process.env.NODE_ENV === "development"
                ? "Jesusmystrongtowerandmypersonalsavior"
                : process.env.ACCESS_TOKEN_SECRET,
        refreshSecretToken:
            process.env.NODE_ENV === "development"
                ? "Jesusismylife2024"
                : process.env.REFRESH_TOKEN_SECRET,
    },
    email: {
        pass:
            process.env.NODE_ENV === "development"
                ? "mubzztquivjmjvaa"
                : process.env.EMAIL_PASS,
        user:
            process.env.NODE_ENV === "development"
                ? "temitopeabiodun685@gmail.com"
                : process.env.EMAIL_USER,
    },
    resetPassword: {
        url:
            process.env.NODE_ENV === "development"
                ? "http://localhost:5173/reset-password"
                : process.env.RESET_URL,
    },
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || "development",
};

export default config;
