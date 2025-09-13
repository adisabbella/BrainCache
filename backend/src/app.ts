import express from "express"
import {dbConnect} from "./server.js"

const app = express();
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



