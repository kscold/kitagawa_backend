import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface ContactEmailData {
    name: string;
    company: string;
    email: string;
    phone: string;
    message: string;
    attachmentUrl?: string;
    submittedAt: Date;
}

/**
 * Email Service
 * SMTP를 통한 이메일 전송 서비스
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: Transporter;
    private readonly isDevelopment: boolean;

    constructor(private readonly configService: ConfigService) {
        this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
        this.initializeTransporter();
    }

    /**
     * SMTP Transporter 초기화
     */
    private initializeTransporter() {
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
        const smtpFrom = this.configService.get<string>('SMTP_FROM', smtpUser);

        if (!smtpHost || !smtpUser || !smtpPassword) {
            this.logger.warn('SMTP 설정이 완료되지 않았습니다. 이메일 전송이 비활성화됩니다.');
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
        });

        if (this.isDevelopment) {
            this.logger.log(`SMTP Transporter 초기화 완료: ${smtpHost}:${smtpPort}`);
        }
    }

    /**
     * Contact 서비스 요청 이메일 전송
     */
    async sendContactRequestEmail(data: ContactEmailData): Promise<void> {
        if (!this.transporter) {
            this.logger.warn('SMTP가 설정되지 않아 이메일을 전송하지 않습니다.');
            return;
        }

        const methodName = 'sendContactRequestEmail';

        try {
            const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'kiw@kitagawa.co.kr');
            const smtpFrom = this.configService.get<string>('SMTP_FROM');

            const mailOptions = {
                from: smtpFrom,
                to: adminEmail,
                subject: `[키타가와] 새로운 서비스 문의 - ${data.company}`,
                html: this.generateContactEmailTemplate(data),
            };

            const result = await this.transporter.sendMail(mailOptions);

            if (this.isDevelopment) {
                this.logger.log(`[${methodName}] 이메일 전송 성공 - MessageID: ${result.messageId}`);
            }
        } catch (error) {
            this.logger.error(`[${methodName}] 이메일 전송 실패 - ${error.message}`, error.stack);
            // 이메일 전송 실패가 서비스 요청 접수를 막지 않도록 에러를 throw하지 않음
        }
    }

    /**
     * Contact 이메일 HTML 템플릿 생성
     */
    private generateContactEmailTemplate(data: ContactEmailData): string {
        const submittedAt = new Date(data.submittedAt).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>서비스 문의</title>
</head>
<body style="font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
        <h2 style="color: #0066cc; margin-top: 0; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            새로운 서비스 문의
        </h2>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; width: 120px; color: #495057;">
                        담당자명
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        ${data.name}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">
                        업체명
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        ${data.company}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">
                        이메일
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        <a href="mailto:${data.email}" style="color: #0066cc; text-decoration: none;">
                            ${data.email}
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">
                        전화번호
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        <a href="tel:${data.phone}" style="color: #0066cc; text-decoration: none;">
                            ${data.phone}
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">
                        접수 시간
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        ${submittedAt}
                    </td>
                </tr>
                ${
                    data.attachmentUrl
                        ? `
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">
                        첨부파일
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        <a href="${data.attachmentUrl}" style="color: #0066cc; text-decoration: none;">
                            첨부파일 다운로드
                        </a>
                    </td>
                </tr>
                `
                        : ''
                }
            </table>

            <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #0066cc;">
                <h3 style="margin-top: 0; color: #495057; font-size: 16px;">문의사항</h3>
                <p style="margin: 0; white-space: pre-wrap; color: #212529;">
${data.message}
                </p>
            </div>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 8px; font-size: 14px; color: #495057;">
            <p style="margin: 0;">
                <strong>이 이메일은 키타가와 코리아 웹사이트의 Contact Us 페이지에서 자동으로 발송되었습니다.</strong>
            </p>
            <p style="margin: 10px 0 0 0;">
                문의하신 고객님께 빠른 시일 내에 회신해 주시기 바랍니다.
            </p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * 이메일 연결 테스트
     */
    async verifyConnection(): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn('SMTP Transporter가 초기화되지 않았습니다.');
            return false;
        }

        try {
            await this.transporter.verify();
            this.logger.log('SMTP 연결 확인 성공');
            return true;
        } catch (error) {
            this.logger.error(`SMTP 연결 확인 실패 - ${error.message}`, error.stack);
            return false;
        }
    }
}
