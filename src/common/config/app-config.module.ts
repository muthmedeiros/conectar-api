
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.local'],
            validationSchema: Joi.object({
                PORT: Joi.number().default(3000),
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                NODE_VERSION: Joi.number().valid(20).default(20),
                DB_TYPE: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
                DB_NAME: Joi.string().required(),
                JWT_SECRET: Joi.string().required(),
                JWT_EXPIRES_IN: Joi.alternatives().try(Joi.string(), Joi.number()).default('1h'),
                JWT_REFRESH_SECRET: Joi.string().required(),
            }),
        }),
    ],
})
export class AppConfigModule { }
