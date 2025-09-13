import express from "express";
import logger from "morgan";
import path from 'path';

import homeRouter from '../routes/home';

const PORT = 3000;

const app = express();

app.use(express.static(path.join(__dirname, '/src')));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());
// 뷰 파일 위치 지정
app.set('views', path.join(__dirname, '../views'))
// 뷰 템플릿 엔진 hbs로 설정
app.set('view engine', 'hbs');

app.use(logger('dev')); // http 요청 로깅
// 루트 경로에 홈 라우터 설정
app.use('/', homeRouter);

//서버 시작
app.listen(3000, ()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
})