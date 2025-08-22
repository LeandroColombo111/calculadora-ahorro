import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  )

function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function simulate({ initial=0, monthly=0, years=10, annualReturnPct=0, annualInflationPct=0, frequency='annually' }) {
  const months = Math.max(1, Math.round(years*12))
  const compoundMonthly = frequency === 'monthly'
  const rMonth = num(annualReturnPct)/100/12
  const rYear = num(annualReturnPct)/100
  const iMonth = num(annualInflationPct)/100/12
  const iYear = num(annualInflationPct)/100

  let balance = num(initial)
  let contributed = num(initial)

  const rows = []
  for (let m=1; m<=months; m++) {
    if (compoundMonthly) balance *= (1 + rMonth)
    balance += monthly
    contributed += monthly
    if (!compoundMonthly && m % 12 === 0) balance *= (1 + rYear)

    if (m % 12 === 0) {
      const year = m/12
      const nominal = balance
      const inflationFactor = Math.pow(1 + (compoundMonthly ? iMonth : iYear), compoundMonthly ? m : year)
      const real = nominal / (inflationFactor || 1)
      rows.push({ year, nominal, real, contributed })
    }
  }
  return rows
}

export default function App() {
  const [initial, setInitial] = useState(600)
  const [monthly, setMonthly] = useState(600)
  const [years, setYears] = useState(30)
  const [annualReturnPct, setAnnualReturnPct] = useState(10)
  const [annualInflationPct, setAnnualInflationPct] = useState(3)
  const [frequency, setFrequency] = useState('annually')

  const data = useMemo(() => simulate({
    initial: num(initial),
    monthly: num(monthly),
    years: num(years),
    annualReturnPct: num(annualReturnPct),
    annualInflationPct: num(annualInflationPct),
    frequency,
  }), [initial, monthly, years, annualReturnPct, annualInflationPct, frequency])

  const last = data[data.length-1] || { year: 0, nominal: 0, real: 0, contributed: 0 }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7" />
          <h1 className="text-2xl md:text-3xl font-semibold">Calculadora de Ahorro con Inflación</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl shadow-sm bg-white p-4">
            <p className="text-sm text-slate-500">En {last.year} años tendrás (Nominal)</p>
            <p className="text-2xl md:text-3xl font-bold">{fmtMoney(last.nominal)}</p>
          </div>
          <div className="rounded-2xl shadow-sm bg-white p-4">
            <p className="text-sm text-slate-500">A valor de hoy (Real)</p>
            <p className="text-2xl md:text-3xl font-bold">{fmtMoney(last.real)}</p>
          </div>
          <div className="rounded-2xl shadow-sm bg-white p-4">
            <p className="text-sm text-slate-500">Aportes Totales</p>
            <p className="text-2xl md:text-3xl font-bold">{fmtMoney(last.contributed)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
          <div>
            <label className="text-sm font-medium">Inversión inicial</label>
            <input type="number" value={initial} min={0} onChange={(e)=>setInitial(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Aporte mensual</label>
            <input type="number" value={monthly} min={0} onChange={(e)=>setMonthly(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Años</label>
            <input type="number" value={years} min={1} onChange={(e)=>setYears(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Tasa anual estimada (%)</label>
            <input type="number" value={annualReturnPct} onChange={(e)=>setAnnualReturnPct(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Inflación anual (%)</label>
            <input type="number" value={annualInflationPct} onChange={(e)=>setAnnualInflationPct(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Frecuencia de capitalización</label>
            <select value={frequency} onChange={(e)=>setFrequency(e.target.value)} className="mt-1 w-full rounded-xl border p-2">
              <option value="annually">Anual</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Ahorro total</h2>
          <div className="w-full h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tickFormatter={(y)=>`Año ${y}`} />
                <YAxis tickFormatter={(v)=> new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)} />
                <Tooltip formatter={(v)=>fmtMoney(v)} labelFormatter={(y)=>`Año ${y}`} />
                <Legend />
                <Line type="monotone" dataKey="nominal" name="Valor futuro (nominal)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="real" name="Valor real (ajustado)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="contributed" name="Aportes totales" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          * El valor real se calcula trayendo el valor nominal a precios de hoy usando la inflación anual indicada.
          * Este gráfico es ilustrativo y no constituye asesoramiento financiero.
        </p>
      </div>
    </div>
  )
}