const firstName = document.getElementById("firstname");
const titleMax = document.querySelector(".js-title span");
const guessNumForm = document.getElementById("js-guess");
const guessNumValue = document.getElementById("num");
const rangeValue = document.getElementById("js-range");
const resultSpan = document.querySelector("#js-result span");

const changeRange = (e) => {
    e.preventDefault(); // Prevents the window from moving
    titleMax.textContent = rangeValue.value;
}

function generatorRandomNumber(min, max) {
    return Math.floor(Math.random()*(max-min+1)) + min;
};

function compareValue(e) {
    e.preventDefault();
    maxNum = rangeValue.value;
    guessNum = num.value;
    randomNum = generatorRandomNumber(0, maxNum);
    if(randomNum == guessNum){
        resultSpan.innerHTML = `You choose: ${guessNum}, the machine choose: ${randomNum} <br>
        <b>You win!</b>`
    } else {
        resultSpan.innerHTML = `You choose: ${guessNum}, the machine choose: ${randomNum} <br>
        <b>You lost!</b>`
    }
}

rangeValue.addEventListener("input", changeRange);
guessNumForm.addEventListener("submit", compareValue);
