import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

/**
 * Upload Service
 * GCP Cloud Storage에 파일 업로드
 */
@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private storage: Storage;
    private bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || 'kitagawa-cdn';

        // GCP Storage 클라이언트 초기화
        const storageConfig: any = {
            projectId: this.configService.get<string>('GCP_PROJECT_ID'),
        };

        // 로컬 개발: 서비스 계정 키 파일 경로 (선택사항)
        // - 키 파일이 있으면 사용
        // - 없으면 gcloud auth application-default login으로 인증
        // 프로덕션 (Cloud Run): 자동으로 인증됨 (ADC)
        const keyFilename = this.configService.get<string>('GCS_KEY_FILE');
        if (keyFilename) {
            storageConfig.keyFilename = keyFilename;
        }

        this.storage = new Storage(storageConfig);
    }

    /**
     * 파일을 GCS에 업로드
     * @param file - 업로드할 파일 (multer)
     * @param folder - 폴더 경로 (banner, product, resource 등)
     * @returns 업로드된 파일의 공개 URL
     */
    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        const methodName = 'uploadFile';

        try {
            // 파일명 생성 (timestamp + 원본파일명)
            const timestamp = Date.now();
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 한글 파일명 지원
            const fileExtension = path.extname(originalName);
            const fileNameWithoutExt = path.basename(originalName, fileExtension);
            const fileName = `${timestamp}-${fileNameWithoutExt}${fileExtension}`;

            // GCS 경로: folder/filename
            const gcsPath = `${folder}/${fileName}`;

            this.logger.log(`[${methodName}] 업로드 시작 - path: ${gcsPath}, size: ${file.size} bytes`);

            // 버킷 참조
            const bucket = this.storage.bucket(this.bucketName);
            const blob = bucket.file(gcsPath);

            // 파일 업로드
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: file.mimetype,
                    cacheControl: 'public, max-age=31536000', // 1년 브라우저 캐싱
                },
            });

            return new Promise((resolve, reject) => {
                blobStream.on('error', (error) => {
                    this.logger.error(`[${methodName}] 업로드 실패 - ${error.message}`, error.stack);
                    reject(new InternalServerErrorException('파일 업로드 중 오류가 발생했습니다'));
                });

                blobStream.on('finish', async () => {
                    // 파일을 공개 접근 가능하도록 설정 (이미 버킷 레벨에서 설정되어 있지만 확실하게)
                    await blob.makePublic().catch((err) => {
                        this.logger.warn(`[${methodName}] makePublic 실패 (버킷이 이미 공개일 수 있음) - ${err.message}`);
                    });

                    // 공개 URL 생성
                    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;

                    this.logger.log(`[${methodName}] 업로드 성공 - url: ${publicUrl}`);
                    resolve(publicUrl);
                });

                blobStream.end(file.buffer);
            });
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('파일 업로드 중 오류가 발생했습니다');
        }
    }

    /**
     * 파일 삭제
     * @param fileUrl - 삭제할 파일의 공개 URL
     */
    async deleteFile(fileUrl: string): Promise<void> {
        const methodName = 'deleteFile';

        try {
            // URL에서 파일 경로 추출
            const urlPattern = new RegExp(`https://storage\\.googleapis\\.com/${this.bucketName}/(.+)`);
            const match = fileUrl.match(urlPattern);

            if (!match || !match[1]) {
                throw new Error('유효하지 않은 파일 URL입니다');
            }

            const filePath = match[1];

            this.logger.log(`[${methodName}] 삭제 시작 - path: ${filePath}`);

            // 파일 삭제
            const bucket = this.storage.bucket(this.bucketName);
            await bucket.file(filePath).delete();

            this.logger.log(`[${methodName}] 삭제 성공 - path: ${filePath}`);
        } catch (error) {
            this.logger.error(`[${methodName}] 실패 - ${error.message}`, error.stack);
            throw new InternalServerErrorException('파일 삭제 중 오류가 발생했습니다');
        }
    }

    /**
     * 지원되는 폴더 목록 검증
     */
    validateFolder(folder: string): boolean {
        const allowedFolders = ['banner', 'product', 'resource', 'company', 'category', 'contact'];
        return allowedFolders.includes(folder.toLowerCase());
    }
}
