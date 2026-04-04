// Mock for @aws-sdk/client-acm
export class ACMClient {
  constructor() {}
  send() {
    return Promise.resolve({
      CertificateSummaryList: [
        {
          DomainName: 'example.com',
          CertificateArn: 'arn:aws:acm:us-east-1:000000000000:certificate/abc-123',
          Status: 'ISSUED',
          Type: 'AMAZON_ISSUED',
        },
      ],
      Certificate: {
        DomainName: 'example.com',
        CertificateArn: 'arn:aws:acm:us-east-1:000000000000:certificate/abc-123',
        Status: 'ISSUED',
      },
    });
  }
  destroy() {}
}

export class ListCertificatesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class RequestCertificateCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteCertificateCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DescribeCertificateCommand { constructor(i) { if (i) Object.assign(this, i); } }
