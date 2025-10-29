import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EmailService } from '../service/email.service';

/**
 * Email Module
 * 이메일 전송 기능을 제공하는 모듈
 */
@Module({
    imports: [ConfigModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
