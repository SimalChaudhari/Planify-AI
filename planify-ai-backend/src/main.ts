import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './utils/filters/all-exceptions.filter';
import { TryCatchInterceptor } from './utils/interceptors/try-catch.interceptor';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 8080;

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TryCatchInterceptor());

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    await app.listen(port);
    console.log(`Server is running on: http://localhost:${port}`);
  } catch (error) {
    process.exit(1);
  }
}
bootstrap();

