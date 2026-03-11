import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

import { UploadController } from '../upload.controller';

import { UploadService } from '../upload.service';

describe('UploadController (e2e)', () => {
    let app: INestApplication;

    const mockUploadService = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
        validateFolder: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [UploadController],
            providers: [
                {
                    provide: UploadService,
                    useValue: mockUploadService,
                },
            ],
        })
            .overrideGuard(AdminJwtAuthGuard)
            .useClass(MockAdminJwtAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/upload-admin', () => {
        it('should return upload result with standard structure', async () => {
            const mockUrl = 'https://storage.googleapis.com/kitagawa-cdn/product/1234567890-test.jpg';

            mockUploadService.validateFolder.mockReturnValue(true);
            mockUploadService.uploadFile.mockResolvedValue(mockUrl);

            const response = await request(app.getHttpServer())
                .post('/api/upload-admin?folder=product')
                .set('Authorization', 'Bearer mock-token')
                .attach('file', Buffer.from('test file content'), 'test.jpg')
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);

            // 업로드 응답 구조 검증
            expect(response.body.data).toHaveProperty('url');
            expect(response.body.data).toHaveProperty('path');
            expect(response.body.data).toHaveProperty('folder');
            expect(response.body.data).toHaveProperty('fileName');

            // URL 형식 검증
            expect(response.body.data.url).toContain('storage.googleapis.com');
            expect(response.body.data.folder).toBe('product');
        });

        it('should validate folder parameter', async () => {
            mockUploadService.validateFolder.mockReturnValue(false);

            await request(app.getHttpServer())
                .post('/api/upload-admin?folder=invalid')
                .set('Authorization', 'Bearer mock-token')
                .attach('file', Buffer.from('test'), 'test.jpg')
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('should require file', async () => {
            await request(app.getHttpServer())
                .post('/api/upload-admin?folder=product')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.BAD_REQUEST);
        });
    });

    describe('DELETE /api/upload-admin', () => {
        it('should delete file and return success', async () => {
            mockUploadService.deleteFile.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/upload-admin')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    url: 'https://storage.googleapis.com/kitagawa-cdn/product/test.jpg',
                })
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('파일 삭제 성공');
            expect(response.body.data).toBeNull();
        });

        it('should require URL', async () => {
            await request(app.getHttpServer())
                .delete('/api/upload-admin')
                .set('Authorization', 'Bearer mock-token')
                .send({})
                .expect(HttpStatus.BAD_REQUEST);
        });
    });
});
