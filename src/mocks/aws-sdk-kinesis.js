// Mock for @aws-sdk/client-kinesis
export class KinesisClient {
  constructor() {}
  send() {
    return Promise.resolve({
      StreamNames: [],
      StreamDescriptionSummary: {
        StreamStatus: 'ACTIVE',
        OpenShardCount: 1,
        RetentionPeriodHours: 24,
        ConsumerCount: 0,
      },
    });
  }
  destroy() {}
}

export class ListStreamsCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DescribeStreamSummaryCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateStreamCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteStreamCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PutRecordCommand { constructor(i) { if (i) Object.assign(this, i); } }
