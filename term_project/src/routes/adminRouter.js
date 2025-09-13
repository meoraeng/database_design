const express = require("express");
const router = express.Router();
const { deleteSql, insertSql, selectSql, transactionSql, updateSql } = require("../database/sql");

// 관리자만 가능한 요청 처리

// ----------------------
// GET 요청
// ----------------------
router.get('/', async (req, res) => {
    if (!req.cookies.userInfo) {
        // 로그인 정보가 없는 관리자 페이지 이용 불가
        res.redirect("/");
        return;
    }

    const { name, role } = req.cookies.userInfo;
    const { type, success, error } = req.query;

    // 테이블 이름 매핑
    const tableMapping = {
        books: 'Book',
        authors: 'Author',
        awards: 'Award',
        warehouses: 'Warehouse',
        inventory: 'Inventory',
        contains: 'Contains'
    };

    // 기본 데이터 객체
    let data = {
        books: [],
        authors: [],
        awards: [],
        warehouses: [],
        inventory: [],
        contains: []
    };
    
    // 기본 scripts 배열
    let scripts = [];

    try {
        if (type && tableMapping[type]) {
            // 동적으로 데이터 가져오기
            data[type] = await selectSql.getTableData(tableMapping[type]);

            if (type === "books") {
                // 비동기 작업을 병렬로 처리
                data.books = await Promise.all(
                    data.books.map(async (item) => {
                        const authors = await selectSql.getAuthorNameByISBN(item.ISBN);

                        const uniqueAuthors = [...new Set(authors.map(author => author.AuthorName))];
                        return {
                            ...item,
                            AuthorName: uniqueAuthors.join(', ') || 'Unknown'
                        };
                    })
                );
            }

            // 각 도메인에 맞는 스크립트 추가
            scripts.push(`${type}.js`);
        }

        res.render('admin', {
            layout: 'layout',
            title: 'Admin Dashboard',
            user: { username: name },
            ...data, // 데이터를 스프레드 연산자로 전달
            isAdmin: role === 'Admin',
            isBooks: type === 'books',
            isAuthors: type === 'authors',
            isAwards: type === 'awards',
            isWarehouses: type === 'warehouses',
            isInventory: type === 'inventory',
            isContains: type === 'contains',
            successMessage: success,
            errorMessage: error,
            scripts // scripts 배열 전달
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// ----------------------
// POST 요청
// ----------------------

// 책 정보 추가
router.post('/books/add', async (req, res) => {
    try {
        const { title, year, category, price, authorIds } = req.body;

        // 데이터베이스 삽입
        await transactionSql.insertBook({ title, year, category, price }, authorIds);
        
        const successMessage = "책이 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=books&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error adding book:', error);
        let errorMessage = "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=books&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 책 정보 수정
router.post('/books/edit/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params; // 수정할 책의 ISBN
        const { title, year, category, price } = req.body; // 수정할 데이터

        // 데이터베이스에서 책 정보 및 저자 정보 업데이트
        const affectedRows = await updateSql.updateBook(isbn, { title, year, category, price });

        if (affectedRows === 0) {
            const errorMessage = "수정할 책을 찾을 수 없거나 변경 사항이 없습니다.";
            return res.redirect(`/admin?type=books&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "책 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=books&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error editing book:', error);
        let errorMessage = "데이터 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=books&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 책 정보 삭제
router.post('/books/delete/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params; // 삭제할 책의 ISBN

        // 데이터베이스에서 책 정보 및 저자 정보 삭제
        const affectedRows = await transactionSql.deleteBook(isbn);

        if (affectedRows === 0) {
            const errorMessage = "삭제할 책을 찾을 수 없습니다.";
            return res.redirect(`/admin?type=books&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "책이 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=books&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error deleting book:', error);
        let errorMessage = "데이터 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=books&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 작가 정보 추가
router.post('/authors/add', async (req, res) => {
    try {
        const { name, address, url } = req.body;

        // Author 정보를 삽입
        await insertSql.insertAuthor({ name, address, url });

        const successMessage = "작가가 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=authors&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error adding author:', error);
        let errorMessage = "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=authors&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 작가 정보 수정
router.post('/authors/edit/:id', async (req, res) => {
    try {
        const { id } = req.params; // URL에서 AuthorID 가져오기
        const { name, address, url } = req.body; // 수정된 값 가져오기

        // 작가 정보 업데이트
        const updatedRows = await updateSql.updateAuthor(id, { name, address, url });

        if (updatedRows === 0) {
            const errorMessage = "수정할 작가를 찾을 수 없거나 변경 사항이 없습니다.";
            return res.redirect(`/admin?type=authors&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "작가 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=authors&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error editing author:', error);
        let errorMessage = "데이터 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=authors&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 작가 정보 삭제
router.post('/authors/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 트랜잭션으로 저자 및 관련 책 삭제
        const affectedRows = await transactionSql.deleteAuthorAndBooks(id);

        if (affectedRows === 0) {
            const errorMessage = "삭제할 작가를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=authors&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "작가와 관련된 모든 데이터가 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=authors&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error deleting author and related books:', error);
        let errorMessage = "데이터 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=authors&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 상 정보 추가
router.post("/awards/add", async (req, res) => {
    try {
        const { name, year, isbn } = req.body;

        // ISBN 유효성 확인
        const book = await selectSql.getBookByISBN(isbn); // 해당 ISBN의 책이 있는지 확인
        if (!book || book.length === 0) {
            const errorMessage = "ISBN에 해당되는 책이 없습니다.";
            return res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
        }

        // Award 데이터 추가
        await insertSql.insertAward({ name, year, isbn });

        const successMessage = "상 정보가 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=awards&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error adding award:", error);
        let errorMessage = "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 상 정보 수정
router.post("/awards/edit", async (req, res) => {
    try {
        const { isbn } = req.body; // 수정할 ISBN
        const { name, year } = req.query; // name, year (고정값), isbn (수정값)

        // 입력된 ISBN 유효성 확인
        const book = await selectSql.getBookByISBN(isbn);
        if (!book || book.length === 0) {
            const errorMessage = "ISBN에 해당되는 책이 없습니다.";
            return res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
        }

        // Award 데이터 업데이트
        const affectedRows = await updateSql.updateAward({ name, year, isbn });

        if (affectedRows === 0) {
            const errorMessage = "수정할 상 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "상 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=awards&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error editing award:", error);
        let errorMessage = "데이터 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 상 정보 삭제
router.post("/awards/delete", async (req, res) => {
    try {
        const { name, year } = req.body;

        // Award 데이터 삭제
        const affectedRows = await deleteSql.deleteAward(name, year);

        if (affectedRows === 0) {
            const errorMessage = "삭제할 상 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "상 정보가 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=awards&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error deleting award:", error);
        let errorMessage = "데이터 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=awards&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 창고 정보 추가
router.post("/warehouses/add", async (req, res) => {
    try {
        const { code, address, phone } = req.body;
        
        // 창고 추가
        const result = await insertSql.insertWarehouse({ code, address, phone });

        if (result === 0) {
            throw new Error("창고 추가에 실패했습니다. 중복된 코드일 수 있습니다.");
        }

        const successMessage = "창고가 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=warehouses&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error adding warehouse:", error.message);
        let errorMessage = error.message || "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=warehouses&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 창고 정보 수정
router.post('/warehouses/edit/:code', async (req, res) => {
    try {
        const { code } = req.params; // 수정하려는 Warehouse의 코드
        const { address, phone } = req.body; // 새로 입력된 Address와 Phone

        // 데이터베이스 업데이트
        const affectedRows = await updateSql.updateWarehouse(code, { address, phone });

        if (affectedRows === 0) {
            const errorMessage = "수정할 창고를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=warehouses&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "창고 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=warehouses&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error updating warehouse:', error);
        let errorMessage = "데이터 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=warehouses&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 창고 정보 삭제
router.post('/warehouses/delete/:code', async (req, res) => {
    try {
        const { code } = req.params;

        // 해당 창고가 Inventory에 참조되고 있는지 확인
        const inventoryItems = await selectSql.getInventoryByWarehouseCode(code);

        if (inventoryItems.length > 0) {
            // Inventory 데이터 삭제
            await deleteSql.deleteInventoryByWarehouseCode(code);
            console.log(`Related inventory data for warehouse ${code} deleted.`);
        }

        // Warehouse 삭제
        const affectedRows = await deleteSql.deleteWarehouse(code);

        if (affectedRows === 0) {
            const errorMessage = "삭제할 창고를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=warehouses&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "창고가 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=warehouses&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        let errorMessage = "데이터 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=warehouses&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 재고 정보 생성
router.post("/inventory/add", async (req, res) => {
    try {
        const { code, isbn, number } = req.body;

        // Inventory 생성
        await insertSql.insertInventory({ code, isbn, number });

        const successMessage = "재고 정보가 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=inventory&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error inserting inventory:", error.message);
        let errorMessage = "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=inventory&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 재고 정보 수정
router.post("/inventory/edit", async (req, res) => {
    try {
        const { code, isbn } = req.query; // GET 요청 쿼리에서 Code와 ISBN 가져오기
        const { number } = req.body; // POST 요청 데이터에서 수정된 재고 수량 가져오기

        // Inventory 수정
        const affectedRows = await updateSql.updateInventory({ code, isbn, number });

        if (affectedRows === 0) {
            const errorMessage = "수정할 재고 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=inventory&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "재고 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=inventory&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error updating inventory:", error.message);
        let errorMessage = "재고 정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=inventory&error=${encodeURIComponent(errorMessage)}`);
    }
});

// 재고 정보 삭제
router.post("/inventory/delete", async (req, res) => {
    try {
        const { code, isbn } = req.body; // POST 요청 데이터에서 Code와 ISBN 가져오기

        // Inventory 삭제
        const affectedRows = await deleteSql.deleteInventory({ code, isbn });

        if (affectedRows === 0) {
            const errorMessage = "삭제할 재고 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=inventory&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "재고 정보가 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=inventory&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error deleting inventory:", error.message);
        let errorMessage = "재고 정보 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=inventory&error=${encodeURIComponent(errorMessage)}`);
    }
});

// Contains 정보 추가
router.post("/contains/add", async (req, res) => {
    try {
        const { basketId, isbn, number } = req.body;

        // Contains 추가
        await insertSql.insertContains({ basketId, isbn, number });

        const successMessage = "Contains 정보가 성공적으로 추가되었습니다.";
        res.redirect(`/admin?type=contains&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error inserting into Contains:", error.message);
        let errorMessage = "데이터 추가 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=contains&error=${encodeURIComponent(errorMessage)}`);
    }
});

// Contains 정보 수정
router.post("/contains/edit", async (req, res) => {
    try {
        const { basketId, isbn } = req.query;
        const { number } = req.body;

        // Contains 데이터 수정
        const updatedRows = await updateSql.updateContains({ basketId, isbn, number });

        if (updatedRows === 0) {
            const errorMessage = "수정할 Contains 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=contains&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "Contains 정보가 성공적으로 수정되었습니다.";
        res.redirect(`/admin?type=contains&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error updating Contains:", error.message);
        let errorMessage = "Contains 정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=contains&error=${encodeURIComponent(errorMessage)}`);
    }
});

// Contains 정보 삭제
router.post("/contains/delete", async (req, res) => {
    try {
        const { basketId, isbn } = req.body;

        // Contains 데이터 삭제
        const deletedRows = await deleteSql.deleteContains({ basketId, isbn });

        if (deletedRows === 0) {
            const errorMessage = "삭제할 Contains 정보를 찾을 수 없습니다.";
            return res.redirect(`/admin?type=contains&error=${encodeURIComponent(errorMessage)}`);
        }

        const successMessage = "Contains 정보가 성공적으로 삭제되었습니다.";
        res.redirect(`/admin?type=contains&success=${encodeURIComponent(successMessage)}`);
    } catch (error) {
        console.error("Error deleting Contains:", error.message);
        let errorMessage = "Contains 정보 삭제 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            errorMessage = "다른 관리자의 수정으로 현재 접근할 수 없습니다. 다시 시도해주세요.";
        }
        res.redirect(`/admin?type=contains&error=${encodeURIComponent(errorMessage)}`);
    }
});

module.exports = router;