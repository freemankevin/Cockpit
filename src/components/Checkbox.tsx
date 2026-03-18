import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Checkbox = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = ''
}: CheckboxProps) => {
  const sizeClasses = {
    sm: 'checkbox-macos-sm',
    md: '',
    lg: 'checkbox-macos-lg'
  };

  return (
    <label className={`checkbox-macos ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0"
      />
      <div className="checkbox-custom">
        <Check className="checkbox-check w-3 h-3 text-white stroke-[3]" />
      </div>
    </label>
  );
};

export default Checkbox;