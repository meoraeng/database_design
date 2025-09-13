document.addEventListener("DOMContentLoaded", () => {
  const formModeIndicator = document.getElementById("formModeIndicator");
  const formModeInput = document.getElementById("formMode");
  const formElement = document.getElementById("bookForm");
  const authorField = document.getElementById("authorIds"); // 작가 ID 입력 필드

  // 수정 버튼 클릭 이벤트
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const isbn = button.getAttribute("data-id");
      const title = button.getAttribute("data-title");
      const year = button.getAttribute("data-year");
      const category = button.getAttribute("data-category");
      const price = button.getAttribute("data-price");

      // 폼에 데이터 채우기
      document.getElementById("bookTitle").value = title;
      document.getElementById("bookYear").value = year;
      document.getElementById("bookCategory").value = category;
      document.getElementById("bookPrice").value = price;

      // 작가 ID 입력 필드 비활성화
      if (authorField) {
        authorField.disabled = true;
        authorField.value = ""; // 수정 시 작가 ID는 초기화
      }

      // 수정 모드 설정
      formModeInput.value = "edit";
      formElement.action = `/admin/books/edit/${isbn}`;

      // 알림창 텍스트 변경
      formModeIndicator.innerHTML = `현재 모드: <strong>${isbn}(ISBN) 수정</strong>`;
      formModeIndicator.className = "alert alert-warning text-center mb-3";
    });
  });

  // 초기화 버튼 클릭 이벤트 (데이터 추가 모드로 복구)
  document.querySelector(".reset-btn").addEventListener("click", () => {
    formModeInput.value = "add";
    formElement.action = "/admin/books/add";

    // 작가 ID 입력 필드 활성화
    if (authorField) {
      authorField.disabled = false;
    }

    // 알림창 텍스트 변경
    formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
    formModeIndicator.className = "alert alert-primary text-center mb-3";

    // 폼 초기화
    formElement.reset();
  });
});
