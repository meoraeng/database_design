-- Transaciton 관련 쿼리
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

SET autocommit = 1

-- 실제 프로젝트에서 js 모듈로 사용된 트랜잭션 쿼리들입니다. 실제 값을 넣어야 동작하므로 실행은 불가능합니다.

-- 1. 업데이트 장바구니 항목 (updateBasketItem)
-- 설명: 특정 사용자의 장바구니에 책을 추가하거나 수량을 업데이트
START TRANSACTION;

-- 활성 장바구니 조회
SELECT BasketID FROM shopping_basket WHERE Email = '<<Email>>' AND Order_date IS NULL;

-- 활성 장바구니가 없을 경우 새 장바구니 생성
INSERT INTO shopping_basket (Email, Order_date) VALUES ('<<Email>>', NULL);

-- 특정 장바구니에서 ISBN으로 항목 조회
SELECT Number FROM Contains WHERE BasketID = <<BasketID>> AND ISBN = '<<ISBN>>';

-- 항목이 존재하면 수량 업데이트
UPDATE Contains SET Number = Number + 1 WHERE BasketID = <<BasketID>> AND ISBN = '<<ISBN>>';

-- 항목이 존재하지 않으면 새 항목 추가
INSERT INTO Contains (BasketID, ISBN, Number) VALUES (<<BasketID>>, '<<ISBN>>', 1);

COMMIT;
-- ROLLBACK; -- 오류 발생 시 주석을 해제하여 롤백 수행

-----------------------------------------------------

-- 2. 장바구니 구매 처리 (purchaseBasket)
-- 설명: 장바구니에 담긴 모든 항목을 구매 처리
START TRANSACTION;

-- Contains 테이블에서 장바구니의 ISBN과 수량 조회
SELECT ISBN, Number FROM Contains WHERE BasketID = <<BasketID>>;

-- 각 ISBN에 대해 재고 확인 및 업데이트
-- ISBN: <<ISBN>>, 수량: <<Number>>
SELECT Code, Number FROM Inventory WHERE ISBN = '<<ISBN>>' AND Number >= <<Number>> ORDER BY Number DESC LIMIT 1;
UPDATE Inventory SET Number = Number - <<Number>> WHERE Code = '<<Code>>' AND ISBN = '<<ISBN>>';

-- 장바구니의 Order_date 업데이트
UPDATE shopping_basket SET Order_date = NOW() WHERE BasketID = <<BasketID>>;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 3. 예약 항목 추가 (reservationItem)
-- 설명: 사용자의 예약 항목을 추가하고 재고를 감소시킴
START TRANSACTION;

-- 재고가 있는 창고 조회
SELECT Code, Number FROM Inventory WHERE ISBN = '<<ISBN>>' AND Number > 0 ORDER BY Number DESC LIMIT 1;

-- 예약 시간 10분 전후 중복 예약 확인
SELECT COUNT(*) FROM Reservation WHERE Email = '<<Email>>' AND ISBN = '<<ISBN>>' AND ABS(TIMESTAMPDIFF(MINUTE, Pickup_time, '<<PickupTime>>')) <= 10;

-- 예약 추가
INSERT INTO Reservation (Reservation_date, Pickup_time, ISBN, Email) VALUES (NOW(), '<<PickupTime>>', '<<ISBN>>', '<<Email>>');

-- 재고 감소
UPDATE Inventory SET Number = Number - 1 WHERE Code = '<<Code>>' AND ISBN = '<<ISBN>>' AND Number > 0;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 4. 예약 제거 (removeReservation)
-- 설명: 특정 예약을 제거하고 재고를 증가시킴
START TRANSACTION;

-- 예약 정보 조회
SELECT ISBN FROM Reservation WHERE ID = <<ReservationID>> LIMIT 1;

-- 예약 삭제
DELETE FROM Reservation WHERE ID = <<ReservationID>>;

-- 해당 ISBN의 작가 수 확인
SELECT COUNT(*) AS AuthorCount FROM Written_by WHERE ISBN = '<<ISBN>>';

-- 작가가 없으면 책 삭제
DELETE FROM Book WHERE ISBN = '<<ISBN>>';

-- 재고가 있는 창고 조회
SELECT Code FROM Inventory WHERE ISBN = '<<ISBN>>' AND Number > 0 ORDER BY Number DESC LIMIT 1;

-- 재고 증가
UPDATE Inventory SET Number = Number + 1 WHERE Code = '<<Code>>' AND ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 5. 책 추가 (insertBook)
-- 설명: 새로운 책을 추가하고 관련 작가 정보를 설정
START TRANSACTION;

-- 고유 ISBN 생성 및 책 정보 삽입
INSERT INTO Book (ISBN, Title, Year, Category, Price) VALUES ('<<ISBN>>', '<<Title>>', <<Year>>, '<<Category>>', <<Price>>);

