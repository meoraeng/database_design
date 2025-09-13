import express from 'express';
import { selectSql } from '../database/sql';

const router = express.Router();

router.get('/', (req,res) => {
    res.render('login');
})

router.post('/', async(req,res)=>{
    const vars= req.body;
    const students = await selectSql.getStudent();
    
    students.map((student) => {
        console.log('ID:', student.id);
        if (Number(vars.id) === student.id && Number(vars.phone_number) === student.phone_number) {
            console.log('login success!!');
            req.session.student = { id: student.id, checkLogin: true};
        }
    });

    if (req.session.student == undefined) {
        console.log('login failed!');
        res.send(`<script>
                    alert('login failed!);
                    location.href='/';
            </script>`)
    } else if (req.session.student.checkLogin) {
        console.log('login success!');
        res.redirect('/delete/class');
    }
})

module.exports = router;