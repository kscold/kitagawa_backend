import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Discord 웹훅 서비스
 * Admin Contact Request 알림을 Discord로 전송
 */
@Injectable()
export class DiscordWebhookService {
    private readonly logger = new Logger(DiscordWebhookService.name);
    private readonly webhookUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL') || '';
    }

    /**
     * Admin Contact Request 생성 알림
     */
    async sendAdminContactRequestNotification(data: {
        requestId: string;
        type: string;
        productName?: string;
        seriesName?: string;
        url?: string;
        requestDetails?: string;
        requestedBy: string;
        autoImport: boolean;
    }): Promise<void> {
        if (!this.webhookUrl) {
            this.logger.warn('Discord webhook URL이 설정되지 않았습니다. 알림을 건너뜁니다.');
            return;
        }

        try {
            const embed = {
                title: '🔔 새로운 Admin Contact Request',
                color: data.autoImport ? 0x00ff00 : 0x0099ff, // 자동 import는 초록색, 일반은 파란색
                fields: [
                    {
                        name: '📋 요청 ID',
                        value: data.requestId,
                        inline: true,
                    },
                    {
                        name: '📊 요청 유형',
                        value: data.type,
                        inline: true,
                    },
                    {
                        name: '👤 요청자',
                        value: data.requestedBy,
                        inline: true,
                    },
                ],
                timestamp: new Date().toISOString(),
            };

            // 제품 정보 추가
            if (data.productName) {
                embed.fields.push({
                    name: '📦 제품명',
                    value: data.productName,
                    inline: true,
                });
            }

            if (data.seriesName) {
                embed.fields.push({
                    name: '🏷️ 시리즈명',
                    value: data.seriesName,
                    inline: true,
                });
            }

            if (data.url) {
                embed.fields.push({
                    name: '🔗 URL',
                    value: data.url,
                    inline: false,
                });
            }

            // 요청사항 추가 (길이 제한)
            if (data.requestDetails) {
                const truncated =
                    data.requestDetails.length > 200
                        ? data.requestDetails.substring(0, 200) + '...'
                        : data.requestDetails;
                embed.fields.push({
                    name: '📝 요청 사항',
                    value: truncated,
                    inline: false,
                });
            }

            // 자동 import 표시
            if (data.autoImport) {
                embed.fields.push({
                    name: '🤖 자동 Import',
                    value: '✅ 활성화 (자동 크롤링 진행 중)',
                    inline: false,
                });
            }

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'Kitagawa Admin Bot',
                    embeds: [embed],
                }),
            });

            if (!response.ok) {
                throw new Error(`Discord webhook failed: ${response.statusText}`);
            }

            this.logger.log(`Discord 알림 전송 성공: ${data.requestId}`);
        } catch (error) {
            this.logger.error(`Discord 알림 전송 실패: ${error.message}`, error.stack);
            // 알림 실패는 전체 프로세스를 중단하지 않음
        }
    }

    /**
     * Import 완료 알림
     */
    async sendImportCompletedNotification(data: {
        requestId: string;
        success: boolean;
        resourceCount?: number;
        errorMessage?: string;
    }): Promise<void> {
        if (!this.webhookUrl) {
            return;
        }

        try {
            const embed = {
                title: data.success ? '✅ Import 완료' : '❌ Import 실패',
                color: data.success ? 0x00ff00 : 0xff0000,
                fields: [
                    {
                        name: '📋 요청 ID',
                        value: data.requestId,
                        inline: true,
                    },
                ],
                timestamp: new Date().toISOString(),
            };

            if (data.success && data.resourceCount !== undefined) {
                embed.fields.push({
                    name: '📊 등록된 리소스',
                    value: `${data.resourceCount}개`,
                    inline: true,
                });
            }

            if (!data.success && data.errorMessage) {
                embed.fields.push({
                    name: '⚠️ 에러 메시지',
                    value: data.errorMessage.substring(0, 500),
                    inline: false,
                });
            }

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'Kitagawa Admin Bot',
                    embeds: [embed],
                }),
            });

            this.logger.log(`Import ${data.success ? '완료' : '실패'} 알림 전송 성공: ${data.requestId}`);
        } catch (error) {
            this.logger.error(`Discord 알림 전송 실패: ${error.message}`, error.stack);
        }
    }
}
