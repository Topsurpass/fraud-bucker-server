import appController from "../controllers/AppController/index.js";
import userController from "../controllers/UserController/index.js";

const injectRoutes = (api) => {
	api.get("/status", appController.getStatus);
	api.post("/register", userController.signUp);
	api.post("/signin", userController.signIn);
	api.post("/newToken", userController.getnewToken);
};

export default injectRoutes;
