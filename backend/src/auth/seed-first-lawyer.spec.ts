import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { AuthService } from './auth.service';
import { RegisterLawyerDto } from './dto/register-lawyer.dto';

describe('Seed first lawyer (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    authService = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should ensure the first lawyer exists', async () => {
    const dto: RegisterLawyerDto = {
      email: 'admin@lawfirm.com',
      fullName: 'محامي رئيسي',
      phone: '0500000000',
      password: 'StrongPass123',
    };

    try {
      const user = await authService.registerLawyer(dto);
      expect(user.email).toBe(dto.email);
    } catch (error: any) {
      if (
        error instanceof ConflictException ||
        (error?.message && /Email is already registered/i.test(error.message))
      ) {
        // المستخدم موجود بالفعل، وهذا مقبول
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });
});
