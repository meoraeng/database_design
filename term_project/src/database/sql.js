import mysql from 'mysql2';

require("dotenv").config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'BookStore',
  waitForConnections: true,
  connectionLimit: 20,
});

// lock test용 딜레이 함수
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};



// 기본 격리 수준과 자동 커밋 설정
pool.on('connection', (connection) => {
  connection.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
    if (err) {
      console.error('Error setting isolation level:', err);
    }
  });
  connection.query('SET autocommit = 1', (err) => {
    if (err) {
      console.error('Error setting autocommit:', err);
    }
  });
});
// async / await 사용
const promisePool = pool.promise();


// selec query
export const selectSql = {
  getBooks: async ()=>{
    const [rows] = await promisePool.query(`select * from Book LIMIT 2000`);
    return rows;
  },
  getBookByISBN: async (isbn)=>{
    const query = `
      SELECT * FROM Book WHERE ISBN = ?;
    `;

    try {
      const connection = await promisePool.getConnection();
      const [rows] = await connection.query(query, [isbn]);
      connection.release();
      return rows;
    } catch (error) {
      console.error("Error fetching book by ISBN:", error);
      throw error;
    }
  },
  getInventoryByWarehouseCode: async (code)=>{
    try {
      const [rows] = await promisePool.query(
        `SELECT * FROM Inventory WHERE Code = ?`,
        [code]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching inventory by warehouse code:', error);
      throw error;
    }
  },
  getAuthorNameByISBN: async (ISBN)=>{
    try {
      const [rows] = await promisePool.query(`
        SELECT 
            A.Name AS AuthorName
        FROM 
            Book B
        JOIN 
            Written_by W ON B.ISBN = W.ISBN
        JOIN 
            Author A ON W.AuthorID = A.AuthorID
        WHERE 
            B.ISBN = ?;
      `, [ISBN]);
      return rows;
      
    }catch(err) {
      console.log(err);
    }
      
  },
  getTableData: async (tableName)=>{
    const [rows] = await promisePool.query(`SELECT * FROM ??`, [tableName]);
    return rows;
  },
  getCustomerByEmail: async (email) => {
    const [rows] = await promisePool.query(`select * from Customer where Email='${email}'`);
    return rows[0];
  },
  searchByTitle: async (title) => {
    const [rows] = await promisePool.query(`
        SELECT 
          b.ISBN, b.Title, b.Year, b.Category, b.Price
        FROM 
          Book b
        WHERE 
          b.Title = ?;
      `, [title])
    return rows;
  },
  searchByAwardName: async (name) => {
    const [rows] = await promisePool.query(`
        SELECT 
            b.ISBN, 
            b.Title, 
            b.Year, 
            b.Category, 
            b.Price
        FROM 
            Book b
        JOIN 
            Award aw ON b.ISBN = aw.ISBN
        WHERE 
            aw.Name = ?;
      `, [name])
    return rows;
  },
  searchByAuthorName: async (name) => {
    const [rows] = await promisePool.query(`
        SELECT 
        b.ISBN, b.Title, b.Year, b.Category, b.Price
        FROM 
          Book b
        JOIN Written_by wb ON b.ISBN = wb.ISBN
        JOIN Author a ON wb.AuthorID = a.AuthorID
        WHERE 
          a.Name = ?;
      `, [name])
    return rows;
  },
  getActiveBasket: async (email) => { // 활성화 장바구니 (Order_date가 NULL인 장바구니)
    const [rows] = await promisePool.query(`
      SELECT b.BasketID, book.Title, book.Price, book.ISBN ,c.Number 
      FROM shopping_basket b
      JOIN Contains c ON b.BasketID = c.BasketID
      JOIN Book book ON c.ISBN = book.ISBN
      WHERE b.Email = ? AND b.Order_date IS NULL
    `, [email]);
    return rows;
  },
  getInactiveBasket: async (email) => { // 비활성화 장바구니 (Order_date가 NOT NULL인 장바구니)
    const [rows] = await promisePool.query(`
      SELECT b.BasketID, book.Title, book.Price, c.Number, DATE_FORMAT(b.Order_date, '%Y-%m-%d %H:%i') AS Order_date  
      FROM shopping_basket b
      JOIN Contains c ON b.BasketID = c.BasketID
      JOIN Book book ON c.ISBN = book.ISBN
      WHERE b.Email = ? AND b.Order_date IS NOT NULL
    `, [email]);
    return rows;
  },
  getReservationList: async (email) => {
    const [rows] = await promisePool.query(`
      SELECT 
        r.ID, 
        DATE_FORMAT(r.Reservation_date, '%Y-%m-%d %H:%i') as Reservation_date, 
        DATE_FORMAT(r.Pickup_time, '%Y-%m-%d %H:%i') as Pickup_time, 
        r.ISBN, 
        b.Title as Title, 
        r.Email 
      FROM 
        Reservation r
      JOIN 
        Book b
      ON 
        r.ISBN = b.ISBN
      WHERE 
        r.Email = ?
      ORDER BY r.ID ASC
    `, [email]);
    return rows;
  }
}
export const insertSql = {
  insertAuthor: async ({ name, address, url }) => {
    try {
        const [result] = await promisePool.query(
            `
            INSERT INTO Author (Name, Address, URL)
            VALUES (?, ?, ?)
            `,
            [name, address, url]
        );
        console.log('Author 추가 성공:', result.insertId);
        return result.insertId;
    } catch (error) {
        console.error('Author 추가 중 오류 발생:', error.message);
        throw error;
    }
  },
  insertAward: async ({ name, year, isbn }) => {
    const query = `
      INSERT INTO Award (Name, Year, ISBN)
      VALUES (?, ?, ?);
    `;
  
    try {
      const connection = await promisePool.getConnection();
      await connection.query(query, [name, year, isbn]);
      connection.release();
      console.log("Award inserted successfully");
    } catch (error) {
      console.error("Error inserting award:", error);
      throw error;
    }
  },
  insertWarehouse: async ({ code, address, phone }) => {
    try {
        const query = `
            INSERT INTO Warehouse (Code, Address, Phone)
            VALUES (?, ?, ?)
        `;
        const [result] = await promisePool.query(query, [code, address, phone]);
        
        return result.affectedRows; // 성공 시 1 반환
    } catch (error) {
        console.error("Error inserting warehouse:", error.message);
        throw error;
    }
  },
  insertInventory: async ({ code, isbn, number }) => {
    try {
      // 창고와 책이 존재하는지 확인
      const warehouseExists = await promisePool.query(
        `SELECT 1 FROM Warehouse WHERE Code = ?`,
        [code]
      );

      const bookExists = await promisePool.query(
        `SELECT 1 FROM Book WHERE ISBN = ?`,
        [isbn]
      );

      if (warehouseExists[0].length === 0) {
        throw new Error(`Warehouse with code '${code}' does not exist.`);
      }

      if (bookExists[0].length === 0) {
        throw new Error(`Book with ISBN '${isbn}' does not exist.`);
      }

      // Inventory 데이터 삽입
      const [result] = await promisePool.query(
        `INSERT INTO Inventory (Code, ISBN, Number) VALUES (?, ?, ?)`,
        [code, isbn, number]
      );

      return result.affectedRows;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Duplicate entry 에러 처리
        throw new Error(`창고 코드'${code}', 책 ISBN '${isbn}'이 이미 존재합니다`);
      }

      // 다른 에러는 그대로 던지기
      throw error;
    }
  },
  insertContains: async ({ basketId, isbn, number }) => {
    try {
        // Contains 데이터 삽입
        const [result] = await promisePool.query(
            `INSERT INTO Contains (BasketID, ISBN, Number) VALUES (?, ?, ?)`,
            [basketId, isbn, number]
        );
        return result.affectedRows;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Duplicate entry 에러 처리
            throw new Error(`BasketID '${basketId}'와 ISBN '${isbn}'의 데이터가 이미 존재합니다. 수정 기능으로 수량를 추가해주세요`);
        }
        console.error("Error inserting into Contains:", error);
        throw error; // 다른 에러는 그대로 던지기
    }
  },
}

