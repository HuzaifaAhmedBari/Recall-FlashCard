let cardsList = [];

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
    renderCardsTable();
  } catch (err) {
    cardsTableBody.innerHTML = `<tr><td colspan="3" class="empty-message">Error loading cards.</td></tr>`;
  }
}

function renderCardsTable() {
  if (cardsList.length === 0) {
    cardsTableBody.innerHTML = `<tr><td colspan="3" class="empty-message">No cards found. Create one above to begin!</td></tr>`;
    return;
  }

  cardsTableBody.innerHTML = '';

  cardsList.forEach(card => {
    const row = document.createElement('tr');

    const qCell = document.createElement('td');
    qCell.textContent = card.question;
    row.appendChild(qCell);

    const aCell = document.createElement('td');
    aCell.textContent = card.answer;
    row.appendChild(aCell);

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
  formCancelBtn.hidden = false;
  window.scrollTo({ top: cardForm.offsetTop - 20, behavior: 'smooth' });
}

function resetForm() {
  formTitle.textContent = 'Create Flashcard';
  formCardId.value = '';
  cardForm.reset();
  formSubmitBtn.textContent = 'Add Card';
  formSubmitBtn.className = 'btn btn-success';
  formCancelBtn.hidden = true;
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

cardForm.addEventListener('submit', handleFormSubmit);
formCancelBtn.addEventListener('click', resetForm);

window.addEventListener('DOMContentLoaded', fetchCards);
