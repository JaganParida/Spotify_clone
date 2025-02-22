let input = document.querySelector("input");
let search = document.querySelector(".search");

input.addEventListener("focus", () => {
  search.style.border = "3px solid white";
});

document.body.addEventListener("click", (event) => {
  if (!search.contains(event.target)) {
    search.style.border = "none";
  }
});
