'use client';

import { useState } from 'react';
import { Row } from '@tanstack/react-table';
import { graphql } from 'generated/client';
import { Task } from 'generated/client/graphql';
import { Button } from 'ui/button';
import { useMutation } from '@apollo/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'ui/form';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from 'ui/alert-dialog';
import * as z from 'zod';
import { Input } from 'ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriority, TaskStatus } from 'generated/server';
import { useForm } from 'react-hook-form';
import { useToast } from 'ui/use-toast';
import { RadioGroup, RadioGroupItem } from 'ui/radio-group';
import { Icons } from 'ui/icons';

const deleteTaskDocument = graphql(`
  mutation RemoveTask($id: ID!) {
    removeTask(taskId: $id)
  }
`);

const editTaskDocument = graphql(`
  mutation editTask($input: EditTaskInput!) {
    editTask(input: $input) {
      id
      title
      status
      priority
    }
  }
`);

const formSchema = z.object({
  title: z.string().min(2).max(50),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus)
});

export default function DataTableRowActions({ row }: { row: Row<Task> }) {
  const [editOpen, setEditOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();
  const [editTask, { loading }] = useMutation(editTaskDocument);
  const [removeTask] = useMutation(deleteTaskDocument, {
    update(cache) {
      const id = cache.identify({ id: row.original.id, __typename: 'Task' });
      cache.evict({ id });
      cache.gc();
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: row.original
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await editTask({ variables: { input: { ...values, id: row.original.id } } });
    setEditOpen(false);
    toast({ description: 'Your task is updated' });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <Icons.moreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.pen className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAlertOpen(true)}>
            <Icons.trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await removeTask({ variables: { id: row.original.id } });
                toast({ description: 'Your task is deleted.' });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent position="right">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
            <SheetDescription>Edit your task description.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="get groceries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <RadioGroup
                        className="grid grid-cols-3 gap-4"
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        {Object.entries(TaskPriority).map(([value, key]) => {
                          return (
                            <FormItem key={key}>
                              <FormLabel
                                htmlFor={key}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <FormControl>
                                  <RadioGroupItem value={key} id={key} className="sr-only" />
                                </FormControl>
                                {value}
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <RadioGroup
                        className="grid grid-cols-3 gap-4"
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        {Object.entries(TaskStatus).map(([value, key]) => {
                          return (
                            <FormItem key={key}>
                              <FormLabel
                                htmlFor={key}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <FormControl>
                                  <RadioGroupItem value={key} id={key} className="sr-only" />
                                </FormControl>
                                {value}
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  Save Task
                </Button>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
