const addSubmitListener = (formId, listener) => {
  document.getElementById(formId).addEventListener("submit", event => {
    event.preventDefault();
    listener(event.target);
  });
};

const makeRequestFrom = form => ({
  "relyingParty": {
    "id": window.location.hostname,
    "name": "ACME Corp."
  },
  "user": {
    "id": form.userId.value,
    "name": form.username.value,
    "displayName": form.userDisplayName.value
  },
  "attestation": "none"
});

const onRegistrationFormSubmit = async form => {
  const registrationRequest = makeRequestFrom(form);
  fetch('/webauthn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(registrationRequest)
  }).then(
    response => response.json()
  ).then(
    window.solveRegistrationChallenge
  ).then(
    console.log
  );
};

window.addSubmitListener = addSubmitListener;
window.onRegistrationFormSubmit = onRegistrationFormSubmit;
