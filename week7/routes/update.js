import express from 'express';
import { selectSql, updateSql } from '../database/sql';

const router = express.Router();

router.get('/student', async (_req, res) => {
    const student_res = await selectSql.getStudent();
    console.log(student_res);
    res.render('updateStudent', {
        main_title: "UPDATE 'Student' table",
        student_res,
    });
});
router.get('/department', async (_req, res) => {
    const department_res = await selectSql.getDepartment();
    console.log(department_res);
    res.render('updateDepartment', {
        main_title: "UPDATE 'Department' table",
        department_res,
    });
});

router.post('/student', async (req, res) => {
    const vars = req.body;
    const data = {
        Id: vars.id,
        Name: vars.name,
        Email: vars.email,
        PhoneNumber: vars.phone_number,
        Major: vars.major,
    }
    await updateSql.updateStudent(data);

    res.redirect('/update/student');
});
router.post('/department', async (req, res) => {
    const vars = req.body;
    const data = {
        Id: vars.id,
        Name: vars.name,
        Email: vars.email,
        PhoneNumber: vars.phone_number,
        RoomId: vars.Room_id,
    }
    await updateSql.updateDepartment(data);

    res.redirect('/update/department');
});

module.exports = router;
