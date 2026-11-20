import { useId, useRef, useState, type SubmitEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { fieldDescriptionId } from '@/components/ui/form-control';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { mapValidationIssues, toValidationIssues, type FieldErrors } from '@/lib/form-errors';

import { useCreateTask } from '../api/create-task';
import { isTaskPriority, PRIORITY_OPTIONS, TASK_LIMITS } from '../constants/task.constants';
import {
  CREATE_TASK_FORM_FIELDS,
  createTaskFormSchema,
  type CreateTaskFormField,
  type CreateTaskFormValues,
} from '../schemas/task-form.schema';

const INITIAL_VALUES: CreateTaskFormValues = {
  title: '',
  description: '',
  priority: 'medium',
};

function CharacterCount({ length, max }: { length: number; max: number }) {
  return (
    <span className={cn('tabular-nums', length > max && 'font-medium text-rose-600')}>
      {length}/{max}
    </span>
  );
}

export function CreateTaskForm() {
  const id = useId();
  const ids: Record<CreateTaskFormField, string> = {
    title: `${id}-title`,
    description: `${id}-description`,
    priority: `${id}-priority`,
  };

  const [values, setValues] = useState<CreateTaskFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<CreateTaskFormField>>({});
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const titleRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  function updateField<K extends CreateTaskFormField>(field: K, value: CreateTaskFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(undefined);
    setSuccessMessage(undefined);
  }

  function showFieldErrors(errors: FieldErrors<CreateTaskFormField>) {
    setFieldErrors(errors);
    const firstInvalid = CREATE_TASK_FORM_FIELDS.find((field) => errors[field] !== undefined);
    if (firstInvalid) document.getElementById(ids[firstInvalid])?.focus();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    setSuccessMessage(undefined);

    const parsed = createTaskFormSchema.safeParse(values);
    if (!parsed.success) {
      const mapped = mapValidationIssues(
        toValidationIssues(parsed.error.issues),
        CREATE_TASK_FORM_FIELDS,
      );
      showFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      return;
    }

    const { title, description, priority } = parsed.data;
    createTask.mutate(
      { title, priority, ...(description && { description }) },
      {
        onSuccess: (task) => {
          setValues(INITIAL_VALUES);
          setFieldErrors({});
          setSuccessMessage(`“${task.title}” was added.`);
          titleRef.current?.focus();
        },
        onError: (error) => {
          // Map the server's Zod validation details back onto the form fields.
          if (error instanceof ApiError && error.details.length > 0) {
            const mapped = mapValidationIssues(error.details, CREATE_TASK_FORM_FIELDS);
            showFieldErrors(mapped.fieldErrors);
            setFormError(mapped.formError);
          } else {
            setFormError(getErrorMessage(error));
          }
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-label="Create task">
      <Field
        htmlFor={ids.title}
        label="Title"
        required
        error={fieldErrors.title}
        hint={<CharacterCount length={values.title.length} max={TASK_LIMITS.TITLE_MAX} />}
      >
        <Input
          ref={titleRef}
          id={ids.title}
          name="title"
          autoComplete="off"
          placeholder="e.g. Fix login redirect loop"
          value={values.title}
          invalid={fieldErrors.title !== undefined}
          aria-required="true"
          aria-describedby={fieldDescriptionId(ids.title, fieldErrors.title)}
          onChange={(event) => {
            updateField('title', event.target.value);
          }}
        />
      </Field>

      <Field
        htmlFor={ids.description}
        label="Description"
        error={fieldErrors.description}
        hint={
          <CharacterCount length={values.description.length} max={TASK_LIMITS.DESCRIPTION_MAX} />
        }
      >
        <Textarea
          id={ids.description}
          name="description"
          rows={4}
          placeholder="Steps to reproduce, context, links… (optional)"
          value={values.description}
          invalid={fieldErrors.description !== undefined}
          aria-describedby={fieldDescriptionId(ids.description, fieldErrors.description)}
          onChange={(event) => {
            updateField('description', event.target.value);
          }}
        />
      </Field>

      <Field htmlFor={ids.priority} label="Priority" error={fieldErrors.priority}>
        <Select
          id={ids.priority}
          name="priority"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          invalid={fieldErrors.priority !== undefined}
          aria-describedby={fieldErrors.priority ? `${ids.priority}-error` : undefined}
          onChange={(event) => {
            const { value } = event.target;
            if (isTaskPriority(value)) updateField('priority', value);
          }}
        />
      </Field>

      {formError && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {formError}
        </p>
      )}

      <p role="status" className="text-sm text-emerald-700 empty:hidden">
        {successMessage}
      </p>

      <Button type="submit" className="w-full" isLoading={createTask.isPending}>
        {createTask.isPending ? 'Creating…' : 'Create task'}
      </Button>
    </form>
  );
}
