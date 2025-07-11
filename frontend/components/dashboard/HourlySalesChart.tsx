'use client'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface HourlySalesChartProps {
  hourlyData?: {
    hour: string;
    amount: number;
  }[];
  loading?: boolean;
}

// Datos de ejemplo para cuando no hay datos reales
const defaultHourlyData = [
  { hour: '10:00', amount: 200 },
  { hour: '11:00', amount: 350 },
  { hour: '12:00', amount: 800 },
  { hour: '13:00', amount: 950 },
  { hour: '14:00', amount: 500 },
  { hour: '15:00', amount: 450 },
  { hour: '16:00', amount: 300 },
  { hour: '17:00', amount: 400 },
  { hour: '18:00', amount: 650 },
  { hour: '19:00', amount: 700 },
  { hour: '20:00', amount: 850 },
  { hour: '21:00', amount: 950 },
  { hour: '22:00', amount: 750 },
  { hour: '23:00', amount: 400 },
];

export function HourlySalesChart({ 
  hourlyData = defaultHourlyData,
  loading = false 
}: HourlySalesChartProps) {
  // Estado para los datos del gráfico
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        fill: true,
        label: 'Ventas por Hora',
        data: [] as number[],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        }
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

  // Actualizar los datos cuando cambien las props
  useEffect(() => {
    if (!loading && hourlyData) {
      setChartData({
        labels: hourlyData.map(item => item.hour),
        datasets: [
          {
            fill: true,
            label: 'Ventas por Hora',
            data: hourlyData.map(item => item.amount),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      });
    }
  }, [hourlyData, loading]); // Removí chartData de las dependencias

  return (
    <Card className="rounded-xl shadow-md overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-400"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Ventas por Hora</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin"></div>
          </div>
        ) : (
          <div className="h-[300px]">
            <Line data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}