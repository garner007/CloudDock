// Mock for @aws-sdk/util-dynamodb
export function unmarshall(item) {
  const result = {};
  for (const [key, val] of Object.entries(item)) {
    if (val.S !== undefined) result[key] = val.S;
    else if (val.N !== undefined) result[key] = Number(val.N);
    else if (val.BOOL !== undefined) result[key] = val.BOOL;
    else result[key] = val;
  }
  return result;
}
