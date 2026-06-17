export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    const first = err.errors[0]
    const field = first?.path?.join('.') || 'unknown'
    const detail = first?.message || 'Invalid value'
    return res.status(400).json({ message: `${field}: ${detail}` })
  }

  const status = err.status || 500
  const message = status === 500 ? 'Internal server error' : err.message

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({ message })
}
