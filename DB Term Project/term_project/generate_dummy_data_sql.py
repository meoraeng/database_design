import random
import string
from faker import Faker

# 설정
MAIN_NUM_RECORDS = 10000   # 주요 테이블에 생성할 레코드 수
OTHER_NUM_RECORDS = 1500   # 나머지 테이블에 생성할 레코드 수
BATCH_SIZE = 1000          # 한 번에 생성할 INSERT 문 수

output_file = "dummy_data.sql"
fake = Faker()

# Helper 함수
def escape_string(s):
    return s.replace("'", "''")

def truncate_string(s, max_length):
    return s[:max_length]

def hash_password(password):
    # 간단한 해시 함수 (실제 사용 시 더 안전한 방법을 사용하세요)
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

# 유일성 보장을 위한 집합
existing_isbns = set()
existing_emails = set()
existing_codes = set()
existing_written_by = set()
existing_contains = set()  # Contains 테이블의 (ISBN, BasketID) 조합을 추적

# SQL 파일 생성
with open(output_file, "w", encoding="utf-8") as file:
    file.write("-- SQL Insert statements for BookStore database\n")
    file.write("-- Generated with Python and Faker\n\n")

    # 1. Author 테이블 데이터 생성
    print("Generating Author data...")
    authors = []
    for _ in range(MAIN_NUM_RECORDS):
        name = truncate_string(escape_string(fake.name()), 25)
        address = escape_string(fake.address().replace("\n", ", "))
        url = truncate_string(escape_string(fake.url()), 200)
        authors.append((name, address, url))

    file.write("-- Inserting data into Author table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = authors[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{a[0]}', '{a[1]}', '{a[2]}')" for a in batch])
        file.write(f"INSERT INTO Author (Name, Address, URL) VALUES\n{values};\n\n")
    print("Author data generation completed.")

    # 2. Book 테이블 데이터 생성
    print("Generating Book data...")
    books = []
    while len(books) < MAIN_NUM_RECORDS:
        isbn = ''.join(random.choices(string.digits, k=13))
        if isbn in existing_isbns:
            continue
        existing_isbns.add(isbn)
        title = truncate_string(escape_string(fake.sentence(nb_words=3).rstrip('.')), 25)
        year = random.randint(1990, 2024)
        category = truncate_string(random.choice(['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography']), 50)
        price = random.randint(1000, 50000)
        books.append((isbn, title, year, category, price))

    file.write("-- Inserting data into Book table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = books[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{b[0]}', '{b[1]}', {b[2]}, '{b[3]}', {b[4]})" for b in batch])
        file.write(f"INSERT INTO Book (ISBN, Title, Year, Category, Price) VALUES\n{values};\n\n")
    print("Book data generation completed.")

    # 3. Award 테이블 데이터 생성 (1,500 레코드, 유일한 Name-Year 조합)
    print("Generating Award data...")
    awards = []
    existing_awards = set()
    while len(awards) < OTHER_NUM_RECORDS:
        name = truncate_string(escape_string(fake.word().capitalize() + " Award"), 30)
        year = random.randint(2000, 2024)
        if (name, year) in existing_awards:
            continue
        existing_awards.add((name, year))
        isbn = random.choice(books)[0]
        awards.append((name, year, isbn))

    file.write("-- Inserting data into Award table\n")
    for i in range(0, len(awards), BATCH_SIZE):
        batch = awards[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{a[0]}', {a[1]}, '{a[2]}')" for a in batch])
        file.write(f"INSERT INTO Award (Name, Year, ISBN) VALUES\n{values};\n\n")
    print("Award data generation completed.")

    # 4. Warehouse 테이블 데이터 생성
    print("Generating Warehouse data...")
    warehouses = []
    for _ in range(MAIN_NUM_RECORDS):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=30))
            if code not in existing_codes:
                existing_codes.add(code)
                break
        address = escape_string(fake.address().replace("\n", ", "))
        phone = truncate_string(escape_string(fake.phone_number()), 15)
        warehouses.append((code, address, phone))

    file.write("-- Inserting data into Warehouse table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = warehouses[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{w[0]}', '{w[1]}', '{w[2]}')" for w in batch])
        file.write(f"INSERT INTO Warehouse (Code, Address, Phone) VALUES\n{values};\n\n")
    print("Warehouse data generation completed.")

    # 5. Customer 테이블 데이터 생성
    print("Generating Customer data...")
    customers = []
    for _ in range(MAIN_NUM_RECORDS):
        while True:
            email = truncate_string(escape_string(fake.unique.email()), 25)
            if email not in existing_emails:
                existing_emails.add(email)
                break
        name = truncate_string(escape_string(fake.name()), 25)
        address = escape_string(fake.address().replace("\n", ", "))
        phone = truncate_string(escape_string(fake.unique.phone_number()), 15)
        role = random.choice(['Customer', 'Admin'])
        password_plain = fake.password(length=10)
        password_hashed = hash_password(password_plain)
        customers.append((email, name, address, phone, role, password_hashed))

    file.write("-- Inserting data into Customer table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = customers[i:i+BATCH_SIZE]
        values = ",\n".join([
            f"('{c[0]}', '{c[1]}', '{c[2]}', '{c[3]}', '{c[4]}', '{c[5]}')"
            for c in batch
        ])
        file.write(f"INSERT INTO Customer (Email, Name, Address, Phone, Role, Password) VALUES\n{values};\n\n")
    print("Customer data generation completed.")

    # 6. Shopping_basket 테이블 데이터 생성
    print("Generating Shopping_basket data...")
    shopping_baskets = []
    customer_emails = [c[0] for c in customers]
    for _ in range(MAIN_NUM_RECORDS):
        order_date = fake.date_time_between(start_date='-1y', end_date='now').strftime('%Y-%m-%d %H:%M:%S')
        email = random.choice(customer_emails)
        shopping_baskets.append((order_date, email))

    file.write("-- Inserting data into Shopping_basket table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = shopping_baskets[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{sb[0]}', '{sb[1]}')" for sb in batch])
        file.write(f"INSERT INTO Shopping_basket (Order_date, Email) VALUES\n{values};\n\n")
    print("Shopping_basket data generation completed.")

    # 7. Written_by 테이블 데이터 생성
    print("Generating Written_by data...")
    written_bys = []
    for _ in range(MAIN_NUM_RECORDS):
        while True:
            isbn = random.choice(books)[0]
            author_id = random.randint(1, MAIN_NUM_RECORDS)  # AuthorID는 1부터 MAIN_NUM_RECORDS까지
            if (isbn, author_id) not in existing_written_by:
                existing_written_by.add((isbn, author_id))
                written_bys.append((isbn, author_id))
                break

    file.write("-- Inserting data into Written_by table\n")
    for i in range(0, MAIN_NUM_RECORDS, BATCH_SIZE):
        batch = written_bys[i:i+BATCH_SIZE]
        values = ",\n".join([f"('{wb[0]}', {wb[1]})" for wb in batch])
        file.write(f"INSERT INTO Written_by (ISBN, AuthorID) VALUES\n{values};\n\n")
    print("Written_by data generation completed.")

    # 8. Contains 테이블 데이터 생성
    print("Generating Contains data...")
    contains = []
    basket_ids = list(range(1, MAIN_NUM_RECORDS + 1))  # BasketID는 1부터 MAIN_NUM_RECORDS까지
    for _ in range(MAIN_NUM_RECORDS):
        while True:
            basket_id = random.choice(basket_ids)
            isbn = random.choice(books)[0]
            if (isbn, basket_id) not in existing_contains:
                existing_contains.add((isbn, basket_id))
                number = random.randint(1, 10)
                contains.append((isbn, basket_id, number))
                break

    file.write("-- Inserting data into Contains table\n")
    for i in range(0, len(contains), BATCH_SIZE):
        batch = contains[i:i+BATCH_SIZE]
        values = ",\n".join([
            f"('{c[0]}', {c[1]}, {c[2]})"
            for c in batch
        ])
        file.write(f"INSERT INTO Contains (ISBN, BasketID, Number) VALUES\n{values};\n\n")
    print("Contains data generation completed.")

    # 9. Inventory 테이블 데이터 생성 (유일한 Code-ISBN 조합 보장)
    print("Generating Inventory data...")
    inventory = []
    warehouse_codes = [w[0] for w in warehouses]
    existing_inventory = set()  # (Code, ISBN) 조합 추적

    while len(inventory) < MAIN_NUM_RECORDS:
        code = random.choice(warehouse_codes)
        isbn = random.choice(books)[0]
        if (code, isbn) in existing_inventory:
            continue  # 중복된 조합이면 건너뜀
        existing_inventory.add((code, isbn))
        number = random.randint(1, 1000)
        inventory.append((code, isbn, number))

    file.write("-- Inserting data into Inventory table\n")
    for i in range(0, len(inventory), BATCH_SIZE):
        batch = inventory[i:i+BATCH_SIZE]
        values = ",\n".join([
            f"('{inv[0]}', '{inv[1]}', {inv[2]})"
            for inv in batch
        ])
        file.write(f"INSERT INTO Inventory (Code, ISBN, Number) VALUES\n{values};\n\n")
    print("Inventory data generation completed.")

    # 10. Reservation 테이블 데이터 생성 (1,500 레코드)
    print("Generating Reservation data...")
    reservations = []
    for _ in range(OTHER_NUM_RECORDS):
        reservation_date = fake.date_time_between(start_date='-1y', end_date='now').strftime('%Y-%m-%d %H:%M:%S')
        pickup_time = fake.date_time_between(start_date='now', end_date='+30d').strftime('%Y-%m-%d %H:%M:%S')
        isbn = random.choice(books)[0]
        email = random.choice(customer_emails)
        reservations.append((reservation_date, pickup_time, isbn, email))

    file.write("-- Inserting data into Reservation table\n")
    for i in range(0, len(reservations), BATCH_SIZE):
        batch = reservations[i:i+BATCH_SIZE]
        values = ",\n".join([
            f"('{r[0]}', '{r[1]}', '{r[2]}', '{r[3]}')"
            for r in batch
        ])
        file.write(f"INSERT INTO Reservation (Reservation_date, Pickup_time, ISBN, Email) VALUES\n{values};\n\n")
    print("Reservation data generation completed.")

    print(f"Generated SQL INSERT statements are saved in '{output_file}'.")
