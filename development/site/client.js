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

const sendWebauthnRegistrationToServer = async (apiKey, apiSecret, userUuid, registrationCredential) => {
  fetch('/webauthn/' + userUuid, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-mfa-apikey': apiKey,
      'x-mfa-apisecret': apiSecret,
    },
    body: JSON.stringify(registrationCredential)
  }).then(
    response => response.json()
  ).then(
    registrationResponse => console.log('registrationResponse:', registrationResponse) // TEMP
  );
};

const onWebauthnRegistrationFormSubmit = async form => {
  const registrationRequest = makeRequestFrom(form);
  const apiKey = form.apiKey.value;
  const apiSecret = form.apiSecret.value;
  fetch('/webauthn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mfa-apikey': apiKey,
      'x-mfa-apisecret': apiSecret,
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
    registrationCredential => sendWebauthnRegistrationToServer(
      apiKey,
      apiSecret,
      registrationRequest.user.id,
      registrationCredential
    )
  );
};

window.addSubmitListener = addSubmitListener;
window.onWebauthnRegistrationFormSubmit = onWebauthnRegistrationFormSubmit;

