const makeRequestFrom = registrationForm => ({
  "relyingParty": {
    "id": window.location.hostname,
    "name": "ACME Corp."
  },
  "user": {
    "id": registrationForm.userId.value,
    "name": registrationForm.username.value,
    "displayName": registrationForm.userDisplayName.value
  },
  "attestation": "none"
})

const onRegistrationFormSubmit = async event => {
  event.preventDefault();
  const registrationRequest = makeRequestFrom(event.target.form);
  fetch('/webauthn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(registrationRequest)
  }).then(
    response => response.json()
  ).then(
    data => console.log("Response data:", data)
  );
}

window.onRegistrationFormSubmit = onRegistrationFormSubmit;
