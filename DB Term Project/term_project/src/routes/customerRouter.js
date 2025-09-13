import express from "express";
import { deleteSql, selectSql, transactionSql, updateSql } from "../database/sql";

// 로그인 한 유저(customer, admin 둘다) 사용 가능한 요청 처리
const router = express.Router();
// -------------------
// get 요청
// --------------------
router.get('/', async (req, res) => {
    if (!req.cookies.userInfo) {
        // 로그인 정보가 없는 유저는 장바구니 이용이 불가능
        res.redirect("/");
        return;
    }
    const { name, role } = req.cookies.userInfo;
  
    // 책 정보 select문으로 가져오기
    const bookList = await selectSql.getBooks();
  
    // 각 책 정보에 작가, 수상기록, 재고 정보 포함 (비동기 작업 처리 -> 정보를 다 가져오기전에 render하는것을 막기 위해서) 
    
    try {
        const updatedBooks = await transactionSql.updatedBookList(bookList);
        
        // 장바구니 담기 및 예약 성공 or 실패 메시지를 세션 또는 쿼리 파라미터로 전달받아 알림창 표시
        const { successMessage, errorMessage } = req.query;

        // customer페이지를 render하면서 함께 보내는 정보들
        res.render('customer', {
        layout: 'layout', // GNB, Footer를 띄우기 위한 레이아웃
        title: 'Customer Dashboard', // 사이트 제목
        user: { username: name }, // 환영문구에 이름을 넣기 위해 전달
        isAdmin: role === 'Admin', //admin인 경우 true(customer의 기능을 이용하면서 레이아웃에서 admin메뉴도 함께 보기 위해)
        bookList: updatedBooks, // 메인화면에서 책 리스트를 띄우기 위한 정보
        successMessage, // 담기 및 예약 성공 or 실패헀을 경우 알림창을 띄우기 위해 전달
        errorMessage,
    });
    } catch (error) {
        console.error('Error updating book list:', error);
    }    
});

router.get('/reservations', async (req,res)=> {
    const email = req.cookies.userInfo.id;
    const {name, role} = req.cookies.userInfo;

    const reservationList = await selectSql.getReservationList(email);
    
    res.render('reservations', {
        layout:'layout', 
        reservationList,
        user: {username: name},
        isAdmin: role === 'Admin'
    })
})

router.get('/logout', (req,res) => {
    if(req.cookies.userInfo) {
        res.clearCookie('userInfo')
        res.redirect("/");
    } else {
        res.redirect("/");
    }
})

router.get('/shopping_basket', async (req, res) => {
    if (!req.cookies.userInfo) {
        // 로그인 정보가 없는 유저는 장바구니 이용이 불가능
        res.redirect('/');
    }
    const email = req.cookies.userInfo.id;
    const {name, role} = req.cookies.userInfo;
    const {errorMessage, successMessage} = req.query;

    try {
    // 활성화 장바구니 (Order_date가 NULL인 장바구니)
    const activeBasketList = await selectSql.getActiveBasket(email);
    // 비활성화 장바구니 (Order_date가 NOT NULL인 장바구니)
    const inactiveBasketList = await selectSql.getInactiveBasket(email);

    
    res.render('shopping_basket', {
        layout: 'layout',
        user:{username:name},
        isAdmin: role === 'Admin',
        activeBasketList,
        inactiveBasketList,
        errorMessage,
        successMessage
    });
    } catch (error) {
        console.error('장바구니 조회 실패:', error.message);
        res.redirect('/?errorMessage=장바구니를 불러오는 중 오류가 발생했습니다.');
    }
});