export const transactionSql = {
  updateBasketItem: async (email, ISBN) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction(); // 트랜잭션 시작
  
      // 1) Customer Email로 Order_date가 없는 BasketID 찾기
      const [activeBasketResult] = await connection.query(
        'SELECT BasketID FROM shopping_basket WHERE Email = ? AND Order_date IS NULL',
        [email]
      );
  
      let basketID;
  
      if (activeBasketResult.length > 0) {
        // Order_date가 없는 활성 장바구니가 있는 경우, 이 Basket에 다음 로직 적용하기 위해 ID를 변수에 담는다.
        basketID = activeBasketResult[0].BasketID;
      } else {
        // Order_date가 없는 장바구니가 없는 경우, 모두 구매처리 된 장바구니 이므로 새 장바구니 생성
        const [newBasketResult] = await connection.query(
          'INSERT INTO shopping_basket (Email, Order_date) VALUES (?, NULL)',
          [email]
        );
        basketID = newBasketResult.insertId; // 새로 생성된 BasketID
      }
  
      // 2) Contains 테이블에서 BasketID와 ISBN으로 존재 여부 확인
      const [containsResult] = await connection.query(
        'SELECT Number FROM Contains WHERE BasketID = ? AND ISBN = ?',
        [basketID, ISBN]
      );
  
      if (containsResult.length > 0) {
        // 이미 데이터가 존재하는 경우 Number + 1
        await connection.query(
          'UPDATE Contains SET Number = Number + 1 WHERE BasketID = ? AND ISBN = ?',
          [basketID, ISBN]
        );
        console.log('Updated existing item in Contains table.');
      } else {
        // 존재하지 않는 경우 새 레코드 추가
        await connection.query(
          'INSERT INTO Contains (BasketID, ISBN, Number) VALUES (?, ?, 1)',
          [basketID, ISBN]
        );
        console.log('Contains Insert 성공');
      }
  
      // 트랜잭션 커밋 - 영구적 갱신
      await connection.commit();
      console.log('Contains 테이블 업데이트 성공');
      return true;
    } catch (error) {
      // 에러 발생 시 롤백 - 트랜잭션 실행 실패, 수행한 모든 결과 UNDO
      await connection.rollback();
      console.error('Contains 테이블 업데이트 실패:', error.message);
      throw error;
    } finally {
      // 연결 해제 (커넥션 제한으로 인해 DB가 멈추는걸 방지하기 위해)
      connection.release();
    }
  },
  purchaseBasket: async (basketID) => {
    const connection = await promisePool.getConnection();
  
    try {
      
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await connection.beginTransaction();
  
      // 1. Contains 테이블에서 inventoryNumberList 생성
      const [basketItems] = await connection.query(`
        SELECT ISBN, Number
        FROM Contains
        WHERE BasketID = ?
      `, [basketID]);
  
      if (basketItems.length === 0) {
        throw new Error('장바구니에 아이템이 없습니다.');
      }
  
      // inventoryNumberList 생성
      const inventoryNumberList = basketItems.reduce((acc, item) => {
        acc[item.ISBN] = item.Number;
        return acc;
      }, {});
  
      // 2. 각 ISBN의 재고 확인 및 창고 코드 조회
      for (const [ISBN, inventoryNumber] of Object.entries(inventoryNumberList)) {
        // 재고가 충분한 창고 리스트 조회
        const [inventoryRows] = await connection.query(`
          SELECT Code, Number
          FROM Inventory
          WHERE ISBN = ? AND Number >= ?
          ORDER BY Number DESC
        `, [ISBN, inventoryNumber]);
  
        // 조건에 맞는 창고가 없는 경우
        if (inventoryRows.length === 0) {
          throw new Error(`재고 부족: ISBN ${ISBN}`);
        }
  
        // 첫 번째 창고 선택
        const { Code } = inventoryRows[0];
  
        // Inventory의 Number 업데이트
        const [updateInventoryResult] = await connection.query(`
          UPDATE Inventory
          SET Number = Number - ?
          WHERE Code = ? AND ISBN = ?
        `, [inventoryNumber, Code, ISBN]);
  
        if (updateInventoryResult.affectedRows === 0) {
          throw new Error(`재고 업데이트 실패: 창고 ${Code}, ISBN ${ISBN}`);
        }
      }
  
      // 3. Shopping_basket의 Order_date 업데이트
      const [updateBasketResult] = await connection.query(`
        UPDATE Shopping_basket
        SET Order_date = NOW()
        WHERE BasketID = ?
      `, [basketID]);
  
      if (updateBasketResult.affectedRows === 0) {
        throw new Error('장바구니 업데이트 실패');
      }
  
      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('구매 처리 중 오류 발생:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  },
  reservationItem: async (email, ISBN, pickupTime) => {
    const connection = await promisePool.getConnection();
  
    try {
      // "2024-12-14T21:02" -> "2024-12-14 21:02:00"
      const pickupTimeLocal = pickupTime.replace('T', ' ') + ':00';
  
      
      await connection.query("SET time_zone = '+00:00';");
      
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await connection.beginTransaction();
  
      // 1. 재고가 있는 창고 리스트 조회
      const [inventoryRows] = await connection.query(`
        SELECT Code, Number
        FROM Inventory
        WHERE ISBN = ? AND Number > 0
        ORDER BY Number DESC
      `, [ISBN]);
  
      if (inventoryRows.length === 0) {
        throw new Error(`재고 부족: ISBN ${ISBN}`);
      }
  
      const { Code } = inventoryRows[0];
  
      // 2. Pickup_time 10분 전후 겹치는 Reservation 확인
      const [overlapReservations] = await connection.query(`
        SELECT *
        FROM Reservation
        WHERE Email = ?
          AND ISBN = ?
          AND ABS(TIMESTAMPDIFF(MINUTE, Pickup_time, ?)) <= 10
      `, [email, ISBN, pickupTimeLocal]);
  
      if (overlapReservations.length > 0) {
        throw new Error('10분 전후로 예약 정보가 존재합니다.');
      }
  
      // 3. Reservation 데이터 생성
      // Reservation_date는 DB 서버 현재 시간을 NOW()로 삽입 (UTC나 로컬 시간 설정은 DB나 세션 타임존에 따름)
      const [insertReservationResult] = await connection.query(`
        INSERT INTO Reservation (Reservation_date, Pickup_time, ISBN, Email)
        VALUES (NOW(), ?, ?, ?)
      `, [pickupTimeLocal, ISBN, email]);
  
      if (insertReservationResult.affectedRows === 0) {
        throw new Error('예약 생성 실패');
      }
  
      // 4. 선택된 창고의 Inventory 재고 감소
      const [updateInventoryResult] = await connection.query(`
        UPDATE Inventory
        SET Number = Number - 1
        WHERE Code = ? AND ISBN = ? AND Number > 0
      `, [Code, ISBN]);
  
      if (updateInventoryResult.affectedRows === 0) {
        throw new Error(`재고 업데이트 실패: 창고 ${Code}, ISBN ${ISBN}`);
      }
  
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('예약 처리 중 오류 발생:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  },
  removeReservation: async (reservationID) => {
    const connection = await promisePool.getConnection();

    try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();

        // 예약 정보 가져오기 (ISBN 추출) -> ISBN을 가져와야 재고 증가에 쓸 수 있음
        const [reservationRows] = await connection.query(`
            SELECT ISBN
            FROM Reservation
            WHERE ID = ?
        `, [reservationID]);

        if (reservationRows.length === 0) {
            throw new Error('해당 예약이 존재하지 않습니다.');
        }

        const { ISBN } = reservationRows[0];

        // 1. 예약 삭제
        const [deleteResult] = await connection.query(`
            DELETE FROM Reservation
            WHERE ID = ?
        `, [reservationID]);

        if (deleteResult.affectedRows === 0) {
            throw new Error('예약 삭제에 실패했습니다.');
        }

        // 2. 해당 ISBN의 재고가 있는 창고 리스트 조회 및 정렬
        const [warehouseRows] = await connection.query(`
            SELECT Code, Number
            FROM Inventory
            WHERE ISBN = ? AND Number > 0
            ORDER BY Number DESC
        `, [ISBN]);

        if (warehouseRows.length === 0) {
            throw new Error(`재고를 업데이트할 창고가 존재하지 않습니다: ISBN ${ISBN}`);
        }

        const { Code } = warehouseRows[0]; // 첫 번째 창고 선택

        // 3. 선택된 창고의 재고 증가
        const [updateInventoryResult] = await connection.query(`
            UPDATE Inventory
            SET Number = Number + 1
            WHERE ISBN = ? AND Code = ?
        `, [ISBN, Code]);

        if (updateInventoryResult.affectedRows === 0) {
            throw new Error(`재고 업데이트 실패: ISBN ${ISBN}, 창고 ${Code}`);
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('예약 취소 처리 중 오류 발생:', error.message);
        throw error;
    } finally {
        connection.release();
    }
  },
  updatedBookList: async (bookList) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();

        const updatedBooks = await Promise.all(
            bookList.map(async (book) => {
                try {
                    // 작가 정보 가져오기
                    const [authorInfo] = await connection.query(`
                        SELECT 
                            A.Name AS AuthorName
                        FROM 
                            Book B
                        JOIN 
                            Written_by W ON B.ISBN = W.ISBN
                        JOIN 
                            Author A ON W.AuthorID = A.AuthorID
                        WHERE 
                            B.ISBN = ?;
                    `, [book.ISBN]);

                    // 수상 기록 가져오기
                    const [awardInfo] = await connection.query(`
                        SELECT 
                            A.Name AS AwardName,
                            A.Year AS AwardYear
                        FROM 
                            Book B
                        JOIN 
                            Award A ON B.ISBN = A.ISBN
                        WHERE 
                            B.ISBN = ?;
                    `, [book.ISBN]);

                    // 재고 정보 가져오기
                    const [inventoryInfo] = await connection.query(`
                        SELECT 
                            I.Number AS Number
                        FROM 
                            Book B
                        JOIN 
                            Inventory I ON B.ISBN = I.ISBN
                        JOIN 
                            Warehouse W ON I.Code = W.Code
                        WHERE 
                            B.ISBN = ?;
                    `, [book.ISBN]);

                    // 데이터 처리
                    book.Author = authorInfo.map((author) => author.AuthorName).join(', ');
                    book.Award = awardInfo.map((award) => `${award.AwardName}(${award.AwardYear})`).join(', ');
                    book.Number = inventoryInfo.reduce((total, item) => total + (item.Number || 0), 0);

                    return book;
                } catch (error) {
                    console.error(`Error processing book with ISBN ${book.ISBN}:`, error);
                    throw error; // 내부 에러를 상위로 전달
                }
            })
        );

        await connection.commit(); // 모든 작업 성공 시 커밋
        return updatedBooks;
    } catch (error) {
        await connection.rollback(); // 에러 발생 시 롤백
        console.error('Transaction rolled back due to an error:', error);
        throw error; // 에러를 상위로 다시 던짐
    } finally {
        connection.release(); // 연결 해제
    }
  },
  insertBook: async (bookData, authorIds) => {
    const { title, year, category, price } = bookData; // 입력된 책 정보
    const connection = await promisePool.getConnection();

    try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();

        // 1. PK로 사용될, 13자리 ISBN 랜덤 생성 및 중복 체크
        let isbn;
        while (true) { // 중복없는 랜덤수가 나올때까지 반복
            isbn = String(Math.floor(1000000000000 + Math.random() * 9000000000000)); // 13자리 랜덤 숫자 생성
            const [existing] = await connection.query(
                'SELECT 1 FROM Book WHERE ISBN = ?',
                [isbn]
            );
            if (existing.length === 0) break; // 중복이 없으면 루프 종료
        }

        // 2. Book 테이블에 책 정보 삽입
        await connection.query(
            'INSERT INTO Book (ISBN, Title, Year, Category, Price) VALUES (?, ?, ?, ?, ?)',
            [isbn, title, year, category, price]
        );

        // 3. 작가 존재 여부 확인
        const authorIdArray = authorIds.split(',').map((id) => id.trim()); // 입력된 작가 ID 문자열을 배열로 변환 및 공백 제거
        const [existingAuthors] = await connection.query(
            `SELECT AuthorID FROM Author WHERE AuthorID IN (${authorIdArray.map(() => '?').join(',')})`,
            authorIdArray
        );

        // 존재하지 않는 작가 ID 찾기 (타입 일치화)
        const existingAuthorIds = new Set(existingAuthors.map((row) => String(row.AuthorID))); // DB 결과를 문자열로 변환
        const missingAuthors = authorIdArray.filter((id) => !existingAuthorIds.has(id));

        if (missingAuthors.length > 0) {
            throw new Error(`다음 작가들이 존재하지 않습니다: ${missingAuthors.join(', ')}`);
        }

       // 4. Written_by 테이블에 관계 추가
        for (const authorId of authorIdArray) { // 공동 작가의 경우, 모든 작가를 기준으로 관계 데이터 생성
          await connection.query(
              'INSERT INTO Written_by (ISBN, AuthorID) VALUES (?, ?)',
              [isbn, authorId]
          ); 
        }

        await connection.commit(); // 트랜잭션 커밋
        console.log(`추가된 책 정보: ${isbn}, 작가 정보: ${authorIds}`);
        return isbn; // 생성된 ISBN 반환
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        console.error('책 데이터 추가 에러:', error.message);
        throw error;
    } finally {
        connection.release(); // 연결 해제
    }
  },

  deleteBook: async (isbn) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Written_by 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Written_by WHERE ISBN = ?',
            [isbn]
        );

        // 2. Award 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Award WHERE ISBN = ?',
            [isbn]
        );

        // 3. Inventory 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Inventory WHERE ISBN = ?',
            [isbn]
        );

        // 4. Contains 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Contains WHERE ISBN = ?',
            [isbn]
        );

        // 5. Reservation 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Reservation WHERE ISBN = ?',
            [isbn]
        );

        // 6. Book 테이블 데이터 삭제
        await connection.query(
            'DELETE FROM Book WHERE ISBN = ?',
            [isbn]
        );

        // 커밋
        await connection.commit();
        console.log('책 데이터 및 관련 데이터가 성공적으로 삭제되었습니다.');
    } catch (error) {
        // 롤백
        await connection.rollback();
        console.error('책 삭제 중 오류 발생:', error.message);
        throw error;
    } finally {
        connection.release();
    }
  },
  deleteAuthorAndBooks: async (authorId) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. 저자가 참여한 책 정보 가져오기
      const [books] = await connection.query(
        `
        SELECT DISTINCT b.ISBN
        FROM Book b
        JOIN Written_by w ON b.ISBN = w.ISBN
        WHERE w.AuthorID = ?;
        `,
        [authorId]
      );

      // 2. Written_by에서 해당 AuthorID 삭제
      await connection.query(
        `DELETE FROM Written_by WHERE AuthorID = ?`,
        [authorId]
      );

      // 3. 작가가 없는 책 확인 및 삭제
      for (const book of books) {
        const [remainingAuthors] = await connection.query(
          `SELECT COUNT(*) AS AuthorCount FROM Written_by WHERE ISBN = ?`,
          [book.ISBN]
        );

        // 남은 작가가 없으면 책 삭제
        if (remainingAuthors[0].AuthorCount === 0) {
          await connection.query(
            `DELETE FROM Book WHERE ISBN = ?`,
            [book.ISBN]
          );
        }
      }

      // 4. Author 테이블에서 저자 삭제
      const [result] = await connection.query(
        `DELETE FROM Author WHERE AuthorID = ?`,
        [authorId]
      );

      if (result.affectedRows === 0) {
        throw new Error(`Author with ID ${authorId} not found.`);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting author and related books:', error);
      throw error;
    } finally {
      connection.release();
    }
  },
}

