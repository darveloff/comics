// Navigation switching
const navLinks = document.querySelectorAll("nav a");
const sections = document.querySelectorAll(".content");

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = link.getAttribute("data-section");

    // Update active nav
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // Show the right section
    sections.forEach(sec => {
      sec.classList.remove("active");
      if (sec.id === target) {
        sec.classList.add("active");
      }
    });
  });
});

// Comics gallery
const images = [
  "images/comic1.jpg",
  "images/comic2.jpg",
  "images/comic3.jpg"
]; // Add your own images

let currentIndex = 0;
const comicImage = document.getElementById("comicImage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function showImage(index) {
  comicImage.src = images[index];
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  });
}
