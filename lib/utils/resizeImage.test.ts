import { describe, it, expect } from 'vitest';
import { scaleDown } from './resizeImage';

describe('scaleDown', () => {
  it('returns input unchanged when both dimensions are within max', () => {
    expect(scaleDown(400, 300, 800)).toEqual({ width: 400, height: 300 });
  });

  it('scales landscape images by the longer side', () => {
    expect(scaleDown(1600, 900, 800)).toEqual({ width: 800, height: 450 });
  });

  it('scales portrait images by the longer side', () => {
    expect(scaleDown(900, 1600, 800)).toEqual({ width: 450, height: 800 });
  });

  it('handles square images at the boundary', () => {
    expect(scaleDown(800, 800, 800)).toEqual({ width: 800, height: 800 });
  });

  it('rounds fractional results', () => {
    expect(scaleDown(1000, 333, 800)).toEqual({ width: 800, height: 266 });
  });
});
