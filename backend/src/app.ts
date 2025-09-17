import express from "express"
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import {dbConnect} from "./server.js"

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

dbConnect();

const PORT = process.env.PORT;
try {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
}
catch (error) {
  console.log("Server failed");
}



