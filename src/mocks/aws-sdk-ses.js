// Mock for @aws-sdk/client-ses
export class SESClient {
  constructor() {}
  send() {
    return Promise.resolve({
      Identities: [],
      VerificationAttributes: {},
    });
  }
  destroy() {}
}

export class ListIdentitiesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class GetIdentityVerificationAttributesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class VerifyEmailIdentityCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteIdentityCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class SendEmailCommand { constructor(i) { if (i) Object.assign(this, i); } }
