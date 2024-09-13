import App from "../controllers/App/index.js";
import Auth from "../controllers/Auth/index.js";
import Transaction from "../controllers/Transaction/index.js";
import authenticateToken from "../middlewares/authenticate.js";
import Merchant from "../controllers/Merchant/index.js";
import FraudContact from "../controllers/Contact/index.js";
import UserController from "../controllers/Users/index.js";
import ChannelController from "../controllers/Channel/index.js";
import DashboardController from "../controllers/Dashboard/index.js";

const injectRoutes = (api) => {
    //App
    api.get("/api/v1/app/status", App.getStatus);

    //Auth
    api.post("/api/v1/auth/signin", Auth.signIn);
    api.post("/api/v1/auth/newToken", Auth.getNewToken);

    // User
    api.post("/api/v1/user", authenticateToken, UserController.createUser);
    api.get("/api/v1/user", authenticateToken, UserController.getAllUser);
    api.get("/api/v1/user/:id", authenticateToken, UserController.getUserById);
    api.patch("/api/v1/user/:id", authenticateToken, UserController.updateUser);
    api.delete("/api/v1/user/:id", authenticateToken, UserController.deleteUser);

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
    api.post("/api/v1/merchant", authenticateToken, Merchant.createMerchant);
    api.get("/api/v1/merchant", authenticateToken, Merchant.getAllMerchant);
    api.get("/api/v1/merchant/:id", authenticateToken, Merchant.getMerchantById);
    api.patch("/api/v1/merchant/:id", authenticateToken, Merchant.updateMerchant);
    api.delete("/api/v1/merchant/:id", authenticateToken, Merchant.deleteMerchant);

    //Contact
    api.post("/api/v1/contact", authenticateToken, FraudContact.createContact);
    api.get("/api/v1/contact", authenticateToken, FraudContact.getAllContact);
    api.get("/api/v1/contact/:id", authenticateToken, FraudContact.getContactById);
    api.patch("/api/v1/contact/:id", authenticateToken, FraudContact.updateContact);
    api.delete("/api/v1/contact/:id", authenticateToken, FraudContact.deleteContact);

    //Channel
    api.post("/api/v1/channel", authenticateToken, ChannelController.createChannel);
    api.get("/api/v1/channel", authenticateToken, ChannelController.getAllChannels);
    api.get("/api/v1/channel/:id", authenticateToken, ChannelController.getChannelById);
    api.patch("/api/v1/channel/:id", authenticateToken, ChannelController.updateChannel);
    api.delete("/api/v1/channel/:id", authenticateToken, ChannelController.deleteChannel);
};

export default injectRoutes;
