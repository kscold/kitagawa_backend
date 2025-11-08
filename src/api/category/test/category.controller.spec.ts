import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

describe('CategoryController (e2e)', () => {
    let app: INestApplication;

    const mockCategoryService = {
        getLevel1Categories: jest.fn(),
        getCategoriesBySlug: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [CategoryController],
            providers: [
                {
                    provide: CategoryService,
                    useValue: mockCategoryService,
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

    describe('GET /api/categories/level1', () => {
        it('should return level 1 categories with product count', async () => {
            const mockCategories = [
                {
                    name: 'Chuck',
                    slug: 'chuck',
                    productCount: 50,
                    imageUrl: 'https://example.com/chuck.jpg',
                },
                {
                    name: 'NC Rotary Table',
                    slug: 'nc-rotary-table',
                    productCount: 30,
                    imageUrl: 'https://example.com/rotary.jpg',
                },
            ];

            mockCategoryService.getLevel1Categories.mockResolvedValue(mockCategories);

            const response = await request(app.getHttpServer())
                .get('/api/categories/level1')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);

            // 카테고리 배열 검증
            expect(Array.isArray(response.body.data)).toBe(true);

            // 각 카테고리 구조 검증
            response.body.data.forEach((category: any) => {
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('slug');
                expect(category).toHaveProperty('productCount');
                expect(typeof category.productCount).toBe('number');
            });
        });
    });

    describe('GET /api/categories/level2/:slug', () => {
        it('should return level 2 categories with children', async () => {
            const mockLevel2Data = {
                name: 'Chuck',
                slug: 'chuck',
                children: [
                    {
                        name: 'Power Chuck',
                        slug: 'power-chuck',
                        productCount: 25,
                        imageUrl: 'https://example.com/power-chuck.jpg',
                    },
                    {
                        name: 'Hydraulic Chuck',
                        slug: 'hydraulic-chuck',
                        productCount: 15,
                        imageUrl: 'https://example.com/hydraulic-chuck.jpg',
                    },
                ],
            };

            mockCategoryService.getCategoriesBySlug.mockResolvedValue(mockLevel2Data);

            const response = await request(app.getHttpServer())
                .get('/api/categories/level2/chuck')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);

            // Level 2 구조 검증
            expect(response.body.data).toHaveProperty('name');
            expect(response.body.data).toHaveProperty('slug');
            expect(response.body.data).toHaveProperty('children');
            expect(Array.isArray(response.body.data.children)).toBe(true);

            // Children 구조 검증
            response.body.data.children.forEach((child: any) => {
                expect(child).toHaveProperty('name');
                expect(child).toHaveProperty('slug');
                expect(child).toHaveProperty('productCount');
            });
        });
    });
});
