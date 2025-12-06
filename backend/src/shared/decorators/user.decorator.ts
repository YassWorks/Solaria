import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @CurrentUser() decorator is used in the controller to get the user object from the request object.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
