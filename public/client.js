let cardsList = [];
let studyQueue = [];
let studyIndex = 0;

const statBox1 = document.getElementById('stat-box-1');
const statBox2 = document.getElementById('stat-box-2');
const statBox3 = document.getElementById('stat-box-3');
const statBox4 = document.getElementById('stat-box-4');
const statBox5 = document.getElementById('stat-box-5');
const dueMessage = document.getElementById('due-message');
const startStudyBtn = document.getElementById('start-study-btn');

const studySection = document.getElementById('study-section');
const studyCardProgress = document.getElementById('study-card-progress');
const studyQuestion = document.getElementById('study-question');
const studyAnswerContainer = document.getElementById('study-answer-container');
const studyAnswer = document.getElementById('study-answer');
const revealBtn = document.getElementById('reveal-btn');
const reviewActions = document.getElementById('review-actions');
const wrongBtn = document.getElementById('wrong-btn');
const rightBtn = document.getElementById('right-btn');

const studyCompleteSection = document.getElementById('study-complete-section');
const closeStudyBtn = document.getElementById('close-study-btn');

const cardForm = document.getElementById('card-form');
const formTitle = document.getElementById('form-title');
const formCardId = document.getElementById('form-card-id');
const formQuestion = document.getElementById('form-question');
const formAnswer = document.getElementById('form-answer');
const formSubmitBtn = document.getElementById('form-submit-btn');
const formCancelBtn = document.getElementById('form-cancel-btn');

const cardsTableBody = document.getElementById('cards-table-body');

async function fetchCards() {
  try {
    const res = await fetch('/api/cards');
    const data = await res.json();
    cardsList = data.cards;
    updateDashboard();
    renderCardsTable();
  } catch (err) {
    dueMessage.textContent = 'Error loading cards.';
  }
}

function updateDashboard() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const now = new Date();
  let dueCount = 0;

  const todayStr = now.toISOString().split('T')[0];

  cardsList.forEach(card => {
    if (counts[card.box] !== undefined) {
      counts[card.box]++;
    }
    if (card.nextReviewDate <= todayStr) {
      dueCount++;
    }
  });

  statBox1.textContent = counts[1];
  statBox2.textContent = counts[2];
  statBox3.textContent = counts[3];
  statBox4.textContent = counts[4];
  statBox5.textContent = counts[5];

  if (dueCount === 0) {
    dueMessage.textContent = 'Excellent! No cards are due for review today.';
    startStudyBtn.classList.add('hidden');
  } else {
    dueMessage.textContent = `You have ${dueCount} card${dueCount > 1 ? 's' : ''} due for review today.`;
    startStudyBtn.classList.remove('hidden');
  }
}

function renderCardsTable() {
  if (cardsList.length === 0) {
    cardsTableBody.innerHTML = `<tr><td colspan="5" class="empty-message">No cards found. Create one above to begin!</td></tr>`;
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  cardsTableBody.innerHTML = '';

  cardsList.forEach(card => {
    const row = document.createElement('tr');
    const isDue = card.nextReviewDate <= todayStr;
    const dueString = isDue ? 'Due Now' : card.nextReviewDate;

    const qCell = document.createElement('td');
    qCell.textContent = card.question;
    row.appendChild(qCell);

    const aCell = document.createElement('td');
    aCell.textContent = '*****';
    row.appendChild(aCell);

    const boxCell = document.createElement('td');
    boxCell.textContent = `Box ${card.box}`;
    row.appendChild(boxCell);

    const dateCell = document.createElement('td');
    dateCell.textContent = dueString;
    if (isDue) {
      dateCell.style.color = '#ef4444';
      dateCell.style.fontWeight = 'bold';
    }
    row.appendChild(dateCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(card));
    actionsCell.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteCard(card.id));
    actionsCell.appendChild(deleteBtn);

    row.appendChild(actionsCell);
    cardsTableBody.appendChild(row);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const cardId = formCardId.value;
  const payload = {
    question: formQuestion.value.trim(),
    answer: formAnswer.value.trim()
  };

  try {
    let url = '/api/cards';
    let method = 'POST';

    if (cardId) {
      url = `/api/cards?id=${cardId}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      resetForm();
      await fetchCards();
    }
  } catch (err) {
    console.error('Failed to submit form:', err);
  }
}

function startEdit(card) {
  formTitle.textContent = 'Edit Flashcard';
  formCardId.value = card.id;
  formQuestion.value = card.question;
  formAnswer.value = card.answer;
  formSubmitBtn.textContent = 'Update Card';
  formSubmitBtn.className = 'btn btn-primary';
  formCancelBtn.classList.remove('hidden');
  window.scrollTo({ top: cardForm.offsetTop - 20, behavior: 'smooth' });
}

function resetForm() {
  formTitle.textContent = 'Create Flashcard';
  formCardId.value = '';
  cardForm.reset();
  formSubmitBtn.textContent = 'Add Card';
  formSubmitBtn.className = 'btn btn-success';
  formCancelBtn.classList.add('hidden');
}

async function deleteCard(id) {
  try {
    const res = await fetch(`/api/cards?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (formCardId.value === id) {
        resetForm();
      }
      await fetchCards();
    }
  } catch (err) {
    console.error('Failed to delete card:', err);
  }
}

function startStudySession() {
  const todayStr = new Date().toISOString().split('T')[0];
  studyQueue = cardsList.filter(card => card.nextReviewDate <= todayStr);
  if (studyQueue.length === 0) return;

  studyIndex = 0;
  studySection.classList.remove('hidden');
  studyCompleteSection.classList.add('hidden');
  renderStudyCard();
}

function renderStudyCard() {
  const card = studyQueue[studyIndex];
  studyCardProgress.textContent = `Card ${studyIndex + 1} of ${studyQueue.length}`;
  studyQuestion.textContent = card.question;
  studyAnswer.textContent = card.answer;

  studyAnswerContainer.classList.add('hidden');
  reviewActions.classList.add('hidden');
  revealBtn.classList.remove('hidden');
}

function revealAnswer() {
  studyAnswerContainer.classList.remove('hidden');
  reviewActions.classList.remove('hidden');
  revealBtn.classList.add('hidden');
}

async function submitReview(correct) {
  const card = studyQueue[studyIndex];
  try {
    const res = await fetch('/api/cards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, correct })
    });

    if (res.ok) {
      const updatedCard = await res.json();
      const idx = cardsList.findIndex(c => c.id === updatedCard.id);
      if (idx !== -1) {
        cardsList[idx] = updatedCard;
      }

      updateDashboard();
      renderCardsTable();

      studyIndex++;
      if (studyIndex < studyQueue.length) {
        renderStudyCard();
      } else {
        studySection.classList.add('hidden');
        studyCompleteSection.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Failed to submit review:', err);
  }
}

function endStudySession() {
  studyCompleteSection.classList.add('hidden');
  fetchCards();
}

cardForm.addEventListener('submit', handleFormSubmit);
formCancelBtn.addEventListener('click', resetForm);
startStudyBtn.addEventListener('click', startStudySession);
revealBtn.addEventListener('click', revealAnswer);
wrongBtn.addEventListener('click', () => submitReview(false));
rightBtn.addEventListener('click', () => submitReview(true));
closeStudyBtn.addEventListener('click', endStudySession);

window.addEventListener('DOMContentLoaded', fetchCards);
