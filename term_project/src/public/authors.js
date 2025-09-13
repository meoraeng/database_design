document.addEventListener("DOMContentLoaded", () => {
    const formModeIndicator = document.getElementById("formModeIndicator");
    const formModeInput = document.getElementById("formMode");
    const formElement = document.getElementById("authorForm");
  
    // 수정 버튼 클릭 이벤트
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-id");
        const name = button.getAttribute("data-name");
        const address = button.getAttribute("data-address");
        const url = button.getAttribute("data-url");
  
        // 폼에 데이터 채우기
        document.getElementById("name").value = name;
        document.getElementById("address").value = address;
        document.getElementById("url").value = url;
  
        // 수정 모드 설정
        formModeInput.value = "edit";
        formElement.action = `/admin/authors/edit/${id}`;
  
        // 알림창 텍스트 변경
        formModeIndicator.innerHTML = `현재 모드: <strong>${id}(작가 ID) 수정</strong>`;
        formModeIndicator.className = "alert alert-warning text-center mb-3";
      });
    });
  
    // 초기화 버튼 클릭 이벤트 (추가 모드로 복구)
    document.querySelector(".reset-btn").addEventListener("click", () => {
      formModeInput.value = "add";
      formElement.action = "/admin/authors/add";
  
      // 알림창 텍스트 변경
      formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
      formModeIndicator.className = "alert alert-primary text-center mb-3";
  
      // 폼 초기화
      formElement.reset();
    });
  });
  