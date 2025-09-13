document.addEventListener("DOMContentLoaded", () => {
    const formModeIndicator = document.getElementById("formModeIndicator");
    const formModeInput = document.getElementById("formMode");
    const formElement = document.getElementById("awardForm");
  
    // 수정 버튼 클릭 이벤트
    document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const name = button.getAttribute("data-name");
            const year = button.getAttribute("data-year");
            const isbn = button.getAttribute("data-isbn");
  
            // 폼에 데이터 채우기
            document.getElementById("awardName").value = name;
            document.getElementById("awardYear").value = year;
            document.getElementById("awardISBN").value = isbn;
  
            // 비활성화 설정 (상 이름과 연도만 비활성화)
            document.getElementById("awardName").disabled = true;
            document.getElementById("awardYear").disabled = true;
            document.getElementById("awardISBN").disabled = false;
  
            // 수정 모드 설정
            formModeInput.value = "edit";
            formElement.action = `/admin/awards/edit?name=${name}&year=${year}`;
  
            // 알림창 텍스트 변경
            formModeIndicator.innerHTML = `현재 모드: <strong>${name}(${year}) 수정</strong>`;
            formModeIndicator.className = "alert alert-warning text-center mb-3";
        });
    });
  
    // 초기화 버튼 클릭 이벤트 (추가 모드로 복구)
    document.querySelector(".reset-btn").addEventListener("click", () => {
        formModeInput.value = "add";
        formElement.action = "/admin/awards/add";
  
        // 활성화 설정 (상 이름과 연도 활성화, ISBN도 활성화)
        document.getElementById("awardName").disabled = false;
        document.getElementById("awardYear").disabled = false;
        document.getElementById("awardISBN").disabled = false;
  
        // 알림창 텍스트 변경
        formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
        formModeIndicator.className = "alert alert-primary text-center mb-3";
  
        // 폼 초기화
        formElement.reset();
    });
  });