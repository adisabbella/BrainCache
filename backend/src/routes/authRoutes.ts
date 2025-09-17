import express from "express"
import { userSchema } from "../schemas/authSchemas.js";
import { validate } from "../middlewares/validate.js";
import { signUp, signIn } from "../controllers/authController.js";

const router = express.Router();

router.post('/register', validate(userSchema), signUp);
router.post('/signin', validate(userSchema), signIn);

export default router;