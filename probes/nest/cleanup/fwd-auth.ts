import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UsersService } from './fwd-users.js';

// AuthService and UsersService live in two files that import each other, and each injects the other.
@Injectable()
export class AuthService {
  constructor(@Inject(forwardRef(() => UsersService)) readonly users: UsersService) {}
  name() { return 'auth'; }
}
