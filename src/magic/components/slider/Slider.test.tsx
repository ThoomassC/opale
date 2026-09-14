import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Slider from './Slider';

describe('Slider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the handle continuous while step rounds the emitted value', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Slider min={0} max={100} step={25} value={50} onChange={onChange} />,
    );
    const track = container.querySelector('[class*="sliderTrack"]') as HTMLDivElement;
    const thumb = container.querySelector('[class*="thumb"]') as HTMLDivElement;

    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      bottom: 6,
      height: 6,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    thumb.setPointerCapture = vi.fn();
    thumb.hasPointerCapture = vi.fn(() => true);
    thumb.releasePointerCapture = vi.fn();

    fireEvent.pointerMove(track, { clientX: 10, pointerId: 1 });
    expect(thumb.style.left).toBe('50%');

    fireEvent.pointerDown(thumb, { clientX: 32, pointerId: 1 });
    expect(thumb.style.left).toBe('32%');
    expect(onChange).toHaveBeenLastCalledWith(25);

    fireEvent.pointerMove(thumb, { clientX: 47, pointerId: 1 });
    expect(thumb.style.left).toBe('47%');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
