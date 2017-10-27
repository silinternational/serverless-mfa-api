# Serverless MFA API
A Serverless API for registering and validating Multi-Factory Authentication methods. 

Currently supports Time-based One Time Passwords (TOTP) and FIDO U2F devices (YubiKeys).

For details about the various API endpoints, see
[the RAML file](https://github.com/silinternational/serverless-mfa-api/blob/master/api.raml).

## Basic Workflow

- A consumer of this API does a `POST` to `/api-key`, providing an email
  address.
  * NOTE: To keep this API from being wide open to anyone, we protect our
    endpoints at/under `/api-key` with API Gateway's built-in api keys, which
    must be provided as an `x-api-key` header in the HTTP request.
- We create a new API Key and email it to that email address.
  * NOTE: At the moment, we do not actually send that email, since our use case
    is so limited that we can simply look up the API Key in the database.
- The consumer does a `POST` to `/api-key/activate`, providing the email address
  and the API Key.
- We respond with an API Secret (which is actually an AES key, which we will use
  for encrypting their data), saving a strongly hashed copy of that API
  Secret for validating later calls that provide the API Secret.
  
### TOTP
- The consumer does a `POST` to `/totp`, providing their API Key and API Secret
  in the headers.
- We respond with a UUID, TOTP key, and QR Code, and we encrypt that TOTP key
  using the API Secret, storing the result.
- The consumer at some point does a `POST` to `/totp/{uuid}/validate`, providing
  their API Key and API Secret in the headers and the 6-digit code in the body.
- We get the TOTP records we have for that API Key, retrieve the one with the
  given UUID, use the (validated) API Secret to decrypt that TOTP key, and use
  the TOTP key to check the given 6-digit code for validity.
  
### U2F Registration
- The consumer does a `POST` to `/u2f`, providing their API Key and API Secret
  in the headers as well as the `appId` in the JSON body.
- We respond with an object including the UUID for further API calls as well as 
  the challenge object to be passed along to the browser's `u2f.register()` call. 
- The consumer uses the `u2f.register()` javascript API call in the browser.
- The end user inserts their FIDO U2F device and the light should be blinking and
  the user presses the button on the device.
- Pressing the button will trigger the callback method provided to the `u2f.register()`
  call which should pass the response object to the consumer's service, which in turn 
  can make a `PUT` call to `/mfa/{uuid}` with a JSON body including a property named
  `signResult` with a value of the object returned from the U2F device.
- We will validate the response and store the `keyHandle` and `publicKey` encrypted by
  the consumer's API Secret and respond with a success or error message. 

### U2F Authentication
- The consumer does a `POST` to `/u2f/{uuid}/auth`, providing their API Key and API Secret
  in the headers.
- We respond with the challenge object to be passed along to the the browser's `u2f.sign()`
  call.
- The end user inserts their FIDO U2F device and the light should be blinking and
  the user presses the button on the device.
- Pressing the button will trigger the callback method provided to the `u2f.sign()`
  call which should pass the response object to the consumer's service, which in turn 
  can make a `PUT` call to `/mfa/{uuid}/auth` with a JSON body including a property named
  `signResult` with a value of the object returned from the U2F device.
- We will validate the signResult and respond with a success or error message. 

## Notes about FIDO U2F
- [FIDO U2F](https://www.yubico.com/solutions/fido-u2f/) is still relatively new with very limited support
  by browsers. In fact it is really only supported in Chrome without the need of installing extensions. 
- Interaction with U2F devices either requires integration at a very low level or the use of 
  a higher level javascript API. Oddly enough, the javascript API is not maintained in
  a distributable format. A copy of it can be obtained from YubiCo at https://demo.yubico.com/js/u2f-api.js
  or as part of a demo application from Google's GitHub: https://raw.githubusercontent.com/google/u2f-ref-code/master/u2f-gae-demo/war/js/u2f-api.js
- The `appId` used in the registration process must match the URL of the page where the user is authenticating and it
  must be HTTPS. It does  not need the full path though, so https://myapp.com is sufficient if the page is at 
  https://myapp.com/auth/login.

## Continuous Integration / Continuous Deployment (CI/CD)

To set this up on Codeship, do the following:

- Create a Codeship Basic project.
- Give it a Setup Command of `./codeship/setup.sh`
- Give it a Test Command of `./codeship/test.sh`
- Create a Deployment Pipeline for the `develop` branch with this command:
  `./codeship/deploy-dev.sh`
- Create a Deployment Pipeline for the `master` branch with this command:
  `./codeship/deploy-prod.sh`
- Provide `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
  with the credentials of the AWS IAM user that Serverless (running on Codeship)
  should act as when deploying this API.

## Glossary

- `API Key`: A hex string used to identify calls to most of the endpoints on
  this API. We store a copy of this in the database.
- `API Secret`: A base-64 encoded random value used to encrypt/decrypt the
  consumer's data. We store a salted, stretched hash of this (as we
  would a password) for validating later calls that provide an API Secret.
- `TOTP Key`: The secret used for generating TOTP values. This is provided to
  the consumer of this API for them to show as a string / QR Code to their end
  user. We store an encrypted copy of this (encrypted using the API Secret) so
  that when we need to verify given 6-digit code, we can do so.
