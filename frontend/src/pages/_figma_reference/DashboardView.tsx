import { Building2, TrendingUp, FileCheck } from "lucide-react";
import { Vendor, Project } from "../../App";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface DashboardViewProps {
  vendors: Vendor[];
  projects: Project[];
}

export function DashboardView({
  vendors,
  projects,
}: DashboardViewProps) {
  // Calculate statistics
  const mandiriVendors = vendors.filter(
    (v) => v.bank === "Mandiri",
  );
  const otherBankVendors = vendors.filter(
    (v) => v.bank !== "Mandiri",
  );

  const totalMandiriHPS = projects
    .filter((p) => p.bank === "Mandiri")
    .reduce((sum, p) => sum + p.hps, 0);

  const totalOtherHPS = projects
    .filter((p) => !p.bank || p.bank !== "Mandiri")
    .reduce((sum, p) => sum + p.hps, 0);

  const totalProjects = projects.length;
  const totalHPS = totalMandiriHPS + totalOtherHPS;

  const projectsByType = projects.reduce(
    (acc, project) => {
      const existing = acc.find(
        (item) => item.type === project.type,
      );
      if (existing) {
        existing.count += 1;
        existing.value += project.budget;
      } else {
        acc.push({
          type: project.type,
          count: 1,
          value: project.budget,
        });
      }
      return acc;
    },
    [] as { type: string; count: number; value: number }[],
  );

  // Status breakdown
  const statusData = [
    {
      name: "Registrasi",
      value: vendors.filter((v) => v.status === "pending")
        .length,
      color: "#3b82f6",
    },
    {
      name: "Terverifikasi",
      value: vendors.filter((v) => v.status === "verified")
        .length,
      color: "#10b981",
    },
    {
      name: "Perlu Verifikasi",
      value: vendors.filter(
        (v) => v.status === "need-verification",
      ).length,
      color: "#f59e0b",
    },
    {
      name: "Ditolak",
      value: vendors.filter((v) => v.status === "rejected")
        .length,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-gray-600">Dashboard</p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Bank Mandiri Card */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 mx-auto">
            <img
              src="https://upload.wikimedia.org/wikipedia/id/thumb/f/fa/Bank_Mandiri_logo.svg/1280px-Bank_Mandiri_logo.svg.png"
              alt="Mandiri"
              className="w-12 h-12 object-contain"
            />
          </div>

          <h3 className="text-center text-xl font-semibold mb-6">
            Bank Mandiri
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">
                Total Pengadaan
              </span>
              <span className="font-bold">
                {
                  projects.filter((p) => p.bank === "Mandiri")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total HPS</span>
              <span className="font-bold">
                {formatCurrency(totalMandiriHPS)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Lainnya Card */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 mx-auto">
            <Building2 className="w-10 h-10 text-teal-600" />
          </div>

          <h3 className="text-center text-xl font-semibold mb-6">
            Bank Lainnya
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">
                Total Pengadaan
              </span>
              <span className="font-bold">
                {
                  projects.filter(
                    (p) => !p.bank || p.bank !== "Mandiri",
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total HPS</span>
              <span className="font-bold">
                {formatCurrency(totalOtherHPS)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Pengadaan Card */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 mx-auto">
            <TrendingUp className="w-10 h-10 text-pink-500" />
          </div>

          <h3 className="text-center text-xl font-semibold mb-4">
            Total Pengadaan
          </h3>
          <div className="text-center text-4xl font-bold mb-2">
            {totalProjects}
          </div>
          <div className="text-center text-sm opacity-90 mb-4">
            {formatCurrency(totalHPS)}
          </div>

          <div className="space-y-2 pt-4 border-t border-white/20">
            {projectsByType.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="opacity-90">
                  Pengadaan {item.type}
                </span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Jumlah Perusahaan per Status
          </h3>

          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${value}`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Tidak ada data
            </div>
          )}

          {/* Status Counts */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Registrasi:</span>
              <span className="font-semibold text-blue-600">
                {
                  vendors.filter((v) => v.status === "pending")
                    .length
                }{" "}
                Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Terverifikasi:
              </span>
              <span className="font-semibold text-green-600">
                {
                  vendors.filter((v) => v.status === "verified")
                    .length
                }{" "}
                Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Perlu Verifikasi:
              </span>
              <span className="font-semibold text-orange-600">
                {
                  vendors.filter(
                    (v) => v.status === "need-verification",
                  ).length
                }{" "}
                Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total Vendor:
              </span>
              <span className="font-semibold text-gray-900">
                {vendors.length} Perusahaan
              </span>
            </div>
          </div>
        </div>

        {/* Recent Verifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Perusahaan Membutuhkan Verifikasi
          </h3>

          <div className="space-y-3">
            {vendors
              .filter((v) => v.status === "verified")
              .slice(0, 5)
              .map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {vendor.companyName}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Status:{" "}
                      <span className="text-emerald-600 font-medium">
                        Terverifikasi
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {vendors.filter((v) => v.status === "verified")
              .length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada perusahaan yang telah diverifikasi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifikasi Pengadaan */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifikasi Pengadaan
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    NO
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    MESSAGE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    TAHAPAN
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    STATUS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    Tidak ada notifikasi
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
              « Sebelumnya
            </button>
            <button className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded">
              1
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
              Berikutnya »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}