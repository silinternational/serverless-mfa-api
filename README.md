# totp-api
Simple standalone API for creating and validating TOTP codes

## Basic Workflow

- A consumer of this API does a `POST` to `/api-key`, providing an email
  address.
- We create a new API Key and email it to that email address.
- The consumer does a `POST` to `/api-key/activate`, providing the email address
  and the API Key.
- We respond with an API Secret (which is actually an AES key, which we will use
  for encrypting their TOTP Keys).
- The consumer does a `POST` to `/totp`, providing their API Key and API Secret
  in the headers.
- We respond with a UUID, TOTP key, and QR Code, and we encrypt that TOTP key
  using the API Secret, storing the result.
- The consumer at some point does a `POST` to `/totp/{uuid}/validate`, providing
  their API Key and API Secret in the headers and the 6-digit code in the body.
- We get the TOTP records we have for that API Key, retrieve the one with the
  given UUID, use the API Secret to decrypt that TOTP key, and use it to
  generate a 6-digit code to compare to the one we were given.

For details about the various API endpoints, see
[the RAML file](https://github.com/silinternational/totp-api/blob/master/api.raml).
