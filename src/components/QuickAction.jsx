const buttonClassByVariant = {
  primary: 'button-primary',
  secondary: 'button-secondary',
}

export function QuickAction({ title, description, variant = 'primary' }) {
  return (
    <article className="card flex flex-col items-start">
      <h3 className="m-0 text-xl font-bold">{title}</h3>
      <p className="mt-3 flex-1 text-slate-700">{description}</p>
      <button type="button" className={`${buttonClassByVariant[variant]} mt-4 w-full`}>
        {title}
      </button>
    </article>
  )
}
