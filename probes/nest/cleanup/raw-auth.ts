import { Injectable } from '@nestjs/common';
import { UsersService } from './raw-users.js';

// The same pair without forwardRef.
@Injectable()
export class AuthService {
  constructor(readonly users: UsersService) {}
}
