'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesBarChartProps {
  salesData?: {
    day: string;
    amount: number;
  }[];
  loading?: boolean;
}

// Datos de ejemplo para cuando no hay datos reales
const defaultSalesData = [
  { day: 'Lunes', amount: 1200 },
  { day: 'Martes', amount: 1900 },
  { day: 'Miércoles', amount: 1500 },
  { day: 'Jueves', amount: 2100 },
  { day: 'Viernes', amount: 2800 },
  { day: 'Sábado', amount: 3200 },
  { day: 'Domingo', amount: 2500 },
];

export function SalesBarChart({ 
  salesData = defaultSalesData,
  loading = false 
}: SalesBarChartProps) {
  // Estado para los datos del gráfico - CORREGIDO: tipos explícitos
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Ventas ($)',
        data: [] as number[],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  });

  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          }
        }
      },
    },
  };

  // Actualizar los datos cuando cambien las props - CORREGIDO: sin dependencia circular
  useEffect(() => {
    if (!loading && salesData) {
      setChartData({
        labels: salesData.map(item => item.day),
        datasets: [
          {
            label: 'Ventas ($)',
            data: salesData.map(item => item.amount),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(34, 197, 94, 1)',
          },
        ],
      });
    }
  }, [salesData, loading]); // Removido chartData de las dependencias

  return (
    <Card className="rounded-xl shadow-md overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-400"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Ventas por Día</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-slate-200 border-t-green-500 animate-spin"></div>
          </div>
        ) : (
          <div className="h-[300px]">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}