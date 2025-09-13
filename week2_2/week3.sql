-- 'Corporate' branch에 해당하는 모든 사원의 이름, 기존 급여, 10% 증가된 급여 출력
SELECT Fname, Lname, salary AS original_salary, salary * 1.10 AS increased_salary
FROM employee
WHERE branch_id = (SELECT branch_id FROM branch WHERE branch_name = 'Corporate');

-- 급여가 60,000에서 80,000 사이에 있는 모든 남자 사원의 이름, 급여 출력
SELECT Fname, Lname, salary
FROM employee
WHERE salary BETWEEN 60000 AND 80000
AND Sex = 'M';

-- 모든 사원을 branch_id(내림차순), 급여(오름차순)으로 정렬하고 이름, branch_id, 급여 출력
SELECT Fname, Lname, branch_id, salary
FROM employee
ORDER BY branch_id DESC, salary ASC;

-- 'FedEx'와 일하는 급여 60,000 이상의 모든 사원의 이름, total_sales 출력
SELECT e.Fname, e.Lname, s.total_sales
FROM employee e
JOIN sales s ON e.Ssn = s.employee_id
WHERE s.company = 'FedEx' AND e.salary >= 60000;

-- 사원의 급여의 합, 최고 급여, 최저 급여, 평균 급여 출력
SELECT SUM(salary) AS total_salary,
       MAX(salary) AS max_salary,
       MIN(salary) AS min_salary,
       AVG(salary) AS avg_salary
FROM employee;

-- 회사의 총 사원수 출력
SELECT COUNT(*) AS total_employees
FROM employee;

-- 각 branch별 근무하는 사원의 수를 검색하여 branch 이름과 소속 사원수 출력
SELECT b.branch_name, COUNT(e.Ssn) AS num_employees
FROM employee e
JOIN branch b ON e.branch_id = b.branch_id
GROUP BY b.branch_name;
