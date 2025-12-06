import { TransformFnParams } from 'class-transformer';

export const ToBoolean = ({
  value,
}: TransformFnParams): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};
