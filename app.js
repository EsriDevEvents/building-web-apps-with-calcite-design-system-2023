/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");

toggleModalEl.addEventListener("click", () => handleModalChange());

/** Not Map Things */
function handleModalChange() {
  modalEl.open = !modalEl.open;
}
