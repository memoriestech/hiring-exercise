import { AddTaskInput, EditTaskInput, Task, TaskPriority, TaskStatus } from 'generated/server';
import { client } from 'service/dynamodb';
import { UpdateCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { randomUUID } from 'crypto';

type DynamodbTask = {
  pk: string; // always "task"
  sk: string; // task id
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  created: string;
  modified: string;
};

const taskToDynamodb = (task: Task): DynamodbTask => ({
  pk: 'task',
  sk: task.id,
  priority: task.priority,
  title: task.title,
  status: task.status,
  created: task.created,
  modified: task.modified
});

const dynamodbToTask = (task: DynamodbTask): Task => ({
  id: task.sk,
  priority: task.priority,
  title: task.title,
  status: task.status,
  created: task.created,
  modified: task.modified
});

const all = async () => {
  const command = new QueryCommand({
    TableName: Table.Task.tableName,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames: { '#pk': 'pk' },
    ExpressionAttributeValues: { ':pk': 'task' }
  });

  const result = await client.send(command);

  return result.Items?.map(i => dynamodbToTask(i as DynamodbTask)) ?? [];
};

const add = async (input: AddTaskInput) => {
  const now = new Date().toISOString();

  const task = {
    id: randomUUID(),
    priority: input.priority ?? TaskPriority.Low,
    title: input.title,
    status: input.status ?? TaskStatus.Todo,
    created: now,
    modified: now
  };

  await client.send(
    new PutCommand({
      TableName: Table.Task.tableName,
      Item: taskToDynamodb(task)
    })
  );

  return task;
};

const edit = async (input: EditTaskInput) => {
  let expression = 'set';
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const { id, ...rest } = input;

  for (const property in rest) {
    expression += ` #${property} = :${property} ,`;
    names['#' + property] = property;
    values[':' + property] = (input as Record<string, string | null>)[property];
  }

  expression = expression.slice(0, -1);

  const command = new UpdateCommand({
    TableName: Table.Task.tableName,
    Key: { pk: 'task', sk: id },
    UpdateExpression: expression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW'
  });

  const result = await client.send(command);

  return dynamodbToTask(result.Attributes as DynamodbTask);
};

const remove = async (id: string | number) => {
  await client.send(
    new DeleteCommand({
      TableName: Table.Task.tableName,
      Key: { pk: 'task', sk: id }
    })
  );

  return true;
};

const task = { all, add, edit, remove };

export default task;
