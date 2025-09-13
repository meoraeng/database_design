-- UNIQUE를 통한 중복 방지 & 인덱싱

ALTER TABLE Customer -- 전화번호 중복 불가
ADD CONSTRAINT unique_customer_phone UNIQUE (Phone);

ALTER TABLE Warehouse -- 전화번호 중복 불가
ADD CONSTRAINT unique_warehouse_phone UNIQUE (Phone);

ALTER TABLE Reservation -- 같은 책 예약 중복 방지
ADD CONSTRAINT unique_reservation UNIQUE (ISBN, Email);

ALTER TABLE Contains -- 같은 장바구니 안에 두개의 책 데이터 중복 방지(수량으로 관리)
ADD CONSTRAINT unique_contains UNIQUE (BasketID, ISBN);

ALTER TABLE Inventory -- 같은 창고에 두개의 책 데이터 중복 방지(수량으로 관리)
ADD CONSTRAINT unique_inventory UNIQUE (Code, ISBN);


-----------------------------------------------------
-- 로그 설정
-----------------------------------------------------
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- 1초 이상 걸린 쿼리 기록
SET GLOBAL log_queries_not_using_indexes = 'ON';
SET GLOBAL general_log = 'OFF';



-----------------------------------------------------
-- 인덱스 설정
-----------------------------------------------------

CREATE INDEX idx_book_title ON Book (Title);

CREATE INDEX idx_author_name ON Author (Name);

-- Award.Name은 이미 복합키 첫번째 컬럼으로 존재하므로, 인덱싱 필요 없음. 복합 PK의 첫 컬럼 기준으로 효율적인 검색이 가능하기떄문


-- 예약 목록, 장바구니 목록은 유저에게 해당되는 데이터만 보여주기 때문에 조건으로 자주 사용됨 -> 인덱싱으로 사용하기 적합
CREATE INDEX idx_shopping_basket_email ON Shopping_basket (Email);

CREATE INDEX idx_reservation_email ON Reservation (Email);

-- Inventory 테이블의 ISBN, Number 조합 -> 데이터 조회(수량), 예약, 구매에서 비교 연산 등을 위해 자주 조건에 활용됨
CREATE INDEX idx_inventory_isbn_number ON Inventory (ISBN, Number);
CREATE INDEX idx_inventory_isbn_number ON Inventory (Number);


-- Reservation의 Pickup_time 단일 인덱스
CREATE INDEX idx_reservation_pickup_time ON Reservation (Pickup_time);


-- 구매이력들은 Order_date를 기준으로 정렬해서 장바구니에 불러오게된다.
CREATE INDEX idx_shopping_basket_order_date ON Shopping_basket (Order_date);


