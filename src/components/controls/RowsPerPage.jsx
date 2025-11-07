export default function RowsPerPage({ value = 10, onChange }) {
  const options = [10, 20, 50, 100]
  return (
    <div className="rows-per-page">
      <label htmlFor="rpp" className="rpp-label">Page Size</label>
      <select
        id="rpp"
        value={String(value)}
        onChange={(e)=> onChange?.(parseInt(e.target.value, 10))}
      >
        {options.map(n => (
          <option key={n} value={String(n)}>{n}</option>
        ))}
      </select>
    </div>
  )
}

