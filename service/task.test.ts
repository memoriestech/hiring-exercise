import { it } from 'vitest';
import service from './task';
import { client } from './dynamodb';
import { ListTablesCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { Table } from 'sst/node/table';
import { TaskPriority, TaskStatus } from 'generated/server';

beforeEach(async () => {
  const existingTables = await client.send(new ListTablesCommand({}));

  if (!existingTables.TableNames?.includes(Table.Task.tableName)) {
    await client.send(
      new CreateTableCommand({
        TableName: Table.Task.tableName,
        KeySchema: [
          { AttributeName: 'pk', KeyType: 'HASH' },
          { AttributeName: 'sk', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'pk', AttributeType: 'S' },
          { AttributeName: 'sk', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      })
    );
  }
});

it('adds a new task', async () => {
  const task = await service.add({
    title: 'new task'
  });

  expect(task).toEqual({
    id: task.id,
    priority: 'low',
    title: 'new task',
    status: 'todo',
    created: task.created,
    modified: task.modified
  });
});

it('gets all tasks', async () => {
  const task = await service.add({
    title: 'another task'
  });

  const all = await service.all();

  expect(all.find(a => a.id === task.id)).toEqual(task);
});

it('removes task', async () => {
  const task = await service.add({
    title: 'another task'
  });

  await service.remove(task.id);
  const all = await service.all();

  expect(all.find(a => a.id === task.id)).toBeUndefined();
});

it('edits task', async () => {
  const task = await service.add({
    title: 'another task'
  });

  const edit = {
    id: task.id,
    title: 'updated title',
    priority: TaskPriority.High,
    status: TaskStatus.Done
  };

  const result = await service.edit(edit);

  expect(result).toEqual({ ...edit, created: task.created, modified: result.modified });
});
