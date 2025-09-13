use BookStore;
-- Book 테이블
INSERT INTO `Book` (`ISBN`, `Title`, `Year`, `Category`, `Price`) VALUES
('9781234567897', 'Book A', 2020, 'Fiction', 15000),
('9789876543210', 'Book B', 2021, 'Science', 20000),
('9781111111111', 'Book C', 2022, 'Fantasy', 18000);

-- Author 테이블
INSERT INTO `Author` (`AuthorID`, `Name`, `Address`, `URL`) VALUES
(1, 'Author A', '123 Writer St.', 'http://authora.com'),
(2, 'Author B', '456 Novelist Ave.', 'http://authorb.com'),
(3, 'Author C', '789 Author Blvd.', 'http://authorc.com');

-- Written_by 테이블
INSERT INTO `Written_by` (`ISBN`, `AuthorID`) VALUES
('9781234567897', 1),
('9789876543210', 2),
('9781111111111', 3),
('9781111111111', 1);

-- Award 테이블
INSERT INTO `Award` (`Name`, `Year`, `ISBN`) VALUES
('Best Fiction', 2020, '9781234567897'),
('Top Science Award', 2021, '9789876543210'),
('Fantasy Excellence', 2022, '9781111111111');

-- Warehouse 테이블
INSERT INTO `Warehouse` (`Code`, `Address`, `Phone`) VALUES
('WH01', '123 Storage St.', '123-456-7890'),
('WH02', '456 Depot Rd.', '987-654-3210'),
('WH03', '789 Inventory Ln.', '555-555-5555');

-- Inventory 테이블
INSERT INTO `Inventory` (`Code`, `ISBN`, `Number`) VALUES
('WH01', '9781234567897', 10),
('WH02', '9789876543210', 5),
('WH03', '9781111111111', 7);

-- Customer 테이블
INSERT INTO `Customer` (`Email`, `Name`, `Address`, `Phone`, `Role`, `Password`) VALUES
('test1@test.com', 'Test User 1', '123 Main St.', '111-111-1111', 'Customer', 'test1'),
('test2@test.com', 'Test User 2', '456 Side St.', '222-222-2222', 'Customer', 'test2'),
('admin1@test.com', 'Admin User', '789 Admin Blvd.', '333-333-3333', 'Admin', 'admin1');

-- Shopping_basket 테이블
INSERT INTO `Shopping_basket` (`Order_date`, `Email`) VALUES
(NOW() - INTERVAL 1 DAY, 'test1@test.com'),
(NOW() - INTERVAL 2 DAY, 'test2@test.com'),
(NOW() - INTERVAL 3 DAY, 'test1@test.com');

-- Reservation 테이블
INSERT INTO `Reservation` (`Reservation_date`, `Pickup_time`, `ISBN`, `Email`) VALUES
(NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY, '9781234567897', 'test1@test.com'),
(NOW() + INTERVAL 3 DAY, NOW() + INTERVAL 4 DAY, '9789876543210', 'test2@test.com'),
(NOW() + INTERVAL 5 DAY, NOW() + INTERVAL 6 DAY, '9781111111111', 'test1@test.com');

-- Contains 테이블
INSERT INTO `Contains` (`ISBN`, `BasketID`, `Number`) VALUES
('9781234567897', 1, 2),
('9789876543210', 2, 1),
('9781111111111', 3, 3);



