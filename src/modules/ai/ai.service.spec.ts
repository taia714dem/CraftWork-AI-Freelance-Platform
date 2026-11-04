import { describe, it, expect } from 'vitest';
import {
  buildStacks,
  count_prices,
  getRate,
  PricesDto,
  sumPrices,
} from './ai.service.js';
import { HoursDto, PricingOptionDto } from './dto/ai-consultant.dto.js';

describe('count_prices', () => {
  it('should multiply hours by the rate for a single grade', () => {
    const hours: HoursDto = { frontend: [10, 20] };
    const grades = ['Junior'];
    const result = count_prices(hours, grades);
    expect(result).toEqual({ frontend: [6000, 12000] });
  });

  it('should return null if grades array is empty', () => {
    const result = count_prices({ frontend: [10, 20] } as HoursDto, []);
    expect(result).toBeNull();
  });
});

describe('getRate', () => {
  it('should return the hourly rate for the role and grade', () => {
    const result = getRate('Junior+', 'backend');
    expect(result).toEqual(950);
  });

  it('should throw an Error if the rate is undefined', () => {
    // Wrapping in a function to catch the throw
    expect(() => getRate('Middle', 'DevOps')).toThrow(/Нет ставки/);
  });
});

describe('sumPrices', () => {
  it('should summarize min and max prices for all roles', () => {
    const prices: PricesDto = {
      frontend: [1200, 1600],
      backend: [1600, 1800],
      design: [1000, 1200],
    };
    const result = sumPrices(prices);
    expect(result).toEqual({ min: 3800, max: 4600 });
  });

  it('should return zeros if no prices are provided', () => {
    const result = sumPrices({});
    expect(result).toEqual({ min: 0, max: 0 });
  });
});

describe('buildStacks', () => {
  it('should return stacks with minimum and maximum prices', () => {
    const mockPricingOptions: PricingOptionDto[] = [
      {
        stack: null,
        is_recommended: false,
        grade_options: [
          {
            grades: ['Junior', 'Junior+'],
            is_recommended: false,
            hours: { design: [20, 40], frontend: [30, 50], backend: [10, 20] },
          },
          {
            grades: ['Junior+', 'Middle'],
            is_recommended: false,
            hours: { design: [30, 50], frontend: [40, 70], backend: [15, 30] },
          },
          {
            grades: ['Middle', 'Middle+'],
            is_recommended: false,
            hours: { design: [40, 60], frontend: [50, 80], backend: [20, 40] },
          },
        ],
      },
    ];

    const result = buildStacks(mockPricingOptions);

    expect(result).toEqual([
      {
        stackName: null,
        isRecommended: false,
        minPrice: 48500, 
        maxPrice: 338000, 
        grades: [
          {
            gradeName: 'Junior/Junior+',
            isRecommended: false,
            minPrice: 48500,
            maxPrice: 88000,
          },
          {
            gradeName: 'Junior+/Middle',
            isRecommended: false,
            minPrice: 114000,
            maxPrice: 203000,
          },
          {
            gradeName: 'Middle/Middle+',
            isRecommended: false,
            minPrice: 204000,
            maxPrice: 338000,
          },
        ],
      },
    ]);
  });

  it('should return an empty array if PricingOptions are empty', () => {
    const result = buildStacks([]);
    expect(result).toEqual([]);
  });
});