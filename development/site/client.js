const addSubmitListener = (formId, listener) => {
  document.getElementById(formId).addEventListener("submit", event => {
    event.preventDefault();
    saveInputValues();
    listener(event.target);
  });
};

const saveInputValues = () => {
  forEachFormInput(input => {
    localStorage.setItem(input.name, input.value)
  })
}

const restoreInputValues = () => {
  forEachFormInput(input => {
    input.value = localStorage.getItem(input.name)
  })
}

const forEachFormInput = doThis => {
  document.querySelectorAll('form input').forEach(doThis)  
}

const makeRegistrationRequestFrom = form => ({
  "relyingParty": {
    "id": window.psl.parse(window.location.hostname).domain,
    "name": "ACME Corp."
  },
  "user": {
    "id": form.userId.value,
    "name": form.username.value,
    "displayName": form.userDisplayName.value
  },
  "attestation": "direct" // Preferred "none", but @webauthn/server doesn't support that yet.
});

const rejectIfNotOk = async response => {
  if (!response.ok) {
    console.log('Not ok:', response)
    throw new Error(JSON.stringify(await response.json()))
  }
  console.log('Ok:', response)
  return response
};

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
    rejectIfNotOk
  ).then(
    response => response.json()
  ).then(
    registrationResponse => console.log('registrationResponse:', registrationResponse) // TEMP
  );
};

const onWebauthnRegistrationFormSubmit = async form => {
  const registrationRequest = makeRegistrationRequestFrom(form);
  const apiKey = form.apiKey.value;
  const apiSecret = form.apiSecret.value;
  createWebauthnRegistration(apiKey, apiSecret, registrationRequest)
};

const createWebauthnRegistration = (apiKey, apiSecret, registrationRequest) => {
  fetch('/webauthn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mfa-apikey': apiKey,
      'x-mfa-apisecret': apiSecret,
    },
    body: JSON.stringify(registrationRequest)
  }).then(
    rejectIfNotOk
  ).then(
    response => response.json()
  ).then(
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
window.restoreInputValues = restoreInputValues;

window.onWebauthnRegistrationFormSubmit = onWebauthnRegistrationFormSubmit;

window.onunhandledrejection = promiseRejectionEvent => {
  alert(promiseRejectionEvent.reason)
};
