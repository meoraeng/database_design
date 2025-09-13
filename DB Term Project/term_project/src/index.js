import express from "express";
import logger from "morgan";
import path from "path";
import liveReload from 'livereload';
import connectLiveReload from 'connect-livereload';
import homeRouter from "./routes/homeRouter";
import adminRouter from "./routes/adminRouter";
import customerRouter from "./routes/customerRouter";



const PORT = 3000;

const liveReloadServer = liveReload.createServer(); 
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100)
});

const app = express();

app.use(connectLiveReload());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, 'public')));
// css 경로 설정

app.use(logger("dev"));

app.use("/", homeRouter);
app.use("/admin", adminRouter);
app.use("/customer", customerRouter);

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});