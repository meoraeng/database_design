import mysql from 'mysql2';

require("dotenv").config();

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'sw051621!!',
    database: 'week5',
});

// async / await 사용
const promisePool = pool.promise();

// selec query
export const selectSql = {
  getUsers: async () => {
    const [rows] = await promisePool.query(`select * from student`);
    return rows;
  },
  getClasses: async() => {
    const [rows] = await promisePool.query(`select * from class`);
    return rows;
  },
  getStudentClasses: async(uid) => {
    const [rows] = await promisePool.query(`select * from class_student where student_id = ?`, [uid]);
    return rows;
  },
  getDepartment: async(did) => {
    const [rows] = await promisePool.query(`select * from department where id = ?`, [did]);
    return rows;
  },
  //TODO
  checkRemain: async(cId) => {
    const [rows] = await promisePool.query(`select remaining_participants from class where id =?`, [cId]);
    const remainingParticipants = rows[0].remaining_participants;

    return remainingParticipants;
  }
}


export const createSql = {
  addRelations: async(cId, sId)=>{
    const results = await promisePool.query(`
                INSERT INTO class_student (class_id, student_id) VALUES (?, ?)
            `, [cId, sId]
        )
    return results;
  }
}

export const updateSql = {
    updateRemaining: async(cId) => {
        const results = await promisePool.query(`
                UPDATE class
                SET remaining_participants = remaining_participants - 1
                WHERE id = ? AND remaining_participants > 0
            `, [cId]
        )
        return results[0];
    },
    updateIsMax: async(cId) => {
        const results = await promisePool.query(`
                UPDATE class
                SET isMax = 1
                WHERE id = ?
            `, [cId]
        )
        return results;
    }
}