//------------------------- 
//post 요청
//---------------------------
router.post('/reservation', async (req,res)=>{
    const {ISBN, pickupTime} = req.body;
    const email = req.cookies.userInfo.id;
    
    try {
        if (!ISBN) {
            throw new Error('유효한 ISBN이 없습니다.');
        }

        const result = await transactionSql.reservationItem(email, ISBN, pickupTime);
        
        if (!result){
            throw new Error('예약에 실패하였습니다.');
        }

        res.redirect('/customer?successMessage=성공적으로 예약되었습니다!');
    } catch(error) {
        console.error('예약 처리중 에러 발생:', error.message);
        res.redirect(`/customer?errorMessage=${encodeURIComponent(error.message)}`); // encodeURIComponent -> 특수문자 인코딩을 위한 메소드
    }
})
router.post('/reservation/modify', async (req,res)=> {
    const {reservationID, pickupTime} = req.body;

    try{
        if(!reservationID){
            throw new Error('유효한 예약 ID가 없습니다.');
        }

        const result = await updateSql.modifyReservation(reservationID, pickupTime);

        if(!result) {
            throw new Error('예약 수정에 실패하였습니다.');
        }
        res.redirect('/customer/reservations');
    } catch(error){
        console.error('예약 수정중 에러 발생:', error.message);
        res.redirect(`/customer?errorMessage=${encodeURIComponent(error.message)}`); // encodeURIComponent -> 특수문자 인코딩을 위한 메소드
    }
})
router.post('/reservation/cancel', async (req,res) => {
    const {reservationID} = req.body;

    try{
        if(!reservationID){
            throw new Error('유효한 예약 ID가 없습니다.');
        }

        const result = await transactionSql.removeReservation(reservationID);

        if(!result) {
            throw new Error('예약 수정에 실패하였습니다.');
        }

        res.redirect('/customer/reservations');
    }catch(error) {
        console.error('예약 데이터 삭제중 에러 발생:', error.message);
        res.redirect(`/customer?errorMessage=${encodeURIComponent(error.message)}`); // encodeURIComponent -> 특수문자 인코딩을 위한 메소드
    }
})

// 장바구니 담기 버튼 요청
router.post('/shopping_basket', async (req, res) => {
    const { ISBN } = req.body;
    const email = req.cookies.userInfo.id; 
    
    try {
        if (!ISBN) {
        throw new Error('유효한 ISBN이 없습니다.');
        }
        
        // 데이터베이스 조작
        const result = await transactionSql.updateBasketItem(email, ISBN); // 예시: 삽입 함수 호출

        if (!result) {
            throw new Error('장바구니 담기에 실패했습니다.');
        }

        // 성공 시
        res.redirect('/customer?successMessage=성공적으로 장바구니에 추가되었습니다!');
    } catch (error) {
        // 실패 시
        console.error('장바구니 추가중 에러가 발생:', error.message);
        res.redirect(`/customer?errorMessage=${encodeURIComponent(error.message)}`); // encodeURIComponent -> 특수문자 인코딩을 위한 메소드
    }
  });
// 장바구니 책 삭제 요청
router.post('/shopping_basket/remove', async (req,res)=>{
    const {basketID, ISBN} = req.body;
    try {
        const affectedRows = await deleteSql.removeBasketItem(basketID,ISBN);

        if(!affectedRows) {
            throw new Error('삭제에 실패했습니다');
        }
        res.redirect('/customer/shopping_basket');
    } catch(error){
        console.log('장바구니 아이템 삭제중 에러발생:', error.message);
    }
});
// 장바구니 책 구매 요청
router.post('/shopping_basket/purchase', async (req,res)=>{
    const basketID = req.body.basketID[0];
    try {
        const affectedRows = await transactionSql.purchaseBasket(basketID);

        if(!affectedRows) {
            throw new Error('구매에 실패했습니다.')
        }
        res.redirect(`/customer/shopping_basket?successMessage=성공적으로 구매처리 되었습니다!`);
    } catch (error){
        res.redirect(`/customer/shopping_basket?errorMessage=${encodeURIComponent(error.message)}`);
    }
});

router.post('/search', async (req, res) => {
    if (!req.cookies.userInfo) {
        res.redirect('/');
        return;
    }

    const { name, role } = req.cookies.userInfo;
    const { searchType, searchQuery } = req.body; // 검색 옵션과 검색어 가져오기

    try {
        let searchResults = [];
        
        // 검색 조건에 따라 검색 SQL 호출
        if (searchType === 'title') {
            searchResults = await selectSql.searchByTitle(searchQuery);
        } else if (searchType === 'award') {
            searchResults = await selectSql.searchByAwardName(searchQuery);
        } else if (searchType === 'author') {
            searchResults = await selectSql.searchByAuthorName(searchQuery);
        } else {
            throw new Error('잘못된 검색 유형입니다.');
        }

        const updatedBooks = await transactionSql.updatedBookList(searchResults);
        
        console.log('검색: ',updatedBooks);

        res.render('customer', {
            layout: 'layout',
            title: 'Search Results',
            user: { username: name },
            isAdmin: role === 'Admin',
            bookList: updatedBooks,
        });
    } catch (error) {
        console.error('Search Error:', error);

        res.redirect('/customer?errorMessage=검색 중 오류가 발생했습니다.');
    }
});




module.exports = router;