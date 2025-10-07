// === bgm setup ===
// here we grab the <audio> element from html
const bgm = document.getElementById('bgm');

// define how long the loop will be (in seconds)
// 2:23 = 143 seconds, if you meant 2.23 minutes, it's around 133.8 sec
const LOOP_START = 0;
const LOOP_END   = 143;

let bgmStarted = false; // this helps to make sure bgm plays only once

// this function starts the background music
function startBGM() {
  if (bgmStarted) return; // if music already started, skip
  bgmStarted = true;
  try {
    bgm.currentTime = LOOP_START; // start from the beginning
    bgm.play();                   // play music (browser allows this after user click)
  } catch (e) {
    // some browsers block auto-play, so they might need one more click
  }
}

// keeps looping the part of music we picked
bgm.addEventListener('timeupdate', () => {
  if (bgm.currentTime >= LOOP_END) {
    bgm.currentTime = LOOP_START; // reset time to start
    bgm.play();                   // keep looping
  }
});


/* smooth scroll when clicking menu links */
const headerEl = document.querySelector('header');
function goToSection(id){
  const el = document.getElementById(id);
  if(!el) return;
  // scroll to the section minus header height
  const y = el.getBoundingClientRect().top + window.scrollY - headerEl.offsetHeight - 10;
  window.scrollTo({top:y, behavior:'smooth'});
}

// add click event to each menu link and button
document.querySelectorAll('a[data-section], .cta-button[data-section]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    goToSection(a.getAttribute('data-section'));
  });
});

// highlight current section in menu while scrolling
const sections = ['home','comics','team'].map(id=>document.getElementById(id));
const navMap = {};
document.querySelectorAll('nav a[data-section]').forEach(a=>navMap[a.dataset.section]=a);

// intersection observer checks which section is visible
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      // remove highlight from all, then highlight the one we see
      Object.values(navMap).forEach(n=>n.classList.remove('active'));
      (navMap[entry.target.id]||navMap['home']).classList.add('active');
    }
  });
},{threshold:0.5});
sections.forEach(s=>io.observe(s));


// ---------- comics logic (main story part) ----------
const totalComics = 21;
// load all comic images
const images = Array.from({length: totalComics}, (_, i) => `images/${i+1}.jpeg`);

// captions for each scene
const descriptions = {
  0:"Madina is a college student. She rushes out of the building after realizing she’s late for class",
  1:"As Madina tries to walk away, someone suddenly grabs her shoulder, startling her",
  2:"Madina faces her professor, who sternly asks why she was absent from class yesterday. Embarrassed, she hides her face, unsure how to respond",
  3:"Madina quickly raises medical document paper and explains to her professor that she was ill and couldn’t attend class.",
  4:"The professor looks relieved and smiles, giving a thumbs-up as he tells Madina it’s fine after seeing her medical document.",
  5:"Madina smiles and admits the real reason she missed class - she just wanted to sleep longer.",
  6:"The professor holds up a paper with a red “F,” showing Madina her participation grade. Madina covers her face in embarrassment",
  7:"Madina runs through the building with determination, ready to make up for her mistake and never miss class again",
  8:"As Madina rushes forward, a friend suddenly appears on the staircase, cheerfully greeting her with a loud “Hi, friend!”",
  9:"Madina’s friend excitedly invites her to go to the convenience store, but she hesitates, realizing she might get distracted again",
  10:"Madina and her friend cheer as they realize there’s no line at the store, excited to grab what they want without waiting",
  11:"They carefully picking out their favorite snacks and drinks from the store",
  12:"Madina turns around and realizes that a long line has suddenly formed at the counter.",
  13:"Madina waves goodbye to her friend and dashes out of the store, realizing she needs to hurry back to class.",
  14:"As Madina tries to cut the line, the cashier bops her on the head, shouting “Pay attention!” reminding her to follow the rules. (We don’t recommend doing this in real life)",
  15:"Madina runs toward the Computational Building, rushing to make it to class in time",
  16:"Madina finally reaches her classroom door, swiping her card in a hurry",
  17:"Madina bursts into the classroom, calling out to her professor that she’s finally made it",
  18:"As Madina finally arrives, the professor calmly announces that the class is already over ",
  19:"Madina stands frozen at the door, realizing she misjudged the time and missed the entire class.",
  20:"Our story shows Madina’s example and encourages students not to be late to their classes and to adjust their time wisely — otherwise, it might end up like Madina’s situation!"
};

// pages where player chooses
const CHOICE1 = 2;  // 3.jpeg
const CHOICE2 = 12; // 13.jpeg

// tracking progress
let currentIndex = 0;
let branchLock = null;           // stops user from going too far
const nextOverride = new Map();  // makes specific jumps between pages
let choiceMode = false;          // when true, user must pick a choice

