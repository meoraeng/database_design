import express from 'express';
import { selectSql, deleteSql } from '../database/sql';

const router = express.Router();

router.get('/class', async (req, res) => {
    if (req.session.student != undefined) {
        const classes = await selectSql.getClass();
        res.render('delete', {
            title: "Delete",
            classes,  // 'classes' 데이터를 전달
        });
    } else {
        res.redirect('/');
    }
});



router.post('/class', async (req, res) => {
    console.log("delete :", req.body.delBtn);
    const data = {
        id: req.body.delBtn,
    };

    await deleteSql.deleteClass(data);

    res.redirect('/delete/class');
});


module.exports = router;
