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
  "attestation": "direct" // Preferred "none", but @webauthn/server doesn't support that yet.
});

const onWebauthnRegistrationFormSubmit = async form => {
  const registrationRequest = makeRequestFrom(form);
  fetch('/webauthn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mfa-apikey': form.apiKey.value,
      'x-mfa-apisecret': form.apiSecret.value,
    },
    body: JSON.stringify(registrationRequest)
  }).then(async response => {
    console.log("Response:", response);
    const responseData = await response.json();
    if (response.ok) {
      return responseData
    } else {
      console.log('Error:', responseData)
    }
  }).then(
    window.solveRegistrationChallenge
  ).then(
    registrationCredential => sendWebauthnRegistrationToServer(registrationRequest.user.id, registrationCredential)
  );
};

window.addSubmitListener = addSubmitListener;
window.onWebauthnRegistrationFormSubmit = onWebauthnRegistrationFormSubmit;