// grab needed html parts
const comicImage = document.getElementById("comicImage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const currentPage = document.getElementById("currentPage");
const totalPagesEl = document.getElementById("totalPages");
const pageDotsContainer = document.getElementById("pageDots");
const sceneCaption = document.getElementById("sceneCaption");
const choiceBlock = document.getElementById("choiceBlock");
const choiceGrid = document.getElementById("choiceGrid");
const choiceEyebrow = document.getElementById("choiceEyebrow");
const choiceQuestion = document.getElementById("choiceQuestion");

// show total number of pages
totalPagesEl.textContent = String(totalComics).padStart(2, "0");

// make little navigation dots under comic
for (let i = 0; i < totalComics; i++) {
  const dot = document.createElement("div");
  dot.className = "dot" + (i === 0 ? " active" : "");
  dot.addEventListener("click", () => {
    if (choiceMode) return; // can't change pages while choosing
    currentIndex = i;
    clearBranch();
    showImage(currentIndex);
  });
  pageDotsContainer.appendChild(dot);
}

// clears locks and jumps
function clearBranch(){
  branchLock = null;
  nextOverride.clear();
}

// disables buttons when needed
function applyNavLock(){
  const lockPrev = (currentIndex===0) || choiceMode;
  const lockNext = (currentIndex===totalComics-1) || (branchLock && currentIndex===branchLock.lockAt) || choiceMode;
  prevBtn.disabled = lockPrev;
  nextBtn.disabled = lockNext;
  pageDotsContainer.classList.toggle('disabled', choiceMode);
}

// main function to show image + caption
function showImage(index) {
  comicImage.src = images[index]; // show picture
  currentPage.textContent = String(index + 1).padStart(2, "0");
  sceneCaption.textContent = descriptions[index] || `Scene ${index+1}`;

  // highlight correct dot
  document.querySelectorAll(".dot").forEach((dot, i) =>
    dot.classList.toggle("active", i === index)
  );

  // show warning if path ended
  if (branchLock && index === branchLock.lockAt) {
    sceneCaption.textContent += " — End of this path. Go back to the choice.";
  }

  renderChoicesFor(index); // check if it's a choice scene
  applyNavLock();          // enable/disable buttons
}

// show choice options
function enterChoiceMode(){
  choiceMode = true;
  choiceBlock.classList.add('active');
  applyNavLock();
}

// hide choices
function exitChoiceMode(){
  choiceMode = false;
  choiceBlock.classList.remove('active');
  applyNavLock();
}

// render choices depending on the current page
function renderChoicesFor(index){
  choiceGrid.innerHTML = "";
  choiceBlock.classList.remove('active');
  choiceMode = false;

  // clear old branch locks if we are on a choice page
  if(index === CHOICE1 || index === CHOICE2){ clearBranch(); }

  // first choice scene
  if(index === CHOICE1){
    choiceEyebrow.textContent = "Madina faces a choice";
    choiceQuestion.textContent = "What should Madina do? Choose her path...";

    addChoice("I WAS SICK", "Be honest about being unwell.", () => {
      exitChoiceMode(); clearBranch();
      currentIndex = 3;                // go to 4.jpeg
      nextOverride.set(4, 7);          // skip 5.jpeg -> go to 8.jpeg
      showImage(currentIndex);
    });

    addChoice("I WAS LAZY", "Admit you skipped without reason.", () => {
      exitChoiceMode(); clearBranch();
      currentIndex = 5;                // go to 6.jpeg
      branchLock = { lockAt: 6, backTo: CHOICE1 }; // stop after 7.jpeg
      showImage(currentIndex);
    });

    enterChoiceMode();
  }

  // second choice scene
  if(index === CHOICE2){
    choiceEyebrow.textContent = "Another choice appears";
    choiceQuestion.textContent = "Run to class or cut the line?";

    addChoice("RUN TO CLASS", "Play fair; keep moving.", () => {
      exitChoiceMode(); clearBranch();
      currentIndex = 13;               // go to 14.jpeg
      nextOverride.set(13, 15);        // then jump to 16.jpeg
      showImage(currentIndex);
    });

    addChoice("CUT THE LINE", "Jump ahead for speed.", () => {
      exitChoiceMode(); clearBranch();
      currentIndex = 14;               // go to 15.jpeg
      branchLock = { lockAt: 14, backTo: CHOICE2 }; // lock on 15.jpeg
      showImage(currentIndex);
    });

    enterChoiceMode();
  }
}

// small helper to make each choice card
function addChoice(title, desc, handler){
  const card = document.createElement('div');
  card.className = 'choice-card';
  card.innerHTML = `<div class="choice-title">${title}</div><div class="choice-desc">${desc}</div>`;
  card.addEventListener('click', handler);
  choiceGrid.appendChild(card);
}

// go back button
prevBtn.addEventListener("click", () => {
  if (choiceMode) return;
  if (currentIndex > 0) {
    if(branchLock && currentIndex === branchLock.lockAt){
      currentIndex = branchLock.backTo; // jump back to choice
    }else{
      currentIndex--;
      // if we go back to a choice page, unlock everything
      if(currentIndex === CHOICE1 || currentIndex === CHOICE2){ clearBranch(); }
    }
    showImage(currentIndex);
  }
});

// next button
nextBtn.addEventListener("click", () => {
  if (choiceMode) return; // block when choosing
  if (branchLock && currentIndex === branchLock.lockAt) return; // stop if locked

  let nextIndex = nextOverride.has(currentIndex)
    ? nextOverride.get(currentIndex)
    : currentIndex + 1;

  if (nextIndex < totalComics) {
    currentIndex = nextIndex;
    showImage(currentIndex);
    startBGM(); // play bgm first time user hits next
  }
});

// when page loads, show the first comic
totalPagesEl.textContent = String(totalComics).padStart(2,'0');
showImage(0);
