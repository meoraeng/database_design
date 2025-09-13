document.addEventListener("DOMContentLoaded", () => {
    const formModeIndicator = document.getElementById("formModeIndicator");
    const formModeInput = document.getElementById("formMode");
    const formElement = document.getElementById("containsForm");

    // 수정 버튼 클릭 이벤트
    document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const basketId = button.getAttribute("data-basketid");
            const isbn = button.getAttribute("data-isbn");
            const number = button.getAttribute("data-number");

            // 폼에 데이터 채우기
            document.getElementById("basketId").value = basketId;
            document.getElementById("containsISBN").value = isbn;
            document.getElementById("containsNumber").value = number;

            // 수정 모드 설정
            formModeInput.value = "edit";
            formElement.action = `/admin/contains/edit?basketId=${basketId}&isbn=${isbn}`;

            // 비활성화 설정: BasketID와 ISBN은 수정 불가능
            document.getElementById("basketId").disabled = true;
            document.getElementById("containsISBN").disabled = true;
            document.getElementById("containsNumber").disabled = false; // Number는 활성화

            // 알림창 텍스트 변경
            formModeIndicator.innerHTML = `현재 모드: <strong>장바구니 ID: ${basketId}, 책 ISBN: ${isbn} 수정</strong>`;
            formModeIndicator.className = "alert alert-warning text-center mb-3";
        });
    });

    // 초기화 버튼 클릭 이벤트 (추가 모드로 복구)
    document.querySelector(".reset-btn").addEventListener("click", () => {
        formModeInput.value = "add";
        formElement.action = "/admin/contains/add";

        // 알림창 텍스트 변경
        formModeIndicator.innerHTML = `현재 모드: <strong>새로운 데이터 추가</strong>`;
        formModeIndicator.className = "alert alert-primary text-center mb-3";

        // 폼 초기화 및 활성화
        formElement.reset();
        document.getElementById("basketId").disabled = false; // 추가 모드에서는 활성화
        document.getElementById("containsISBN").disabled = false; // 추가 모드에서는 활성화
        document.getElementById("containsNumber").disabled = false;
    });
});