export const updateSql = {
  modifyReservation: async (reservationID, pickupTime) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        const [reservations] = await connection.query(`
            SELECT Reservation_date
            FROM Reservation
            WHERE ID = ?
        `, [reservationID]);

        if (reservations.length === 0) {
            throw new Error(`Reservation with ID ${reservationID} not found.`);
        }

        // 예약 정보 업데이트
        const [result] = await connection.query(`
            UPDATE Reservation
            SET Pickup_time = ?, Reservation_date = NOW()
            WHERE ID = ?
        `, [pickupTime, reservationID]);

        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        console.error("Error modifying reservation:", error);
        throw error;
    } finally {
        connection.release();
    }
},
updateBook: async (isbn, bookData) => {
  const connection = await promisePool.getConnection();
  try {
      await connection.beginTransaction();

      // 올바른 테이블과 컬럼을 사용하여 ISBN으로 책을 조회
      const [rows] = await connection.query(`
          SELECT ISBN 
          FROM Book
          WHERE ISBN = ?
          FOR UPDATE
      `, [isbn]);

      if (rows.length === 0) {
          throw new Error(`Book with ISBN ${isbn} not found.`);
      }

      // 책 정보 업데이트
      await connection.query(
          `UPDATE Book SET Title = ?, Year = ?, Category = ?, Price = ? WHERE ISBN = ?`,
          [bookData.title, bookData.year, bookData.category, bookData.price, isbn]
      );

      // 트랜잭션 커밋
      await connection.commit();
  } catch (error) {
      await connection.rollback();
      console.error('Error updating book details in transaction:', error);
      throw error;
  } finally {
      connection.release();
  }
},
  updateAuthor: async (id, { name, address, url }) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // Locking the target author row
      const [author] = await connection.query(`
        SELECT AuthorID 
        FROM Author
        WHERE AuthorID = ?
        FOR UPDATE
      `, [id]);

      if (author.length === 0) {
        throw new Error(`Author with ID ${id} not found.`);
      }

      // Perform the update
      const [result] = await connection.query(`
          UPDATE Author
          SET Name = ?, Address = ?, URL = ?
          WHERE AuthorID = ?;
      `, [name, address, url, id]);

      await connection.commit();
      console.log("Author updated successfully:", result.affectedRows);
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating author:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  updateAward: async ({ name, year, isbn }) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // 잠금 대기 시간을 5초로 설정
        // await connection.query("SET innodb_lock_wait_timeout = 5");

        // Award 레코드 잠금
        const [award] = await connection.query(`
            SELECT Name, Year 
            FROM Award
            WHERE Name = ? AND Year = ?
            FOR UPDATE
        `, [name, year]);

        if (award.length === 0) {
            throw new Error(`Award with Name "${name}" and Year "${year}" not found.`);
        }

        // 인위적인 딜레이 추가 
        // await sleep(20000);

        // Award 레코드 업데이트
        const [result] = await connection.query(`
            UPDATE Award
            SET ISBN = ?
            WHERE Name = ? AND Year = ?;
        `, [isbn, name, year]);

        await connection.commit();
        console.log("Award updated successfully:", result.affectedRows);
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        console.error("Error updating award:", error);
        // 잠금 오류 코드 로깅 추가
        console.log("Error code:", error.code);
        throw error;
    } finally {
        connection.release();
    }
  },

  updateWarehouse: async (code, { address, phone }) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // Locking the target warehouse row
      const [warehouse] = await connection.query(`
        SELECT Code 
        FROM Warehouse
        WHERE Code = ?
        FOR UPDATE
      `, [code]);

      if (warehouse.length === 0) {
        throw new Error(`Warehouse with Code ${code} not found.`);
      }

      // Perform the update
      const [result] = await connection.query(
        `
        UPDATE Warehouse
        SET Address = ?, Phone = ?
        WHERE Code = ?;
        `,
        [address, phone, code]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating warehouse:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  updateInventory: async ({ code, isbn, number }) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // Locking the target inventory row
      const [inventory] = await connection.query(`
        SELECT Code, ISBN 
        FROM Inventory
        WHERE Code = ? AND ISBN = ?
        FOR UPDATE
      `, [code, isbn]);

      if (inventory.length === 0) {
        throw new Error(`Inventory with Code "${code}" and ISBN "${isbn}" not found.`);
      }

      // Perform the update
      const [result] = await connection.query(`
        UPDATE Inventory 
        SET Number = ? 
        WHERE Code = ? AND ISBN = ?
      `, [number, code, isbn]);

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating inventory:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  updateContains: async ({ basketId, isbn, number }) => {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // Locking the target contains row
      const [contains] = await connection.query(`
        SELECT BasketID, ISBN 
        FROM Contains
        WHERE BasketID = ? AND ISBN = ?
        FOR UPDATE
      `, [basketId, isbn]);

      if (contains.length === 0) {
        throw new Error(`Contains entry with BasketID "${basketId}" and ISBN "${isbn}" not found.`);
      }

      // Perform the update
      const [result] = await connection.query(
        `UPDATE Contains 
         SET Number = ?
         WHERE BasketID = ? AND ISBN = ?`,
        [number, basketId, isbn]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating Contains:", error.message);
      throw error;
    } finally {
      connection.release();
    }
  },
};

