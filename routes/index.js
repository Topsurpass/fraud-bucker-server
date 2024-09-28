import App from "../controllers/App/index.js";
import Auth from "../controllers/Auth/index.js";
import Transaction from "../controllers/Transaction/index.js";
import authenticateToken from "../middlewares/authenticate.js";
import Merchant from "../controllers/Merchant/index.js";
import FraudContact from "../controllers/Contact/index.js";
import UserController from "../controllers/Users/index.js";
import ChannelController from "../controllers/Channel/index.js";
import DashboardController from "../controllers/Dashboard/index.js";
import onlyPermit from "../middlewares/rolesAndPermission.js";
import { APIError, errorResponse } from "../middlewares/appError.js";

const injectRoutes = (api) => {
    //App
    api.get("/api/v1/app/status", App.getStatus);

    //Auth
    api.post("/api/v1/auth/signin", Auth.signIn);
    api.post("/api/v1/auth/newToken", Auth.getNewToken);

    // User
    api.post(
        "/api/v1/user",
        // authenticateToken,
        // onlyPermit("ADMIN"),
        UserController.createUser
    );
    api.get("/api/v1/user", authenticateToken, UserController.getAllUser);
    api.get("/api/v1/user/:id", authenticateToken, UserController.getUserById);
    api.patch(
        "/api/v1/user/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        UserController.updateUser
    );
    api.delete(
        "/api/v1/user/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        UserController.deleteUser
    );
    api.post("/api/v1/user/request-password-reset", UserController.forgotPasswordRequest);
    api.post("/api/v1/user/password-reset", UserController.resetPassword);

    //DashBoard
    api.get(
        "/api/v1/dashboard",
        authenticateToken,
        DashboardController.getTransactionStatistics
    );
    api.get(
        "/api/v1/dashboard/analystRank",
        authenticateToken,
        DashboardController.getAnalystRank
    );
    api.get(
        "/api/v1/dashboard/merchantRant",
        authenticateToken,
        DashboardController.getMerchantRank
    );
    api.get(
        "/api/v1/dashboard/recentFraud",
        authenticateToken,
        DashboardController.getRecentFraudTransaction
    );

    //Transaction
    api.post("/api/v1/transaction", authenticateToken, Transaction.createTransaction);
    api.get("/api/v1/transaction", authenticateToken, Transaction.getAllTransactions);
    api.get("/api/v1/transaction/:id", authenticateToken, Transaction.getTransactionById);
    api.patch(
        "/api/v1/transaction/:id",
        authenticateToken,
        Transaction.updateTransaction
    );
    api.delete(
        "/api/v1/transaction/:id",
        authenticateToken,
        Transaction.deleteTransaction
    );

    //Merchant
    api.post(
        "/api/v1/merchant",
        authenticateToken,
        onlyPermit("ADMIN"),
        Merchant.createMerchant
    );
    api.get("/api/v1/merchant", authenticateToken, Merchant.getAllMerchant);
    api.get("/api/v1/merchant/:id", authenticateToken, Merchant.getMerchantById);
    api.patch(
        "/api/v1/merchant/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        Merchant.updateMerchant
    );
    api.delete(
        "/api/v1/merchant/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        Merchant.deleteMerchant
    );

    //Contact
    api.post(
        "/api/v1/contact",
        authenticateToken,
        onlyPermit("ADMIN"),
        FraudContact.createContact
    );
    api.get("/api/v1/contact", authenticateToken, FraudContact.getAllContact);
    api.get("/api/v1/contact/:id", authenticateToken, FraudContact.getContactById);
    api.patch(
        "/api/v1/contact/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        FraudContact.updateContact
    );
    api.delete(
        "/api/v1/contact/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        FraudContact.deleteContact
    );

    //Channel
    api.post(
        "/api/v1/channel",
        authenticateToken,
        onlyPermit("ADMIN"),
        ChannelController.createChannel
    );
    api.get("/api/v1/channel", authenticateToken, ChannelController.getAllChannels);
    api.get("/api/v1/channel/:id", authenticateToken, ChannelController.getChannelById);
    api.patch(
        "/api/v1/channel/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        ChannelController.updateChannel
    );
    api.delete(
        "/api/v1/channel/:id",
        authenticateToken,
        onlyPermit("ADMIN"),
        ChannelController.deleteChannel
    );

    //Incorrect routes
    api.all("*", (req, res, next) => {
        errorResponse(
            new APIError(404, `Cannot ${req.method} ${req.url}`),
            req,
            res,
            next
        );
    });
    api.use(errorResponse);
};

export default injectRoutes;
