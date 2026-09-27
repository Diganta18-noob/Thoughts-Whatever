/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorialImage } from '../editorial-image';

jest.mock('next/image', () => ({__esModule:true,default:({priority,unoptimized,...props}: React.ImgHTMLAttributes<HTMLImageElement> & {priority?:boolean;unoptimized?:boolean}) => {
  void priority; void unoptimized;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt} />;
}}));
jest.mock('framer-motion',()=>({
  useReducedMotion:()=>false,
  motion:{div:({children}: {children:React.ReactNode})=><div>{children}</div>},
}));

it('handles a failed image without changing React hook order',()=>{
  const error=jest.spyOn(console,'error').mockImplementation(()=>{});
  try {
    const {container}=render(<EditorialImage src="/missing.jpg" alt="Cover" width={1200} height={675} priority />);
    expect(()=>fireEvent.error(screen.getByAltText('Cover'))).not.toThrow();
    expect(container).toBeEmptyDOMElement();
  } finally {error.mockRestore();}
});
