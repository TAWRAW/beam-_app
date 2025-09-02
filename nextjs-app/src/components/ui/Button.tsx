import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline'
}

export default function Button({ variant = 'primary', className, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'outline' && 'border',
        className,
      )}
    />
  )
}

