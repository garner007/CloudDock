// Mock for @aws-sdk/client-sns
export class SNSClient {
  constructor() {}
  send() {
    return Promise.resolve({
      Topics: [
        { TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic' },
      ],
      Subscriptions: [],
    });
  }
  destroy() {}
}

export class ListTopicsCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class ListSubscriptionsByTopicCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateTopicCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteTopicCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PublishCommand { constructor(i) { if (i) Object.assign(this, i); } }
