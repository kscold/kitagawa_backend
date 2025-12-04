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
            // 요청 유형에 따른 색상
            const typeConfig = {
                NEW_PRODUCT: { label: '새 제품 추가', color: 0x5865f2 },
                GENERAL_REQUEST: { label: '일반 요청', color: 0xfee75c },
                MIXED: { label: '제품 + 요청', color: 0x57f287 },
            };

            const config = typeConfig[data.type as keyof typeof typeConfig] || typeConfig.GENERAL_REQUEST;

            // 설명 구성
            const descriptionLines: string[] = [];
            descriptionLines.push(`**${config.label}** 요청이 접수되었습니다.`);
            if (data.autoImport) {
                descriptionLines.push(`\n자동 Import가 활성화되어 크롤링이 진행됩니다.`);
            }

            const embed: any = {
                title: '새로운 요청 접수',
                description: descriptionLines.join(''),
                color: config.color,
                fields: [],
                footer: {
                    text: data.requestId,
                },
                timestamp: new Date().toISOString(),
            };

            // 제품 정보 (있는 경우)
            if (data.productName) {
                embed.fields.push({
                    name: '제품명',
                    value: data.productName,
                    inline: true,
                });
            }

            if (data.seriesName) {
                embed.fields.push({
                    name: '시리즈',
                    value: data.seriesName,
                    inline: true,
                });
            }

            // URL (있는 경우)
            if (data.url) {
                embed.fields.push({
                    name: 'URL',
                    value: data.url,
                    inline: false,
                });
            }

            // 요청사항 (있는 경우)
            if (data.requestDetails) {
                const truncated =
                    data.requestDetails.length > 300
                        ? data.requestDetails.substring(0, 300) + '...'
                        : data.requestDetails;
                embed.fields.push({
                    name: '요청 사항',
                    value: truncated,
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
                    avatar_url: 'https://storage.googleapis.com/kitagawa-cdn/logo/kitagawa-logo.png',
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
            const embed: any = data.success
                ? {
                      title: '크롤링 완료',
                      description: `${data.resourceCount || 0}개 리소스가 등록되었습니다.`,
                      color: 0x57f287,
                      footer: {
                          text: data.requestId,
                      },
                      timestamp: new Date().toISOString(),
                  }
                : {
                      title: '크롤링 실패',
                      description: (data.errorMessage || '알 수 없는 오류').substring(0, 400),
                      color: 0xed4245,
                      footer: {
                          text: data.requestId,
                      },
                      timestamp: new Date().toISOString(),
                  };

            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'Kitagawa Admin Bot',
                    avatar_url: 'https://storage.googleapis.com/kitagawa-cdn/logo/kitagawa-logo.png',
                    embeds: [embed],
                }),
            });

            this.logger.log(`Import ${data.success ? '완료' : '실패'} 알림 전송 성공: ${data.requestId}`);
        } catch (error) {
            this.logger.error(`Discord 알림 전송 실패: ${error.message}`, error.stack);
        }
    }
}
