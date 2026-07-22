import { useState } from "react";
import { Search, Eye, Star } from "lucide-react";
import { Vendor } from "../../App";
import { VendorDetailModal } from "./VendorDetailModal";
import { Badge } from "../ui/badge";

interface VendorListViewProps {
  vendors: Vendor[];
  onVendorUpdate: (vendor: Vendor) => void;
}

export function VendorListView({
  vendors,
  onVendorUpdate,
}: VendorListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] =
    useState<Vendor | null>(null);
  const [showFinanceFilter, setShowFinanceFilter] =
    useState(false);
  const [selectedFinanceOption, setSelectedFinanceOption] =
    useState<string | null>(null);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.companyName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vendor.npwp.includes(searchTerm) ||
      vendor.bank
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: Vendor["status"]) => {
    const styles = {
      verified:
        "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-blue-100 text-blue-700 border-blue-200",
      "need-verification":
        "bg-yellow-100 text-yellow-700 border-yellow-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };

    const labels = {
      verified: "Terverifikasi",
      pending: "Menunggu Verifikasi",
      "need-verification": "Perlu Verifikasi",
      rejected: "Ditolak",
    };

    return (
      <Badge className={`${styles[status]} border font-medium`}>
        {labels[status]}
      </Badge>
    );
  };

  const getFinancialRating = (vendor: Vendor) => {
    if (!vendor.financialScore) return null;

    const avg =
      Object.values(vendor.financialScore).reduce(
        (a, b) => a + b,
        0,
      ) / 5;

    if (avg >= 90)
      return {
        stars: 5,
        label: "Excellent",
        color: "text-yellow-500",
      };
    if (avg >= 80)
      return {
        stars: 4,
        label: "Very Good",
        color: "text-yellow-500",
      };
    if (avg >= 70)
      return {
        stars: 3,
        label: "Good",
        color: "text-yellow-500",
      };
    if (avg >= 60)
      return {
        stars: 2,
        label: "Fair",
        color: "text-gray-400",
      };
    return { stars: 1, label: "Poor", color: "text-gray-400" };
  };

  const financeFilterOptions = [
    { value: null, label: "Tidak ada saldo" },
    {
      value: "under-100m",
      label: "Saldo rata-rata dana di bawah Rp 100 Juta",
    },
    {
      value: "100-500m",
      label: "Saldo rata-rata dana di atas Rp 100-500 Juta",
    },
    {
      value: "above-500m",
      label: "Saldo rata-rata dana diatas 500 Juta",
    },
    {
      value: "mandiri-debitur",
      label: "Sudah menjadi debitur Bank Mandiri",
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Verifikasi Bank
        </h1>
        <p className="text-sm text-gray-600">Verifikasi Bank</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daftar Perusahaan Rekanan
        </h3>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm text-gray-600">
              entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Search:
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari perusahaan..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  NO
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Nama Perusahaan
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Nama Bank
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Penilaian
                  <br />
                  Keuangan
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-gray-300"
                      />
                    ))}
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Penilaian
                  <br />
                  Kinerja
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-gray-300"
                      />
                    ))}
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Total
                  <br />
                  Penilaian
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-gray-300"
                      />
                    ))}
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor, index) => {
                const rating = getFinancialRating(vendor);

                return (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 text-sm">
                        {vendor.companyName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {vendor.bank}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {vendor.bankName}
                    </td>

                    {/* Financial Rating */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        {rating ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating.stars
                                    ? `${rating.color} fill-current`
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Performance Rating */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        {rating ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating.stars
                                    ? `${rating.color} fill-current`
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Rating */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        {rating ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating.stars
                                    ? `${rating.color} fill-current`
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(vendor.status)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() =>
                          setSelectedVendor(vendor)
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredVendors.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-gray-500"
                  >
                    Tidak ada data vendor yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredVendors.length > 0 ? "1" : "0"} to{" "}
            {Math.min(10, filteredVendors.length)} of{" "}
            {filteredVendors.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded">
              1
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Finance Filter Modal */}
      {showFinanceFilter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Nilai Finance
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedFinanceOption || ""}
                  onChange={(e) =>
                    setSelectedFinanceOption(
                      e.target.value || null,
                    )
                  }
                >
                  <option value="">Pilih</option>
                  {financeFilterOptions.map((option, index) => (
                    <option
                      key={index}
                      value={option.value || ""}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-green-600">
                  Tidak ada saldo (1)
                </div>
                <div className="text-green-600">
                  Saldo rata-rata dana di bawah Rp 100 Juta (2)
                </div>
                <div className="text-green-600">
                  Saldo rata-rata dana di atas Rp 100-500 Juta
                  (2)
                </div>
                <div className="text-green-600">
                  Saldo rata-rata dana diatas 500 Juta (2)
                </div>
                <div className="text-green-600">
                  Sudah menjadi debitur Bank Mandiri (5)
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowFinanceFilter(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowFinanceFilter(false);
                  // Apply filter logic here
                }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onUpdate={onVendorUpdate}
        />
      )}
    </div>
  );
}