-- 작가 ID를 기반으로 Written_by 테이블에 관계 추가
INSERT INTO Written_by (ISBN, AuthorID) VALUES ('<<ISBN>>', <<AuthorID1>>);
INSERT INTO Written_by (ISBN, AuthorID) VALUES ('<<ISBN>>', <<AuthorID2>>);
-- 추가 작가가 있을 경우 위 쿼리 반복

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 6. 책 삭제 (deleteBook)
-- 설명: 특정 ISBN의 책과 관련된 모든 데이터를 삭제
START TRANSACTION;

-- 관련 데이터 삭제
DELETE FROM Written_by WHERE ISBN = '<<ISBN>>';
DELETE FROM Award WHERE ISBN = '<<ISBN>>';
DELETE FROM Inventory WHERE ISBN = '<<ISBN>>';
DELETE FROM Contains WHERE ISBN = '<<ISBN>>';
DELETE FROM Reservation WHERE ISBN = '<<ISBN>>';
DELETE FROM Book WHERE ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 7. 저자 및 관련 책 삭제 (deleteAuthorAndBooks)
-- 설명: 특정 저자를 삭제하고, 저자가 참여한 책이 더 이상 없으면 책도 삭제
START TRANSACTION;

-- 저자가 참여한 모든 ISBN 조회
SELECT DISTINCT ISBN FROM Written_by WHERE AuthorID = <<AuthorID>>;

-- Written_by 테이블에서 저자 삭제
DELETE FROM Written_by WHERE AuthorID = <<AuthorID>> AND ISBN = '<<ISBN>>';

-- 해당 ISBN의 남은 작가 수 확인
SELECT COUNT(*) AS AuthorCount FROM Written_by WHERE ISBN = '<<ISBN>>';

-- 남은 작가가 없으면 책 삭제
DELETE FROM Book WHERE ISBN = '<<ISBN>>';

-- Author 테이블에서 저자 삭제
DELETE FROM Author WHERE AuthorID = <<AuthorID>>;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 8. 예약 수정 (modifyReservation)
-- 설명: 특정 예약의 Pickup_time을 수정
START TRANSACTION;

-- 예약 정보 업데이트
UPDATE Reservation
SET Pickup_time = '<<PickupTime>>', Reservation_date = NOW()
WHERE ID = <<ReservationID>>;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 9. 책 정보 업데이트 (updateBook)
-- 설명: 특정 ISBN의 책 정보를 업데이트
START TRANSACTION;

-- 책 정보 업데이트
UPDATE Book
SET Title = '<<Title>>', Year = <<Year>>, Category = '<<Category>>', Price = <<Price>>
WHERE ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 10. 저자 정보 업데이트 (updateAuthor)
-- 설명: 특정 저자의 정보를 업데이트
START TRANSACTION;

-- 저자 정보 업데이트
UPDATE Author
SET Name = '<<Name>>', Address = '<<Address>>', URL = '<<URL>>'
WHERE AuthorID = <<AuthorID>>;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 11. 수상 정보 업데이트 (updateAward)
-- 설명: 특정 수상의 ISBN을 업데이트
START TRANSACTION;

-- 수상 정보 업데이트
UPDATE Award
SET ISBN = '<<ISBN>>'
WHERE Name = '<<AwardName>>' AND Year = <<Year>>;

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 12. 창고 정보 업데이트 (updateWarehouse)
-- 설명: 특정 창고의 주소와 전화번호를 업데이트
START TRANSACTION;

-- 창고 정보 업데이트
UPDATE Warehouse
SET Address = '<<Address>>', Phone = '<<Phone>>'
WHERE Code = '<<Code>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 13. 재고 정보 업데이트 (updateInventory)
-- 설명: 특정 창고와 ISBN의 재고 수량을 업데이트
START TRANSACTION;

-- 재고 수량 업데이트
UPDATE Inventory
SET Number = <<Number>>
WHERE Code = '<<Code>>' AND ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 14. Contains 테이블 업데이트 (updateContains)
-- 설명: 특정 BasketID와 ISBN의 수량을 업데이트
START TRANSACTION;

-- 수량 업데이트
UPDATE Contains
SET Number = <<Number>>
WHERE BasketID = <<BasketID>> AND ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;

-----------------------------------------------------

-- 15. Contains 테이블 삭제 (deleteContains)
-- 설명: 특정 BasketID와 ISBN의 항목을 삭제
START TRANSACTION;

-- Contains 항목 삭제
DELETE FROM Contains WHERE BasketID = <<BasketID>> AND ISBN = '<<ISBN>>';

COMMIT;
-- ROLLBACK;
