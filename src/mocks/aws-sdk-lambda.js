// Mock for @aws-sdk/client-lambda
const MOCK_DATA = {
  Functions: [
    { FunctionName: 'my-function', Runtime: 'python3.11', Handler: 'handler.lambda_handler', MemorySize: 128, Timeout: 30, FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:my-function', LastModified: '2024-01-01T00:00:00Z' },
    { FunctionName: 'node-function', Runtime: 'nodejs20.x', Handler: 'index.handler', MemorySize: 256, Timeout: 60, FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:node-function', LastModified: '2024-01-02T00:00:00Z' },
  ],
  StatusCode: 200,
  Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '"Hello from Lambda!"' })),
  LogResult: Buffer.from('START RequestId: abc\nEND RequestId: abc\nREPORT Duration: 12.3 ms\n').toString('base64'),
};

export class LambdaClient {
  constructor() {}
  send() {
    return new Promise(resolve => {
      setTimeout(() => resolve({
        Functions: [
          { FunctionName: 'my-function', Runtime: 'python3.11', Handler: 'handler.lambda_handler', MemorySize: 128, Timeout: 30, FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:my-function', LastModified: '2024-01-01T00:00:00Z' },
          { FunctionName: 'node-function', Runtime: 'nodejs20.x', Handler: 'index.handler', MemorySize: 256, Timeout: 60, FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:node-function', LastModified: '2024-01-02T00:00:00Z' },
        ],
        StatusCode: 200,
        Payload: new Uint8Array(Buffer.from(JSON.stringify({ statusCode: 200, body: '"Hello from Lambda!"' }))),
        LogResult: Buffer.from('START RequestId: abc\nEND RequestId: abc\nREPORT Duration: 12.3 ms\n').toString('base64'),
      }), 0);
    });
  }
  destroy() {}
}

export class ListFunctionsCommand {
  constructor(input) { if (input) Object.assign(this, input); }
}

export class DeleteFunctionCommand {
  constructor(input) { if (input) Object.assign(this, input); }
}

export class InvokeCommand {
  constructor(input) { if (input) Object.assign(this, input); }
}
