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
        searchResourcesGrouped: jest.fn(),
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

    describe('GET /api/resources/search', () => {
        it('should return error when keyword is not provided', async () => {
            const response = await request(app.getHttpServer()).get('/api/resources/search').expect(HttpStatus.OK);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toBe('검색어(keyword)를 입력해주세요');
            expect(response.body.data).toBeNull();
        });

        it('should search resources across all categories with keyword', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'GT series',
                        model: 'GT200',
                        category: 'chuck',
                        pdfUrl: 'http://example.com/gt200.pdf',
                        dwgUrl: 'http://example.com/gt200.dwg',
                        imageUrl: 'http://example.com/gt200.jpg',
                        order: 1,
                    },
                    {
                        productName: 'GT series',
                        model: 'GT250',
                        category: 'chuck',
                        pdfUrl: 'http://example.com/gt250.pdf',
                        dwgUrl: 'http://example.com/gt250.dwg',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 2,
                    itemsPerPage: 50,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 검색 성공');
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.items).toHaveLength(2);
            expect(response.body.data.items[0]).toHaveProperty('category');
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'GT',
                category: undefined,
                fileType: undefined,
                page: undefined,
                limit: undefined,
            });
        });

        it('should filter search results by category', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'GT series',
                        model: 'GT200',
                        category: 'chuck',
                        pdfUrl: 'http://example.com/gt200.pdf',
                        dwgUrl: 'http://example.com/gt200.dwg',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 50,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT&category=chuck')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items).toHaveLength(1);
            expect(response.body.data.items[0].category).toBe('chuck');
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'GT',
                category: 'chuck',
                fileType: undefined,
                page: undefined,
                limit: undefined,
            });
        });

        it('should filter search results by file type (PDF)', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'B series',
                        model: 'B200',
                        category: 'vise',
                        pdfUrl: 'http://example.com/b200.pdf',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 50,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=B&fileType=pdf')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items[0]).toHaveProperty('pdfUrl');
            expect(response.body.data.items[0]).not.toHaveProperty('dwgUrl');
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'B',
                category: undefined,
                fileType: 'pdf',
                page: undefined,
                limit: undefined,
            });
        });

        it('should filter search results by file type (DWG)', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'B series',
                        model: 'B200',
                        category: 'vise',
                        dwgUrl: 'http://example.com/b200.dwg',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 50,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=B&fileType=dwg')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items[0]).toHaveProperty('dwgUrl');
            expect(response.body.data.items[0]).not.toHaveProperty('pdfUrl');
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'B',
                category: undefined,
                fileType: 'dwg',
                page: undefined,
                limit: undefined,
            });
        });

        it('should handle pagination parameters in search', async () => {
            const mockResult = {
                items: [],
                pagination: {
                    currentPage: 2,
                    totalPages: 5,
                    totalItems: 100,
                    itemsPerPage: 20,
                    hasNextPage: true,
                    hasPrevPage: true,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=chuck&page=2&limit=20')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.itemsPerPage).toBe(20);
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'chuck',
                category: undefined,
                fileType: undefined,
                page: '2',
                limit: '20',
            });
        });

        it('should handle complex search with all filters', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'GT series',
                        model: 'GT200',
                        category: 'chuck',
                        pdfUrl: 'http://example.com/gt200.pdf',
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };

            mockResourceService.searchResourcesGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/search?keyword=GT&category=chuck&fileType=pdf&page=1&limit=10')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items).toHaveLength(1);
            expect(mockResourceService.searchResourcesGrouped).toHaveBeenCalledWith({
                keyword: 'GT',
                category: 'chuck',
                fileType: 'pdf',
                page: '1',
                limit: '10',
            });
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
                        imageUrl: 'http://example.com/image.jpg',
                        order: 1,
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
            expect(response.body.data.items[0]).toHaveProperty('productName');
            expect(response.body.data.items[0]).toHaveProperty('model');
            expect(response.body.data.items[0]).toHaveProperty('pdfUrl');
            expect(response.body.data.items[0]).toHaveProperty('dwgUrl');
        });

        it('should filter resources by keyword', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'GT series',
                        model: 'GT200',
                        pdfUrl: 'http://example.com/gt200.pdf',
                        dwgUrl: 'http://example.com/gt200.dwg',
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
                .get('/api/resources/level2/chuck?keyword=GT200')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items).toHaveLength(1);
            expect(mockResourceService.findResourcesByLevel2CategoryGrouped).toHaveBeenCalledWith('chuck', {
                keyword: 'GT200',
                fileType: undefined,
                page: undefined,
                limit: undefined,
            });
        });

        it('should filter resources by file type (PDF)', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'B series',
                        model: 'B200',
                        pdfUrl: 'http://example.com/b200.pdf',
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
                .get('/api/resources/level2/chuck?fileType=pdf')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items[0]).toHaveProperty('pdfUrl');
            expect(response.body.data.items[0]).not.toHaveProperty('dwgUrl');
        });

        it('should filter resources by file type (DWG)', async () => {
            const mockResult = {
                items: [
                    {
                        productName: 'B series',
                        model: 'B200',
                        dwgUrl: 'http://example.com/b200.dwg',
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
                .get('/api/resources/level2/chuck?fileType=dwg')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.items[0]).toHaveProperty('dwgUrl');
            expect(response.body.data.items[0]).not.toHaveProperty('pdfUrl');
        });

        it('should handle pagination parameters', async () => {
            const mockResult = {
                items: [],
                pagination: {
                    currentPage: 2,
                    totalPages: 5,
                    totalItems: 100,
                    itemsPerPage: 20,
                    hasNextPage: true,
                    hasPreviousPage: true,
                },
            };

            mockResourceService.findResourcesByLevel2CategoryGrouped.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .get('/api/resources/level2/chuck?page=2&limit=20')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.itemsPerPage).toBe(20);
            expect(mockResourceService.findResourcesByLevel2CategoryGrouped).toHaveBeenCalledWith('chuck', {
                keyword: undefined,
                fileType: undefined,
                page: '2',
                limit: '20',
            });
        });
    });

    describe('POST /api/resources/:id/download', () => {
        it('should increment download count', async () => {
            mockResourceService.incrementDownloadCount.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/api/resources/68ea5e4efb9a341dff2f609d/download')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('다운로드 수 증가 성공');
            expect(response.body.data).toBeNull();
        });
    });
});
