import express from "express";
import { createSql, selectSql, updateSql } from "../database/sql";
// TODO
// sql import

const router = express.Router();

router.get('/', async function (req, res) {
    const studentId = req.cookies.user; 
    
    // 모든 클래스 데이터를 가져옵니다.
    const Classes = await selectSql.getClasses();
    
    // 각 클래스에 부서 이름 추가
    const ClassesWithDNames = await Promise.all(
        Classes.map(async (classObj) => {
            const department = await selectSql.getDepartment(classObj.Department_id);
            return {
                ...classObj,
                department_name: department[0]?.name || null // 부서 이름이 없는 경우 null
            };
        })
    );


    // 관계 테이블에서 학생이 수강 신청한 수업 ID 목록을 가져옵니다.
    const studentClasses = await selectSql.getStudentClasses(studentId); 
    const studentClassIds = studentClasses.map(sc => sc.class_id);

    // CompleteClasses와 Classes 분류
    const CompleteClasses = ClassesWithDNames.filter(
        classObj => studentClassIds.includes(classObj.id)
    );
    console.log(ClassesWithDNames);

    const RemainingClasses = ClassesWithDNames.filter(
        classObj => !studentClassIds.includes(classObj.id)
    );

    if (req.cookies.user) {
        res.render('select', {
            user: req.cookies.user,
            Classes: RemainingClasses,
            CompleteClasses,
            title: "Complete Course List",
            title2: "Course List (Registration)"
        });
    } else {
        res.render('/');
    }
});


router.post('/', async(req, res) => {
    const data = {
        cId: req.body.applyBtn,
        sId: req.cookies.user,
    };
    
    await createSql.addRelations(data.cId, data.sId);

    await updateSql.updateRemaining(data.cId);

    if(await selectSql.checkRemain(data.cId)===0) {
        await updateSql.updateIsMax(data.cId);
    }

    res.redirect('/sugang');
});

module.exports = router;