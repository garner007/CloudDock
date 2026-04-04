// Mock for @aws-sdk/client-eventbridge
export class EventBridgeClient {
  constructor() {}
  send() {
    return Promise.resolve({
      EventBuses: [
        { Name: 'default', Arn: 'arn:aws:events:us-east-1:000000000000:event-bus/default' },
      ],
      Rules: [],
      FailedEntryCount: 0,
    });
  }
  destroy() {}
}

export class ListEventBusesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class ListRulesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PutRuleCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteRuleCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PutEventsCommand { constructor(i) { if (i) Object.assign(this, i); } }
