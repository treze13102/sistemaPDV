import * as React from 'react';
import { Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Input com suporte a leitor de código de barras USB.
 *
 * Detecção: scanners USB emitem chars muito rápido (<30ms entre teclas) e geralmente
 * terminam com Enter. Quando detectado, dispara onScan com o valor lido e limpa
 * (ou mantém) o campo conforme `clearOnScan`.
 *
 * Também aceita digitação manual + Enter como fallback.
 */
export interface BarcodeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (v: string) => void;
  onScan?: (code: string) => void;
  clearOnScan?: boolean;
  showIcon?: boolean;
  containerClassName?: string;
}

const FAST_MS = 30;

export const BarcodeInput = React.forwardRef<HTMLInputElement, BarcodeInputProps>(
  ({ value, onChange, onScan, clearOnScan = false, showIcon = true, containerClassName, className, ...rest }, ref) => {
    const lastKeyTs = React.useRef<number>(0);
    const fastChain = React.useRef<number>(0);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      const now = performance.now();
      if (e.key === 'Enter') {
        const v = (e.currentTarget.value ?? '').trim();
        const wasScan = fastChain.current >= 4; // 4+ chars rapid = scanner
        fastChain.current = 0;
        lastKeyTs.current = 0;
        if (v.length === 0) return;
        e.preventDefault();
        if (onScan) onScan(v);
        if (wasScan && clearOnScan && onChange) onChange('');
        return;
      }
      if (e.key.length === 1) {
        if (now - lastKeyTs.current < FAST_MS) fastChain.current += 1;
        else fastChain.current = 1;
        lastKeyTs.current = now;
      }
    }

    return (
      <div className={cn('relative', containerClassName)}>
        {showIcon && (
          <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={innerRef}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(showIcon && 'pl-9', className)}
          inputMode="text"
          autoComplete="off"
          {...rest}
        />
      </div>
    );
  }
);
BarcodeInput.displayName = 'BarcodeInput';
