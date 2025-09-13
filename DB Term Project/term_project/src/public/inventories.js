document.addEventListener("DOMContentLoaded", () => {
  const formModeIndicator = document.getElementById("formModeIndicator");
  const formModeInput = document.getElementById("formMode");
  const formElement = document.getElementById("inventoryForm");

  // 수정 버튼 클릭 이벤트
  document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
          const code = button.getAttribute("data-code");
          const isbn = button.getAttribute("data-isbn");
          const number = button.getAttribute("data-number");

          // 폼에 데이터 채우기
          document.getElementById("warehouseCode").value = code;
          document.getElementById("bookISBN").value = isbn;
          document.getElementById("inventoryNumber").value = number;

          // 비활성화 설정 (창고 코드와 책 ISBN)
          document.getElementById("warehouseCode").disabled = true;
          document.getElementById("bookISBN").disabled = true;

          // 활성화 설정 (재고 수량만 활성화)
          document.getElementById("inventoryNumber").disabled = false;

          // 수정 모드 설정
          formModeInput.value = "edit";
          formElement.action = `/admin/inventory/edit/?code=${code}&isbn=${isbn}`;

          // 알림창 텍스트 변경
          formModeIndicator.innerHTML = `현재 모드: <strong>${code}(code), ${isbn}(ISBN) 수정</strong>`;
          formModeIndicator.className = "alert alert-warning text-center mb-3";
      });
  });

  // 초기화 버튼 클릭 이벤트 (추가 모드로 복구)
  document.querySelector(".reset-btn").addEventListener("click", () => {
      formModeInput.value = "add";
      formElement.action = "/admin/inventory/add";

      // 활성화 설정 (창고 코드와 책 ISBN도 활성화)
      document.getElementById("warehouseCode").disabled = false;
      document.getElementById("bookISBN").disabled = false;

      // 비활성화 설정 (재고 수량 비활성화 해제)
      document.getElementById("inventoryNumber").disabled = false;

      // 알림창 텍스트 변경
      formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
      formModeIndicator.className = "alert alert-primary text-center mb-3";

      // 폼 초기화
      formElement.reset();
  });
});
