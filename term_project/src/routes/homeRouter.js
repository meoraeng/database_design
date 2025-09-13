import express from "express";
import cookieParser from "cookie-parser";
import expressSession from 'express-session';
import { selectSql } from "../database/sql";

const router = express.Router();
router.use(cookieParser());
router.use(expressSession({
    secret: 'dbdesignterm',
    resave: true,
    saveUninitialized: true,
}))
router.get('/', async (req,res) => {
    // 쿼리에 에러 정보가 있는 경우 main.hbs에 전달하고 렌더링
    const error = req.query.error === 'invalid_credentials' ? 'Invalid username or password.' : null;
    // 쿠키에 로그인 정보가 없는 경우 로그인을 먼저 하도록 로그인 페이지(main)를 렌더링
    if(!req.cookies.userInfo){
        res.render('main', {
            layout: 'layout', 
            title: 'Home',
            error,});
    } else {
        // 쿠키에 정보가 있는 경우 우선 /customer 페이지로 보내준다. 
        const role = req.cookies.userInfo.role;
        if(role === 'Customer' || role === 'Admin'){ // req.cookies.userInfo.id로 << 수정
            res.redirect('/customer');
        }
    }
})

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await selectSql.getCustomerByEmail(email);
    
    if(user && user.Password === password){
        const userInfo = {
            id: user.Email,
            role: user.Role,
            name: user.Name,
        };
        
        res.cookie('userInfo', userInfo, {
            httpOnly:true,
            expires: new Date(Date.now() + 36000000), //10시간
        });
        
        res.redirect('/customer');
    } else {
        // 로그인 로직에서 실패한 경우 error정보를 query에 담아서 '/'으로 돌려보낸다.
        res.redirect('/?error=invalid_credentials')
    }
})
module.exports = router;