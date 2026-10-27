import { Injectable } from '@nestjs/common';
import { AuthService } from './raw-auth.js';

@Injectable()
export class UsersService {
  constructor(readonly auth: AuthService) {}
}
