import { InputHTMLAttributes, forwardRef, ReactNode, useState, useRef, useImperativeHandle } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suggestions?: string[];
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', value, type, suggestions, onChange, onBlur, ...props }, ref) => {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const localRef = useRef<HTMLInputElement>(null);

    // Permitir al ref externo acceder al elemento input
    useImperativeHandle(ref, () => localRef.current!);

    // 🛡️ FILTRO ANTI-NaN: Si el input es numérico y el valor es NaN, lo transformamos 
    // en un string vacío.
    const cleanValue = type === 'number' && Number.isNaN(value) ? '' : (value ?? '');

    // Si el valor no es undefined, es un componente controlado.
    // Si es undefined, dejamos que actúe de manera no controlada (como con react-hook-form)
    // para que no bloquee el ingreso de datos.
    const inputProps = value !== undefined ? { value: cleanValue } : {};

    const handleFocus = () => {
      setFocused(true);
      setQuery(localRef.current?.value || '');
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Retrasar el cierre para permitir el evento click/mouseDown en la lista de sugerencias
      setTimeout(() => {
        setFocused(false);
      }, 200);
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };

    const selectSuggestion = (suggestion: string) => {
      if (localRef.current) {
        // Actualizamos el valor nativo del elemento input
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(localRef.current, suggestion);
        } else {
          localRef.current.value = suggestion;
        }

        // Limpiamos el trackeo de valor interno de React
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tracker = (localRef.current as any)._valueTracker;
        if (tracker) {
          tracker.setValue('');
        }

        // Despachamos el evento de input para react-hook-form
        const event = new Event('input', { bubbles: true });
        localRef.current.dispatchEvent(event);

        // Llamamos directamente a onChange de react-hook-form para asegurar que se registre el cambio en React 19
        if (onChange) {
          onChange({
            target: {
              name: props.name || '',
              value: suggestion,
            },
          } as any); // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }

        setQuery(suggestion);
      }
      setFocused(false);
    };

    // Filtrar las sugerencias que contengan la consulta (sin distinguir mayúsculas/minúsculas)
    // y excluir la sugerencia si coincide exactamente con lo ingresado
    const filtered = suggestions
      ? suggestions.filter(
          (s) =>
            s.toLowerCase().includes(query.toLowerCase()) &&
            s.toLowerCase() !== query.toLowerCase()
        )
      : [];

    return (
      <div className="w-full relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={localRef}
            type={type}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`block w-full rounded-lg border ${
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            } ${
              icon ? 'pl-10' : 'pl-3'
            } pr-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${className}`}
            {...inputProps}
            {...props}
          />
        </div>

        {/* Lista de autocompletado */}
        {focused && filtered.length > 0 && (
          <ul className="absolute z-[100] w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
            {filtered.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-green-50 hover:text-green-800 cursor-pointer text-gray-700 text-sm transition-colors"
                onMouseDown={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;


// ==========================================
// Componente Select Reutilizable
// ==========================================
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', value, ...props }, ref) => {
    
    // 🛡️ Protección de valor nulo o indefinido para el elemento Select
    const cleanValue = value ?? '';
    const selectProps = value !== undefined ? { value: cleanValue } : {};

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`block w-full rounded-lg border ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
          } px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 transition-colors ${className}`}
          {...selectProps}
          {...props}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';


// ==========================================
// Componente TextArea Reutilizable
// ==========================================
interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, rows = 3, className = '', value, ...props }, ref) => {
    
    // 🛡️ Protección de valor nulo o indefinido para el elemento TextArea
    const cleanValue = value ?? '';
    const textAreaProps = value !== undefined ? { value: cleanValue } : {};

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`block w-full rounded-lg border ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
          } px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${className}`}
          {...textAreaProps}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';