import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';
import { expectStandardResponse, expectPaginatedResponse } from '../../../../test/helpers/test-helpers';

describe('ProductController (e2e)', () => {
    let app: INestApplication;

    const mockProductService = {
        searchProducts: jest.fn(),
        searchProductsSimplified: jest.fn(),
        getFeaturedProducts: jest.fn(),
        getPopularProducts: jest.fn(),
        getRecentProducts: jest.fn(),
        findBySlug: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ProductController],
            providers: [
                {
                    provide: ProductService,
                    useValue: mockProductService,
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

    describe('GET /api/products/search', () => {
        it('should return paginated products with simplified structure', async () => {
            mockProductService.searchProductsSimplified.mockResolvedValue({
                items: [
                    {
                        name: 'Test Product 1',
                        slug: 'test-product-1',
                        imageUrl: 'https://example.com/image1.jpg',
                    },
                    {
                        name: 'Test Product 2',
                        slug: 'test-product-2',
                        imageUrl: 'https://example.com/image2.jpg',
                    },
                ],
                total: 2,
            });

            const response = await request(app.getHttpServer())
                .get('/api/products/search?keyword=test')
                .expect(HttpStatus.OK);

            // 표준 응답 구조 검증
            expectStandardResponse(response);

            // 페이지네이션 응답 검증
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');

            // 간소화된 제품 구조 검증
            expect(Array.isArray(response.body.data.items)).toBe(true);
            response.body.data.items.forEach((item: any) => {
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('slug');
                expect(item).toHaveProperty('imageUrl');
                // 다른 필드들은 없어야 함 (간소화됨)
                expect(Object.keys(item)).toEqual(['name', 'slug', 'imageUrl']);
            });

            // 페이지네이션 구조 검증
            expect(response.body.data.pagination).toHaveProperty('currentPage');
            expect(response.body.data.pagination).toHaveProperty('itemsPerPage');
            expect(response.body.data.pagination).toHaveProperty('totalItems');
            expect(response.body.data.pagination).toHaveProperty('totalPages');
            expect(response.body.data.pagination).toHaveProperty('hasNextPage');
            expect(response.body.data.pagination).toHaveProperty('hasPreviousPage');
        });

        it('should use default pagination (10 items per page)', async () => {
            mockProductService.searchProductsSimplified.mockResolvedValue({
                items: [],
                total: 0,
            });

            const response = await request(app.getHttpServer())
                .get('/api/products/search?keyword=test')
                .expect(HttpStatus.OK);

            expect(response.body.data.pagination.itemsPerPage).toBe(10);
        });
    });

    describe('GET /api/products/featured', () => {
        it('should return featured products', async () => {
            const mockProducts = [
                {
                    _id: '1',
                    slug: 'product-1',
                    productTitle: 'Featured Product 1',
                    mainImageUrl: 'https://example.com/featured1.jpg',
                    isFeatured: true,
                },
            ];

            mockProductService.getFeaturedProducts.mockResolvedValue(mockProducts);

            const response = await request(app.getHttpServer())
                .get('/api/products/featured')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/products/popular', () => {
        it('should return popular products', async () => {
            const mockProducts = [
                {
                    _id: '1',
                    slug: 'popular-1',
                    productTitle: 'Popular Product 1',
                    viewCount: 1000,
                },
            ];

            mockProductService.getPopularProducts.mockResolvedValue(mockProducts);

            const response = await request(app.getHttpServer())
                .get('/api/products/popular')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/products/recent', () => {
        it('should return recent products', async () => {
            const mockProducts = [
                {
                    _id: '1',
                    slug: 'recent-1',
                    productTitle: 'Recent Product 1',
                    createdAt: new Date(),
                },
            ];

            mockProductService.getRecentProducts.mockResolvedValue(mockProducts);

            const response = await request(app.getHttpServer())
                .get('/api/products/recent')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/products/:slug', () => {
        it('should return product detail with complete structure', async () => {
            const mockProduct = {
                _id: 'product-id',
                slug: 'test-product',
                productName: 'Test Product',
                productTitle: 'Test Product Title',
                category: {
                    mainCategory: 'Category 1',
                    subCategory: 'SubCategory 1',
                    series: 'Series 1',
                },
                mainImageUrl: 'https://example.com/main.jpg',
                description: 'Test description',
                downloads: [],
                specificationFiles: [],
                isActive: true,
                isFeatured: false,
                viewCount: 0,
                createdAt: new Date(),
            };

            mockProductService.findBySlug.mockResolvedValue(mockProduct);

            const response = await request(app.getHttpServer())
                .get('/api/products/test-product')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);

            // 제품 상세 구조 검증
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data).toHaveProperty('slug');
            expect(response.body.data).toHaveProperty('productName');
            expect(response.body.data).toHaveProperty('category');
            expect(response.body.data.category).toHaveProperty('mainCategory');
            expect(response.body.data.category).toHaveProperty('subCategory');
            expect(response.body.data.category).toHaveProperty('series');
        });
    });
});
