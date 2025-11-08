import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ResourceController } from '../resource.controller';
import { ResourceService } from '../resource.service';
import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

describe('ResourceController (e2e)', () => {
    let app: INestApplication;

    const mockResourceService = {
        getLevel1CategoriesWithResourceCount: jest.fn(),
        findResourcesByLevel2CategoryGrouped: jest.fn(),
        incrementDownloadCount: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ResourceController],
            providers: [
                {
                    provide: ResourceService,
                    useValue: mockResourceService,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/resources/level1', () => {
        it('should return level1 categories with resource count', async () => {
            const mockCategories = [
                {
                    _id: '1',
                    name: 'NC ROTARY TABLE',
                    slug: 'nc-rotary-table',
                    imageUrl: 'https://example.com/image.jpg',
                    content: 'Compact & high accuracy',
                    order: 0,
                    count: 111,
                },
                {
                    _id: '2',
                    name: 'CHUCK',
                    slug: 'chuck',
                    imageUrl: 'https://example.com/chuck.jpg',
                    content: 'Wide variety',
                    order: 2,
                    count: 243,
                },
            ];

            mockResourceService.getLevel1CategoriesWithResourceCount.mockResolvedValue(mockCategories);

            const response = await request(app.getHttpServer()).get('/api/resources/level1').expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료실 카테고리 목록 조회 성공');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0]).toHaveProperty('name');
            expect(response.body.data[0]).toHaveProperty('slug');
            expect(response.body.data[0]).toHaveProperty('count');
        });
    });

    describe('GET /api/resources/level2/:slug', () => {
        it('should return resources by level2 category with pagination', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'GT series',
                        model: 'GT200',
                        pdfUrl: 'http://example.com/file.pdf',
                        dwgUrl: 'http://example.com/file.dwg',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 50,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };

            mockResourceService.findResourcesByLevel2CategoryGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/level2/nc-rotary-table')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리별 자료 조회 성공');
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.items)).toBe(true);
        });
    });

    describe('POST /api/resources/:id/download', () => {
        it('should increment download count', async () => {
            mockResourceService.incrementDownloadCount.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/api/resources/68ea5e4efb9a341dff2f609d/download')
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.OK);
            expect(response.body.message).toBe('다운로드 수 증가 성공');
        });
    });
});
