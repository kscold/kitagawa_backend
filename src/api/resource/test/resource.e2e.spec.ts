import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { execSync } from 'child_process';

import { ResourceController } from '../resource.controller';
import { ResourceService } from '../resource.service';
import { ResourceRepository } from '../repository/resource.repository';
import { Resource, ResourceSchema } from '../../../schemas/resource.schema';
import { CategoryModel, CategorySchema } from '../../../schemas/category.schema';
import { CategoryRepository } from '../../category/repository/category.repository';

import { getTestMongoUri, clearCollection, seedCollection } from '../../../../test/e2e-helpers';
import { createMockResourcePair, createMockPdfResource } from '../../../../test/factories/resource.factory';
import { createDefaultResourceCategories } from '../../../../test/factories/category.factory';

/**
 * Resource API E2E 테스트 (실제 DB 사용)
 *
 * 베스트 프랙티스 적용:
 * - ConfigModule 추가로 완전한 E2E 환경 구성
 * - DataFactory 패턴으로 테스트 데이터 관리
 * - beforeEach에서 격리된 테스트 환경 보장
 *
 * 주의사항:
 * - 실제 테스트 데이터베이스에 연결합니다 (kitagawa_test)
 * - 프로덕션 DB가 아닌 테스트 DB를 사용하는지 확인하세요!
 */
describe('ResourceController E2E (Real DB)', () => {
    let app: INestApplication;
    let resourceRepository: ResourceRepository;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                // ConfigModule 추가 - 실제 환경과 동일한 설정
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
                MongooseModule.forRoot(getTestMongoUri()),
                MongooseModule.forFeature([
                    { name: Resource.name, schema: ResourceSchema },
                    { name: CategoryModel.name, schema: CategorySchema },
                ]),
            ],
            controllers: [ResourceController],
            providers: [ResourceService, ResourceRepository, CategoryRepository],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        resourceRepository = moduleFixture.get<ResourceRepository>(ResourceRepository);
    });

    afterAll(async () => {
        // 테스트 후 데이터 정리
        await clearCollection(app, 'resources');
        await clearCollection(app, 'categories');

        await app.close();

        // 기본 데이터 복원 (프로덕션 Product → 테스트 Resource)
        console.log('\n📦 테스트 DB 기본 데이터 복원 중...');
        execSync('npx ts-node scripts/seed-test-categories-resources.ts', { stdio: 'inherit' });
        console.log('✅ 기본 데이터 복원 완료\n');
    });

    beforeEach(async () => {
        // 각 테스트 전에 데이터 정리하고 새로 시드
        await clearCollection(app, 'resources');
        await clearCollection(app, 'categories');

        // DataFactory를 사용한 테스트 데이터 생성
        const categories = createDefaultResourceCategories();
        await seedCollection(app, 'categories', categories);

        // GT200 제품 (PDF + DWG 쌍)
        const gt200Pair = createMockResourcePair('GT200', 'GT series');
        const gt200Pdf: any = {
            ...gt200Pair.pdf,
            categories: ['nc-rotary-table'],
            tags: ['GT', 'rotary'],
            order: 1,
        };
        const gt200Dwg: any = {
            ...gt200Pair.dwg,
            categories: ['nc-rotary-table'],
            tags: ['GT', 'rotary', 'dwg'],
            order: 1,
        };

        // BR08 제품
        const br08: any = createMockPdfResource({
            title: 'BR08 Catalog',
            titleKo: 'BR08 카탈로그',
            productName: 'BR series',
            model: 'BR08',
            fileUrl: 'http://example.com/br08.pdf',
            fileName: 'br08.pdf',
            thumbnailUrl: 'http://example.com/br08.jpg',
            categories: ['chuck'],
            tags: ['BR', 'chuck'],
            order: 2,
        });

        await seedCollection(app, 'resources', [gt200Pdf, gt200Dwg, br08]);
    });

    describe('GET /api/resources/search', () => {
        it('should search resources with keyword "GT"', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1); // GT200 그룹화됨
            expect(response.body.data.items[0].productName).toBe('GT series');
            expect(response.body.data.items[0].model).toBe('GT200');
            expect(response.body.data.items[0]).toHaveProperty('pdfUrl');
            expect(response.body.data.items[0]).toHaveProperty('dwgUrl');
        });

        it('should filter by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT&category=nc-rotary-table')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1);
            expect(response.body.data.items[0].category).toBe('nc-rotary-table');
        });

        it('should filter by file type (PDF)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT&fileType=pdf')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items[0]).toHaveProperty('pdfUrl');
            expect(response.body.data.items[0]).not.toHaveProperty('dwgUrl');
        });

        it('should return error when keyword is missing', async () => {
            const response = await request(app.getHttpServer()).get('/api/resources/search').expect(HttpStatus.OK);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toBe('검색어(keyword)를 입력해주세요');
        });
    });

    describe('GET /api/resources/level2/:slug', () => {
        it('should return resources for nc-rotary-table category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/level2/nc-rotary-table')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1); // GT200 그룹화
            expect(response.body.data.items[0].productName).toBe('GT series');
        });

        it('should return resources for chuck category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/level2/chuck')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1); // BR08
            expect(response.body.data.items[0].productName).toBe('BR series');
        });

        it('should filter by keyword within category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/resources/level2/nc-rotary-table?keyword=GT')
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1);
            expect(response.body.data.items[0].model).toBe('GT200');
        });
    });

    describe('GET /api/resources/level1', () => {
        it('should return all level1 categories with resource count', async () => {
            const response = await request(app.getHttpServer()).get('/api/resources/level1').expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0]).toHaveProperty('name');
            expect(response.body.data[0]).toHaveProperty('slug');
            expect(response.body.data[0]).toHaveProperty('count');
        });
    });

    describe('POST /api/resources/:id/download', () => {
        it('should increment download count', async () => {
            // 먼저 리소스 조회하여 ID 가져오기
            const result = await resourceRepository.findAllWithPagination({
                keyword: 'GT200',
                limit: 1,
                skip: 0,
            });

            const resourceId = result.resources[0]._id.toString();

            const response = await request(app.getHttpServer())
                .post(`/api/resources/${resourceId}/download`)
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('다운로드 수 증가 성공');

            // 실제로 downloadCount가 증가했는지 확인
            const updatedResult = await resourceRepository.findAllWithPagination({
                keyword: 'GT200',
                limit: 1,
                skip: 0,
            });

            expect(updatedResult.resources[0].downloadCount).toBe(1);
        });
    });
});
