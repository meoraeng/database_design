import mysql from 'mysql2';

require("dotenv").config();

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: process.env.PASSWORD,
    database: 'week5'
})

const promisePool = pool.promise();

// select query
export const selectSql = {
    getBuilding: async () => {
        const sql = 'select * from Building';
        const [result] = await promisePool.query(sql);
        return result;
    },
    getDepartment: async () => {
        const sql = 'select * from Department';
        const [result] = await promisePool.query(sql);
        return result;
    },
    getRoom: async () => {
        const sql = 'select * from Room';
        const [result] = await promisePool.query(sql);
        return result;
    },
    getStudent: async () => {
        const sql = 'select * from Student';
        const [result] = await promisePool.query(sql);
        return result;
    },
    getClass: async () => {
        const sql = 'select * from Class';
        const [result] = await promisePool.query(sql);
        return result;
    }
};

// insert query
export const insertSql = {
    setStudent: async (data) => {
        const sql = `insert into student values (
            "${data.Id}", "${data.Name}", "${data.Email}", 
            "${data.PhoneNumber}", "${data.Major}", "${data.Department}"
        )`;
        console.log(data);
        await promisePool.query(sql);
    },
};

// update query
export const updateSql = {
    updateStudent: async (data) => {
        console.log(data);
        const sql = `
            UPDATE student
            SET id = ${data.id}, name = "${data.Name}",
                email = "${data.Email}", phone_number = "${data.PhoneNumber}",
                major = "${data.Major}"
            WHERE id = ${data.Id};
        `;
        console.log(sql);
        await promisePool.query(sql);
    },
    updateDepartment: async (data) => {
        console.log(data);
        const sql = `
            UPDATE department
            SET id = "${data.Id}", name = "${data.Name}", email = "${data.Email}", phone_number = "${data.PhoneNumber}", Room_id = "${data.RoomId}"
            WHERE id = ${data.Id};
        `
        console.log(sql);
        await promisePool.query(sql);
    }
};
export const deleteSql = {
    deleteClass: async (data) => {
        console.log(data);
        const sql = `
            delete from class where id = ${Number(data.id)}
        `
        console.log(sql);
        await promisePool.query(sql);
    }
}