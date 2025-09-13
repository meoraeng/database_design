document.addEventListener("DOMContentLoaded", () => {
  const formModeIndicator = document.getElementById("formModeIndicator");
  const formModeInput = document.getElementById("formMode");
  const formElement = document.getElementById("warehouseForm");

  const codeInput = document.getElementById("code");
  const addressInput = document.getElementById("address");
  const phoneInput = document.getElementById("phone");

  // 수정 버튼 클릭 이벤트
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.getAttribute("data-code");
      const address = button.getAttribute("data-address");
      const phone = button.getAttribute("data-phone");

      // 폼에 데이터 채우기
      codeInput.value = code;
      addressInput.value = address;
      phoneInput.value = phone;

      // Code 필드 비활성화
      codeInput.disabled = true;

      // 수정 모드 설정
      formModeInput.value = "edit";
      formElement.action = `/admin/warehouses/edit/${code}`;

      // 알림창 텍스트 변경
      formModeIndicator.innerHTML = `현재 모드: <strong>${code} 수정</strong>`;
      formModeIndicator.className = "alert alert-warning text-center mb-3";
    });
  });

  // 초기화 버튼 클릭 이벤트 (추가 모드로 복구)
  document.querySelector(".reset-btn").addEventListener("click", () => {
    formModeInput.value = "add";
    formElement.action = "/admin/warehouses/add";

    // Code 필드 활성화
    codeInput.disabled = false;

    // 알림창 텍스트 변경
    formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
    formModeIndicator.className = "alert alert-primary text-center mb-3";

    // 폼 초기화
    formElement.reset();
  });
});