export const deleteSql = {
  removeBasketItem: async (basketID, ISBN) => {
    try {
      const [rows] = await promisePool.query(
        `DELETE FROM Contains WHERE BasketID = ? AND ISBN = ?`,
        [basketID, ISBN]
      );
      console.log("Basket item deleted successfully:", rows.affectedRows);
      return rows.affectedRows;
    } catch (error) {
      console.error('Error during basket item deletion:', error.message);
      throw error;
    }
  },

  deleteAward: async (name, year) => {
    try {

      console.log(name,year);
      const [rows] = await promisePool.query(
        `DELETE FROM Award WHERE Name = ? AND Year = ?`,
        [name, year]
      );
      console.log("Award deleted successfully:", rows.affectedRows);
      return rows.affectedRows;
    } catch (error) {
      console.error('Error during award deletion:', error.message);
      throw error;
    }
  },
  deleteWarehouse: async (code) => {
    const [result] = await promisePool.query(
      `
      DELETE FROM Warehouse
      WHERE Code = ?;
      `,
      [code]
    );
    return result.affectedRows; // 삭제된 행 수 반환
  },
  deleteInventoryByWarehouseCode: async (code) => {
    try {
      const [result] = await promisePool.query(
        `DELETE FROM Inventory WHERE Code = ?`,
        [code]
      );
      console.log(`${result.affectedRows} inventory records deleted.`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  },

  // Warehouse 테이블에서 특정 Warehouse 데이터를 삭제
  deleteWarehouse: async (code) => {
    try {
      const [result] = await promisePool.query(
        `DELETE FROM Warehouse WHERE Code = ?`,
        [code]
      );
      console.log(`${result.affectedRows} warehouse records deleted.`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw error;
    }
  },
  deleteInventory: async ({ code, isbn }) => {
    try {
        const [result] = await promisePool.query(
            `DELETE FROM Inventory WHERE Code = ? AND ISBN = ?`,
            [code, isbn]
        );
        return result.affectedRows; // 성공적으로 삭제된 행 수 반환
    } catch (error) {
        console.error("Error deleting inventory:", error);
        throw error;
    }
  },
  deleteContains: async ({ basketId, isbn }) => {
    try {
        const [result] = await promisePool.query(
            `DELETE FROM Contains 
             WHERE BasketID = ? AND ISBN = ?`,
            [basketId, isbn]
        );
        return result.affectedRows; // 삭제된 행 개수 반환
    } catch (error) {
        console.error("Error deleting Contains:", error.message);
        throw error;
    }
  },
};