import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({
  ...(Boolean(process.env.VITEST_WORKER_ID) && {
    endpoint: 'http://localhost:8000',
    region: 'local',
    credentials: {
      accessKeyId: 'xxx',
      secretAccessKey: 'xxx'
    }
  })
});

export const client = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
});
