import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonSize, type ButtonVariant } from './button-styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = ({
  variant,
  size,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button type={type} className={`${buttonClass({ variant, size })} ${className}`.trim()} {...rest} />
);
