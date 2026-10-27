import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AuthService } from './fwd-auth.js';

@Injectable()
export class UsersService {
  constructor(@Inject(forwardRef(() => AuthService)) readonly auth: AuthService) {}
  name() { return 'users'; }
}
