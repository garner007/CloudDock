// Mock for @aws-sdk/client-sqs
const ENDPOINT = 'http://localhost:4566';

export class SQSClient {
  constructor() {}
  send(cmd) {
    const type = cmd?._type || '';
    if (type === 'GetQueueAttributesCommand') {
      const url = cmd.QueueUrl || '';
      if (url.includes('fifo')) {
        return Promise.resolve({ Attributes: { ApproximateNumberOfMessages: '3', ApproximateNumberOfMessagesNotVisible: '0', ApproximateNumberOfMessagesDelayed: '0', FifoQueue: 'true' } });
      }
      return Promise.resolve({ Attributes: { ApproximateNumberOfMessages: '5', ApproximateNumberOfMessagesNotVisible: '0', ApproximateNumberOfMessagesDelayed: '0' } });
    }
    if (type === 'ReceiveMessageCommand') {
      return Promise.resolve({ Messages: [{ MessageId: 'msg-001', ReceiptHandle: 'receipt-001', Body: '{"hello":"world"}', Attributes: { SentTimestamp: '1704067200000' } }] });
    }
    if (type === 'SendMessageCommand') {
      return Promise.resolve({ MessageId: 'test-msg-123', MD5OfMessageBody: 'abc123' });
    }
    // Default: ListQueues + CreateQueue
    return Promise.resolve({
      QueueUrls: [`${ENDPOINT}/000000000000/my-queue`, `${ENDPOINT}/000000000000/my-fifo-queue.fifo`],
      QueueUrl: `${ENDPOINT}/000000000000/new-queue`,
    });
  }
  destroy() {}
}

export class ListQueuesCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'ListQueuesCommand'; } }
export class GetQueueAttributesCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'GetQueueAttributesCommand'; } }
export class CreateQueueCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'CreateQueueCommand'; } }
export class DeleteQueueCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'DeleteQueueCommand'; } }
export class ReceiveMessageCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'ReceiveMessageCommand'; } }
export class SendMessageCommand { constructor(i) { if (i) Object.assign(this, i); this._type = 'SendMessageCommand'; } }
