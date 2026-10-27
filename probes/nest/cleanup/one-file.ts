import { Inject, Injectable, forwardRef } from '@nestjs/common';

// Two services in one file that inject each other. Only the first one needs a lazy reference to
// get past the file, but Nest still needs forwardRef on both to build the pair.
@Injectable()
export class AuthService {
  constructor(@Inject(forwardRef(() => UsersService)) readonly users: any) {}
}
@Injectable()
export class UsersService {
  constructor(@Inject(forwardRef(() => AuthService)) readonly auth: any) {}
}
@Injectable()
export class AuthOnly {
  constructor(@Inject(forwardRef(() => UsersOnly)) readonly users: any) {}
}
@Injectable()
export class UsersOnly {
  constructor(readonly auth: AuthOnly) {}
}
