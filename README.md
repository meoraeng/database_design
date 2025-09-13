# 데이터베이스 설계 및 실습 (Database Design Practice)

이 저장소는 데이터베이스 설계 및 실습 과목의 학습 내용을 정리한 공간입니다. 주차별 실습 코드와 텀 프로젝트 결과물을 포함하고 있습니다.

## 디렉토리 구조

-   `DB Term Project/`: 텀 프로젝트 관련 파일 (보고서, 모델 파일 등)
-   `term_project/`: 학기 최종 텀 프로젝트 소스 코드
-   `week2/` - `week12/`: 각 주차별 실습 코드
-   `venv/`: 대용량 데이터 생성용 스크립트 실행을 위한 파이썬 가상 환경

## 주차별 학습 내용

-   **Week 2:** HTML, CSS, JavaScript를 사용한 기본적인 웹 페이지 구성
-   **Week 3:** Node.js 환경 설정 및 MySQL 데이터베이스 연동
-   **Week 6:** Express 프레임워크를 이용한 웹 서버 구축 및 라우팅
-   **Week 7:** 웹 애플리케이션 CRUD(Create, Read, Update, Delete) 구현
-   **Week 10:** 고급 SQL 쿼리 및 데이터 조작
-   **Week 11:** 세션 또는 토큰 기반의 사용자 로그인 및 로그아웃 기능 구현
-   **Week 12:** Python 스크립트를 활용한 대용량 더미 데이터 생성 및 데이터베이스 삽입

## 텀 프로젝트: 온라인 서점 시스템

### 프로젝트 개요

-   **설명:** Node.js와 MySQL을 기반으로 구축된 온라인 서점 웹 애플리케이션입니다.
-   **사용 기술:** Node.js, Express, MySQL
-   **주요 기능:**
    -   도서 검색
    -   장바구니
    -   주문 및 예약
    -   관리자 페이지 (재고 관리 등)

### 텀프로젝트 요구사항

텀 프로젝트에서는 기능 구현을 넘어 다음과 같은 데이터베이스 핵심 기술들을 적용하여 시스템의 안정성과 성능 향상에 중점

-   **데이터 모델링:** EER 다이어그램을 통해 서점 시스템의 요구사항을 분석하고, 정규화 과정을 거쳐 효율적인 데이터베이스 스키마를 설계 (`Create.sql`)
-   **인덱싱(Indexing):** 도서명, 저자 등 사용자의 검색이 잦은 컬럼에 인덱스를 생성하여 데이터 조회 성능을 최적화 (`Index.sql`)
-   **트랜잭션(Transaction):** 주문 처리, 재고 변경 등 여러 SQL 작업이 원자적으로(All-or-Nothing) 처리되도록 트랜잭션을 적용하여 데이터의 일관성과 무결성을 보장 (`transaction.sql`)
-   **대용량 데이터 처리:** Python 스크립트(`generate_dummy_data_sql.py`)를 이용해 **대규모의 테스트 데이터를 생성하고, 이를 기반으로 대용량 환경에서의 쿼리 성능을 테스트하고 개선하는 작업**을 진행

### 적용된 데이터베이스 개념

-   **스키마 설계와 정규화:** 1NF–3NF를 준수하여 중복을 최소화하고 이상 현상을 방지. `Author`에 대리키(`AuthorID` AUTO_INCREMENT) 사용, `Book`은 자연키(`ISBN`) 사용
-   **관계 모델링(카디널리티):**
    -   1:N 관계: `Customer`–`Shopping_basket`, `Book`–`Award`, `Customer`–`Reservation`
    -   N:M 관계: `Book`–`Author`는 교차 테이블 `Written_by`로 분해
    -   N:M 관계(속성 포함): `Warehouse`–`Book`의 재고 수량을 `Inventory(Number)`로 관리
-   **키 설계:**
    -   기본키: `Award(Name, Year)`(복합), `Inventory(Code, ISBN)`(복합), `Contains(ISBN, BasketID)`(복합)
    -   외래키: 참조 무결성 보장을 위해 모든 관계에 FK 지정(InnoDB, `ON UPDATE/DELETE NO ACTION`)
-   **도메인/무결성 제약:**
    -   CHECK 제약: `Book.Price >= 0`, `Contains.Number >= 0`, `Inventory.Number >= 0`
    -   UNIQUE 제약: `Customer.Phone`, `Warehouse.Phone`, 예약·장바구니·재고의 중복 방지(`Reservation(ISBN, Email)`, `Contains(BasketID, ISBN)`, `Inventory(Code, ISBN)`)
    -   ENUM: `Customer.Role IN ('Customer','Admin')`
-   **데이터 타입 설계:** `CHAR(13)`로 `ISBN` 고정 길이 관리, `YEAR`, `DATETIME`으로 시계열 데이터 표현, 텍스트/URL은 `TEXT`/`VARCHAR(200)` 구분
-   **인덱싱 전략:**
    -   단일 인덱스: `Book.Title`, `Author.Name`, `Reservation.Pickup_time`, `Shopping_basket.Order_date`
    -   복합 인덱스: `Inventory(ISBN, Number)` 등 선택성이 높은 조건에 맞춤 적용
    -   접근 패턴 기반: 사용자 단위 필터링을 위해 `Shopping_basket.Email`, `Reservation.Email` 인덱싱
    -   성능 모니터링 설정: 슬로우 쿼리 로그, 인덱스 미사용 쿼리 로깅 활성화
-   **트랜잭션/동시성 제어:**
    -   기본 세션 격리수준 `READ COMMITTED`, 구매 처리 시나리오에서 `REPEATABLE READ`로 상향 적용
    -   장바구니 갱신·구매·예약·삭제 등 핵심 업무 로직을 `BEGIN–COMMIT/ROLLBACK`으로 원자화, 오류 시 롤백으로 일관성 보장
    -   InnoDB 행 단위 잠금 기반으로 `UPDATE` 시 갱신 경합 완화
-   **애플리케이션 계층의 DB 접근:**
    -   커넥션 풀(`connectionLimit=20`)과 프리페어드 스테이트먼트(`?` 바인딩) 사용으로 안정성과 보안성 확보
    -   환경변수(`.env`)를 통한 비밀번호 관리, 자동 커밋 설정 및 세션 초기화 쿼리 적용
    -   결과 가공: `DATE_FORMAT`으로 표시용 시간 포맷 처리
-   **데이터 준비/테스트:** 대량 더미 데이터 생성(`generate_dummy_data_sql.py`, `dummy_data.sql`) 및 샘플 삽입(`Insert.sql`)로 기능·성능 검증
-   **스토리지/문자셋:** 스토리지 엔진 InnoDB, 스키마 기본 문자셋 `utf8`
