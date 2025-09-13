from faker import Faker
import random

# Faker 초기화
fake = Faker()

# 데이터 생성 설정
num_records = 100000  # 생성할 레코드 수
output_file = "student_data.sql"  # 출력 파일명

# SQL 파일 생성
with open(output_file, "w") as file:
    # 테이블 이름과 필드 설정
    table_name = "student"
    fields = "(name, email, phone_number, major, Department_id, password)"
    
    # 파일 시작 부분에 주석 추가
    file.write(f"-- SQL Insert statements for {table_name} table\n")
    file.write(f"-- Generated with Faker\n\n")
    
    # INSERT 문 시작
    file.write(f"INSERT INTO {table_name} {fields} VALUES\n")
    
    # 데이터 생성
    for i in range(1, num_records + 1):
        name = fake.first_name() + " " + fake.last_name()
        email = fake.email()
        phone_number = random.randint(100000000, 999999999)  # 9자리 숫자
        major = random.choice(["Engineering", "Mathematics", "Biology", "History"])
        department_id = random.randint(1, 10)  # 1~10 사이 랜덤 값
        password = random.randint(1000, 9999)  # 4자리 숫자
        
        # INSERT 문 한 줄 추가
        file.write(f"('{name}', '{email}', {phone_number}, '{major}', {department_id}, {password})")
        
        # 마지막 레코드에는 쉼표 제거
        if i < num_records:
            file.write(",\n")
        else:
            file.write(";\n")
    
    print(f"Generated {num_records} INSERT statements in {output_file}")
