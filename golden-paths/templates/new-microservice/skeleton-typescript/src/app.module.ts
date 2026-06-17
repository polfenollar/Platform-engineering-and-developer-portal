import { Module, Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  getHealth() {
    return { status: 'healthy' };
  }

  @Get()
  getHello() {
    return { message: 'Hello from TypeScript NestJS microservice!' };
  }
}

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
