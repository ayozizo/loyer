import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterLawyerDto } from './dto/register-lawyer.dto';

interface AuthenticatedRequest extends Request {
  user?: any;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-lawyer')
  registerLawyer(@Body() dto: RegisterLawyerDto) {
    return this.authService.registerLawyer(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: AuthenticatedRequest) {
    return { user: req.user };
  }
}
