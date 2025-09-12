import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Conéctar API')
        .setDescription('Backend técnico - NestJS')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const doc = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, doc);
}
